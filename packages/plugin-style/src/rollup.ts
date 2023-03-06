/**
 * 处理 css 以及其引用的图片等资源
 * 将所有的样式文件进行捆绑，统一通过入口 chunk 进行引入(通过 link 方式)
 */
import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import Concat from 'concat-with-sourcemaps';
import { GetModuleInfo, OutputChunk, Plugin } from 'rollup';
import { btkHash, btkPath } from '@bricking/toolkit';
import transformCss, { PostCSSOptions } from './transform/transform-css';
import transformLess, { LessOption } from './transform/transform-less';
import transformSass, { SassOptions } from './transform/transform-sass';
import { CssLoaderProps } from './transform/types';

const STYLE_EXTERNALS_MODULE = '___INJECT_STYLE_LINK___';
const PluginName = 'bricking-runtime-css';

function sortAllModules(entryChunks: [string, OutputChunk][], getModuleInfo: GetModuleInfo) {
  const seen = new Set<string>();
  // 对模块ID按引用顺序进行排序
  function getRecursiveImportOrder(id: string) {
    if (seen.has(id)) return;
    seen.add(id);
    const moduleInfo = getModuleInfo(id);
    if (moduleInfo && moduleInfo.importedIds) {
      moduleInfo.importedIds.forEach((importFile) => {
        getRecursiveImportOrder(importFile);
      });
    }
  }
  for (const chunk of entryChunks) {
    const { modules, facadeModuleId } = chunk[1];
    if (modules && facadeModuleId) {
      getRecursiveImportOrder(facadeModuleId);
    }
  }
  return [...seen];
}

const LessRegExp = /\.less$/;
const SassRegExp = /\.s[a,c]ss$/;

type RollupStylePluginOptions = {
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
     * - https://lesscss.org/usage/#less-options
     */
    less?: LessOption | boolean,
    /**
     * sass 配置
     * - https://sass-lang.com/documentation/js-api/interfaces/Options
     */
    sass?: Partial<SassOptions> | boolean,
    /**
     * postcss 配置
     */
    postcss?: PostCSSOptions;
}

/**
 * rollup 样式插件
 * 配合 @bricking/runtime 使用
 */
