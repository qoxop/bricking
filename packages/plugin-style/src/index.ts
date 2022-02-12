/**
 * 处理 css 以及其引用的图片等资源
 */
import fs from 'fs';
import url from 'url';
import path from 'path';
import Concat from 'concat-with-sourcemaps';
import { GetModuleInfo, OutputChunk, Plugin } from 'rollup'
import { createFilter } from 'rollup-pluginutils';
import { btkHash, btkPath } from '@bricking/toolkit'
import Loaders, { LoadersConfig } from './loaders/loaders';
import { STYLE_EXTERNALS_MODULE } from './constants';
import { ExtractedInfo, LoaderContext } from './loaders/types';

/**
 * Recursively get the correct import order from rollup
 * We only process a file once
 */
function getRecursiveImportOrder(id: string, getModuleInfo: GetModuleInfo, seen = new Set()): string[] {
    if (seen.has(id)) {
        return [];
    }
    seen.add(id);
    const result = [id];
    const info = getModuleInfo(id)
    if (info) {
        info.importedIds.forEach(importFile => {
            result.push(...getRecursiveImportOrder(importFile, getModuleInfo, seen))
        });
    }
    return result;
}
 
type HandleMode = { inject: { type: 'style'|'link', options?: any } } | { extracted: true }

type Options = HandleMode & {
    /**
     * 输出目录
     */
    output: string;
    /**
     * 编译哪些文件？
     */
    include?: any[];
    /**
     * 不编译哪些文件？
     */
    exclude?: any[];

    sourceMap?: boolean|"inline";
    useLoaders?: LoadersConfig[];
    postcss: {
        syntax?: any;
        parser?: any;
        stringifier?: any;
        plugins?: any[];
        map?: any;
    };
    modules: {
        auto: boolean;
        force: boolean;
        namedExports: boolean | Function;
        [key: string]: any;
    };
}
export default (options: Options): Plugin => {

    const filter = createFilter(options.include, options.exclude);
    const {
        output,
        stylesRelative = 'assets/',
        assetsRelative = '',
        sourceMap = false,
        useLoaders = [],
        modules,
        postcss,
    } = options;
    const modifyEntry = (('inject' in options) && options.inject.type === 'link');
    const needCombine = modifyEntry || ('extracted' in options && options.extracted);
    // add Less loader 
    if (useLoaders.every(item => !(('name' in item) && item.name === 'less'))) {
        useLoaders.unshift({name: 'less'});
    }
    // add postcss loader
    const postcssConfigPath = path.join(process.cwd(), 'postcss.config.js');
    useLoaders.push({name: 'postcss', options: {
        output,
        stylesRelative,
        assetsRelative,
        injectStyle: ('inject' in options) && options.inject.type === 'style' ? { ...(options.inject.options || {}) } : false,
        modules: modules || { auto: true, force: false, namedExports: false },
        plugins: postcss.plugins || [],
        syntax: postcss.syntax,
        parser: postcss.parser,
        stringifier: postcss.stringifier,
        config: fs.existsSync(postcssConfigPath) ? postcssConfigPath : false,
        map: postcss.map ? postcss.map : (sourceMap ? { inline: sourceMap === 'inline' } : false)
    }})

    const loaders = new Loaders(useLoaders);
    // 引出的文件集合
    const extracted = new Map<string, ExtractedInfo>();
    return {
        name: 'runtime-css',
        async transform(code: string, id: string) {
            if (modifyEntry) {
                const moduleInfo = this.getModuleInfo(id)
                if (moduleInfo && moduleInfo.isEntry) {
                    return `import "${STYLE_EXTERNALS_MODULE}"\n${code}`;
                }
            }
        // 过滤掉不处理的类型
        if (!filter(id) || !loaders.isSupported(id)) return null;
        // 配置 loader 上下文
        const loaderContext: LoaderContext ={
            id,
            sourceMap,
            dependencies: new Set(),
            warn: this.warn.bind(this),
            rollupPlugin: this
        }
        // 执行处理
        const result = await loaders.process({ code, map: undefined }, loaderContext);
        // 获取依赖文件，加入监听列表
        for (const dep of loaderContext.dependencies) {
            this.addWatchFile(dep)
        }
        if (needCombine) {
            extracted.set(id, result.extracted);
        }
        return { code: result.code, map: result.map || { mappings: '' } }
        },

        augmentChunkHash() {
        if (extracted.size === 0) return
        const extractedValue = [...extracted].reduce((object, [key, value]) => ({
            ...object,
            [key]: value
        }), {})
        return JSON.stringify(extractedValue)
        },

        async generateBundle(outputOptions, bundle) {
        if (extracted.size === 0 || !(outputOptions.dir || outputOptions.file)) return;

        // 输出目录
        const dir = outputOptions.dir || path.dirname(outputOptions.file);
        // 入口 chunk
        const [entryChunkId, entryChunk] = Object.entries(bundle).find(([_, chunk]) => chunk.type === 'chunk' && chunk.isEntry) as [string, OutputChunk]
        // 入口chunk文件(输出位置)
        const entryFile = outputOptions.file || path.join(outputOptions.dir, entryChunkId);

        const getExtracted = () => {
            const entries = [...extracted.values()];
            // 根据引用关系，对入口 css 进行排序
            const { modules, facadeModuleId } = entryChunk;
            if (modules) {
            const moduleIds = getRecursiveImportOrder(facadeModuleId, this.getModuleInfo);
            entries.sort((a, b) => moduleIds.indexOf(a.id) - moduleIds.indexOf(b.id))
            }
            // 计算 hash 值
            const filehash = btkHash.getSafeId(entries.map(entry => entry.hash || entry.code).join('-'), path.parse(entryFile).name);
            const fileName = `${filehash}.css`;
            // 拼接代码
            const concat = new Concat(true, fileName, '\n');
            for (const result of entries) {
            const relative = btkPath.normalizePath(path.relative(dir, result.id))
            const map = result.map || null
            if (map) {
                map.file = fileName
            }
            concat.add(relative, result.code, map)
            }

            let code = concat.content;
            if (sourceMap === 'inline') {
            // @ts-ignore
            code += `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(
                concat.sourceMap,
                'utf8'
            ).toString('base64')}*/`
            } else if (sourceMap === true) {
            // @ts-ignore
            code += `\n/*# sourceMappingURL=./${fileName}.map */`
            }

            return {
            code,
            map: sourceMap === true && concat.sourceMap,
            codeFileName: url.resolve(options.stylesRelative, fileName),
            mapFileName: path.join(options.stylesRelative, fileName + '.map'),
            }
        }

        let { code, codeFileName, map, mapFileName } = getExtracted();
        // 替换
        entryChunk.code = entryChunk.code.replace(STYLE_EXTERNALS_MODULE, `${STYLE_EXTERNALS_MODULE}?link=./${codeFileName}`);
        this.emitFile({ fileName: codeFileName, type: 'asset', source: code })
        if (map) {
            this.emitFile({
            fileName: mapFileName,
            type: 'asset',
            source: map
            })
        }
        }
    }
}
 