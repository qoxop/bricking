"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 处理 css 以及其引用的图片等资源
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const concat_with_sourcemaps_1 = __importDefault(require("concat-with-sourcemaps"));
const rollup_pluginutils_1 = require("rollup-pluginutils");
const loaders_1 = __importDefault(require("./loaders/loaders"));
const hash_1 = require("../../utils/hash");
const paths_1 = require("../../utils/paths");
const constants_1 = require("../../constants");
/**
 * Recursively get the correct import order from rollup
 * We only process a file once
 */
function getRecursiveImportOrder(id, getModuleInfo, seen = new Set()) {
    if (seen.has(id)) {
        return [];
    }
    seen.add(id);
    const result = [id];
    getModuleInfo(id).importedIds.forEach(importFile => {
        result.push(...getRecursiveImportOrder(importFile, getModuleInfo, seen));
    });
    return result;
}
exports.default = (options) => {
    const filter = (0, rollup_pluginutils_1.createFilter)(options.include, options.exclude);
    const { output, stylesRelative = 'assets/', assetsRelative = '', sourceMap = false, useLoaders = [], modules, postcss, } = options;
    const modifyEntry = (('inject' in options) && options.inject.type === 'link');
    const needCombine = modifyEntry || ('extracted' in options && options.extracted);
    // add Less loader 
    if (useLoaders.every(item => !(('name' in item) && item.name === 'less'))) {
        useLoaders.unshift({ name: 'less' });
    }
    // add postcss loader
    const postcssConfigPath = path_1.default.resolve(process.cwd(), 'postcss.config.js');
    useLoaders.push({ name: 'postcss', options: {
            output,
            stylesRelative,
            assetsRelative,
            injectStyle: ('inject' in options) && options.inject.type === 'style' ? { ...(options.inject.options || {}) } : false,
            modules: modules || { auto: true, force: false, namedExports: false },
            plugins: postcss.plugins || [],
            syntax: postcss.syntax,
            parser: postcss.parser,
            stringifier: postcss.stringifier,
            config: fs_1.default.existsSync(postcssConfigPath) ? postcssConfigPath : false,
            map: postcss.map ? postcss.map : (sourceMap ? { inline: sourceMap === 'inline' } : false)
        } });
    const loaders = new loaders_1.default(useLoaders);
    // 引出的文件集合
    const extracted = new Map();
    return {
        name: 'runtime-css',
        async transform(code, id) {
            if (modifyEntry && this.getModuleInfo(id).isEntry) {
                return `import "${constants_1.STYLE_EXTERNALS_MODULE}"\n${code}`;
            }
            // 过滤掉不处理的类型
            if (!filter(id) || !loaders.isSupported(id))
                return null;
            // 配置 loader 上下文
            const loaderContext = {
                id,
                sourceMap,
                dependencies: new Set(),
                warn: this.warn.bind(this),
                rollupPlugin: this
            };
            // 执行处理
            const result = await loaders.process({ code, map: undefined }, loaderContext);
            // 获取依赖文件，加入监听列表
            for (const dep of loaderContext.dependencies) {
                this.addWatchFile(dep);
            }
            if (needCombine) {
                extracted.set(id, result.extracted);
            }
            return { code: result.code, map: result.map || { mappings: '' } };
        },
        augmentChunkHash() {
            if (extracted.size === 0)
                return;
            const extractedValue = [...extracted].reduce((object, [key, value]) => ({
                ...object,
                [key]: value
            }), {});
            return JSON.stringify(extractedValue);
        },
        async generateBundle(outputOptions, bundle) {
            if (extracted.size === 0 || !(outputOptions.dir || outputOptions.file))
                return;
            // 输出目录
            const dir = outputOptions.dir || path_1.default.dirname(outputOptions.file);
            // 入口 chunk
            const [entryChunkId, entryChunk] = Object.entries(bundle).find(([_, chunk]) => chunk.type === 'chunk' && chunk.isEntry);
            // 入口chunk文件(输出位置)
            const entryFile = outputOptions.file || path_1.default.join(outputOptions.dir, entryChunkId);
            const getExtracted = () => {
                const entries = [...extracted.values()];
                // 根据引用关系，对入口 css 进行排序
                const { modules, facadeModuleId } = entryChunk;
                if (modules) {
                    const moduleIds = getRecursiveImportOrder(facadeModuleId, this.getModuleInfo);
                    entries.sort((a, b) => moduleIds.indexOf(a.id) - moduleIds.indexOf(b.id));
                }
                // 计算 hash 值
                const filehash = (0, hash_1.getSafeId)(entries.map(entry => entry.hash || entry.code).join('-'), path_1.default.parse(entryFile).name);
                const fileName = `${filehash}.css`;
                // 拼接代码
                const concat = new concat_with_sourcemaps_1.default(true, fileName, '\n');
                for (const result of entries) {
                    const relative = (0, paths_1.normalizePath)(path_1.default.relative(dir, result.id));
                    const map = result.map || null;
                    if (map) {
                        map.file = fileName;
                    }
                    concat.add(relative, result.code, map);
                }
                let code = concat.content;
                if (sourceMap === 'inline') {
                    // @ts-ignore
                    code += `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(concat.sourceMap, 'utf8').toString('base64')}*/`;
                }
                else if (sourceMap === true) {
                    // @ts-ignore
                    code += `\n/*# sourceMappingURL=./${fileName}.map */`;
                }
                return {
                    code,
                    map: sourceMap === true && concat.sourceMap,
                    codeFileName: path_1.default.join(options.stylesRelative, fileName),
                    mapFileName: path_1.default.join(options.stylesRelative, fileName + '.map'),
                };
            };
            let { code, codeFileName, map, mapFileName } = getExtracted();
            // 替换
            entryChunk.code = entryChunk.code.replace(constants_1.STYLE_EXTERNALS_MODULE, `${constants_1.STYLE_EXTERNALS_MODULE}?link=./${codeFileName}`);
            this.emitFile({ fileName: codeFileName, type: 'asset', source: code });
            if (map) {
                this.emitFile({
                    fileName: mapFileName,
                    type: 'asset',
                    source: map
                });
            }
        }
    };
};
