/**
 * 处理 css 以及其引用的图片等资源
 * 将所有的样式文件进行捆绑，统一通过入口 chunk 进行引入(通过 link 方式)
 */
import path from 'path';
import { createFilter } from 'rollup-pluginutils';
import Concat from 'concat-with-sourcemaps';
import { GetModuleInfo, OutputChunk, Plugin } from 'rollup';
import { btkHash, btkPath } from '@bricking/toolkit';
import { STYLE_EXTERNALS_MODULE } from './constants';
import transformCss, { PostCSSOptions } from './transform/transform-css';
import transformLess, { LessOption } from './transform/transform-less';
import transformSass, { SassOptions } from './transform/transform-sass';
import { CssLoaderProps } from './transform/types';

/**
 * 对模块ID按引用顺序进行排序
 * @param id 
 * @param getModuleInfo 
 * @param seen 
 * @returns
 */
function getRecursiveImportOrder(id: string, getModuleInfo: GetModuleInfo, seen = new Set()): string[] {
  if (seen.has(id)) return [];
  seen.add(id);
  const result = [id];
  const moduleInfo = getModuleInfo(id);
  if (moduleInfo) {
    moduleInfo.importedIds.forEach((importFile) => {
      result.push(...getRecursiveImportOrder(importFile, getModuleInfo, seen));
    });
  }
  return result;
}

const LessRegExp = /\.less$/;
const SassRegExp = /\.s(a|c)ss$/;
 
export type Options =  {
    /**
     * 文件命名规则，eg: `'base-dir/[name]-[hash][extname]'`
     * - `[hash]` - 文件 hash
     * - `[name]` - 文件名
     * - `[extname]` - 扩展名
     * @default '[hash][extname]'
     */
    filename?: string;
    /**
     * 是否开启 sourceMap
     */
    sourceMap?: boolean;
    /**
     * less 配置 
     * https://lesscss.org/usage/#less-options
     */
    less?: LessOption,
    /**
     * sass 配置 
     */
    sass?: SassOptions,
    /**
     * postcss 配置
     */
    postcss?: PostCSSOptions;
}

export default (options: Options): Plugin => {
  // 设置默认选项值
  const { filename = '[hash].css', sourceMap = true, postcss, less, sass } = options;
  // 过滤器
  const filter = createFilter([/\.css$/, LessRegExp, SassRegExp]);
  // css 文件集合
  const allCssFiles = new Map<string, { id: string; css: string; map: any; }>();

  return {
    name: 'bricking-runtime-css',
    async transform(code: string, id: string) {
      const moduleInfo = this.getModuleInfo(id);
      // 给入口文件添加导入样式的代码
      if (moduleInfo && moduleInfo.isEntry) {
        // @ts-ignore
        const concat = new Concat(true, id, '\n');
        concat.add(null,  `import "${STYLE_EXTERNALS_MODULE}";`)
        concat.add(id, code, this.getCombinedSourcemap().toString());
        return {
          code: concat.content.toString(),
          map: concat.sourceMap,
        }
      }
      // 过滤掉不处理的类型
      if (!filter(id)) return null;
      // 配置 loader 上下文
      const loaderProps: CssLoaderProps<any> = {
        content: code,
        filepath: id,
        sourceMap,
        context: {
          /** 依赖文件 */
          dependencies: new Set<string>(),
          /** Css 模块对象 */
          modules: {}
        },
        options: {}
      };
      let preSourceMap = null;
      if (LessRegExp.test(id) && less) {
        const data = await transformLess({ ...loaderProps, options: less });
        loaderProps.content = data.css;
        preSourceMap = data.map;
      }
      if (SassRegExp.test(id) && sass) {
        const data = await transformSass({ ...loaderProps, options: sass });
        loaderProps.content = data.css;
        preSourceMap = data.map;
      }
      const { css, map } = await transformCss({ ...loaderProps, options: postcss || {}, preSourceMap: preSourceMap });
      allCssFiles.set(id, { id, css, map });
      if (postcss?.module) {
        return `export default ${JSON.stringify(loaderProps.context.modules || {})}`;
      }
      return ''
    },

    augmentChunkHash(chunkInfo) {
      if (allCssFiles.size === 0 || !chunkInfo.isEntry) return;
      const extractedValue = [...allCssFiles].reduce((object, [key, value]) => ({
        ...object,
        [key]: value,
      }), {});
      return JSON.stringify(extractedValue);
    },

    async generateBundle(outputOptions, bundle) {
      if (allCssFiles.size === 0 || !(outputOptions.dir || outputOptions.file)) return;
      // 输出目录
      const dir = outputOptions.dir || path.dirname(outputOptions.file as string);
      // 入口 chunk
      const [entryChunkId, entryChunk] = Object.entries(bundle).find(([_, chunk]) => chunk.type === 'chunk' && chunk.isEntry) as [string, OutputChunk];
      // 入口chunk文件(输出位置)
      const entryFile = outputOptions.file || path.join(outputOptions.dir as string, entryChunkId);
      const entries = [...allCssFiles.values()];
      // 模块排序
      const { modules, facadeModuleId } = entryChunk;
      if (modules && facadeModuleId) {
        const moduleIds = getRecursiveImportOrder(facadeModuleId, this.getModuleInfo);
        entries.sort((a, b) => moduleIds.indexOf(a.id) - moduleIds.indexOf(b.id));
      }
      // 计算 hash 值
      const filehash = btkHash.getSafeId(entries.map((entry) => entry.css).join('-'), path.parse(entryFile).name);
      const fileName = filename.replace('[hash]', filehash);
      const mapFileName = `${fileName}.map`;
      // 拼接代码
      // @ts-ignore
      const concat = new Concat(true, fileName, '\n');
      for (const result of entries) {
        const relative = btkPath.normalizePath(path.relative(dir, result.id));
        const map = result.map || null;
        concat.add(relative, result.css, map);
      }
      const cssCode =  sourceMap ? concat.content.toString() + `\n/*# sourceMappingURL=./${path.basename(mapFileName)} */` :  concat.content.toString();
      // 替换
      entryChunk.code = entryChunk.code.replace(STYLE_EXTERNALS_MODULE, `${STYLE_EXTERNALS_MODULE}?link=./${fileName}`);
      // 输出
      this.emitFile({ fileName: fileName, type: 'asset', source: cssCode });
      if (sourceMap && concat.sourceMap) {
        this.emitFile({ fileName: mapFileName, type: 'asset', source: concat.sourceMap });
      }
    },
  };
};