const rollupStylePlugin = (options: RollupStylePluginOptions): Plugin => {
  // 设置默认选项值
  const { filename = '[hash].css', sourceMap = true, postcss, less, sass } = options;
  // 过滤器
  const filter = createFilter([/\.css$/, LessRegExp, SassRegExp]);
  // css 文件集合
  const allCssFiles = new Map<string, { id: string; css: string; map: any; }>();
  const remoteCssUrls = new Set<string>();
  return {
    name: PluginName,
    resolveId(source: string) {
      if (
        /^https?:\/\/.*\.css(\?.*)?$/.test(source) // 远程 css 文件
        || /^https?:\/\/.*\|css$/.test(source) // 远程 css 文件(兼容非 .css 后缀)
        || source === STYLE_EXTERNALS_MODULE
      ) {
        remoteCssUrls.add(source.replace(/\|css$/, ''));
        // 作为外部模块，不参与编译
        return { id: source, external: true };
      }
      return null;
    },
    async transform(code: string, id: string) {
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
          modules: {},
        },
        options: {},
      };
      let preSourceMap = null;
      if (LessRegExp.test(id) && less) {
        const data = await transformLess({ ...loaderProps, options: less === true ? {} : less });
        loaderProps.content = data.css;
        preSourceMap = data.map;
      }
      if (SassRegExp.test(id) && sass) {
        const data = await transformSass({ ...loaderProps, options: sass === true ? {} : sass });
        loaderProps.content = data.css;
        preSourceMap = data.map;
      }
      const { css, map } = await transformCss({ ...loaderProps, options: postcss || {}, preSourceMap });
      allCssFiles.set(id, { id, css, map });
      if (process.env.NODE_ENV === 'development') {
        loaderProps.context.dependencies.forEach((item) => {
          this.addWatchFile(item);
        });
      }
      if (postcss?.module) {
        return {
          code: `export default ${JSON.stringify(loaderProps.context.modules || {})}`,
          map: null,
        };
      }
      return {
        code: '',
        map: null,
      };
    },
    augmentChunkHash(chunkInfo) {
      if (allCssFiles.size === 0 || !chunkInfo.isEntry) return;
      const extractedValue = [...allCssFiles].reduce((object, [key, value]) => ({
        ...object,
        [key]: value,
      }), {});
      return JSON.stringify(extractedValue);
    },
    renderChunk(code, chunk, outputOptions) {
      // 如果存在样式文件
      if ((allCssFiles.size || remoteCssUrls.size) && chunk.isEntry && (outputOptions.dir || outputOptions.file)) {
        const newImports:string[] = [];
        const concat = new Concat(true, chunk.fileName, '\n');
        if (allCssFiles.size) {
          newImports.push(STYLE_EXTERNALS_MODULE);
          concat.add(null, `import "${STYLE_EXTERNALS_MODULE}";`);
        }
        if (remoteCssUrls.size) {
          remoteCssUrls.forEach((url) => {
            newImports.push(url);
            concat.add(null, `import "${url}";`);
          });
        }
        chunk.imports.unshift(...newImports);
        concat.add(chunk.fileName, code);
        return {
          code: concat.content.toString(),
          map: concat.sourceMap,
        };
      }
      return null;
    },
    async generateBundle(outputOptions, bundle) {
      // 前置判断
      if (allCssFiles.size === 0 || !(outputOptions.dir || outputOptions.file)) return;
      const dir = outputOptions.dir || path.dirname(outputOptions.file as string);
      const entryChunks = Object.entries(bundle).filter(([, chunk]) => chunk.type === 'chunk' && chunk.isEntry) as [string, OutputChunk][];
      if (!entryChunks.length) return;

      // 按引用顺序进行排序后的模块ID数组(由于多入口的原因，还是可能存在顺序误差)
      const sortedModuleIds = sortAllModules(entryChunks, this.getModuleInfo.bind(this));
      const cssEntries = [...allCssFiles.values()].sort((a, b) => sortedModuleIds.indexOf(a.id) - sortedModuleIds.indexOf(b.id));

      // 计算文件名称
      const getChunkNameIfOnlyOne = () => {
        if (entryChunks.length === 1) {
          const [[entryChunkId]] = entryChunks;
          const entryFile = outputOptions.file || path.join(outputOptions.dir as string, entryChunkId);
          return path.parse(entryFile).name;
        }
        return '';
      };
      const fileHash = btkHash.getHash(cssEntries.map((entry) => entry.css).join('-'), PluginName);
      const fileName = filename
        .replace('[name]', getChunkNameIfOnlyOne())
        .replace('[hash]', fileHash)
        .replace('[extname]', '.css');
      const mapFileName = `${fileName}.map`;

      // 拼接代码并输出
      const concat = new Concat(true, fileName, '\n');
      for (const result of cssEntries) {
        const relative = btkPath.normalizePath(path.relative(dir, result.id));
        const map = result.map || null;
        concat.add(relative, result.css, map);
      }
      const cssCode = sourceMap ? `${concat.content.toString()}\n/*# sourceMappingURL=./${path.basename(mapFileName)} */` : concat.content.toString();
      this.emitFile({ fileName, type: 'asset', source: cssCode });
      if (sourceMap && concat.sourceMap) {
        this.emitFile({ fileName: mapFileName, type: 'asset', source: concat.sourceMap });
      }
      entryChunks.forEach((chunk) => {
        // 替换成相对路径
        chunk[1].code = chunk[1].code.replace(STYLE_EXTERNALS_MODULE, `./${fileName}`);
      });
    },
  };
};

export {
  rollupStylePlugin,
  RollupStylePluginOptions,
};
