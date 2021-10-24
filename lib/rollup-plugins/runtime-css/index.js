"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 处理 css 以及其引用的图片等资源
 */
const path_1 = __importDefault(require("path"));
const rollup_pluginutils_1 = require("rollup-pluginutils");
const concat_with_sourcemaps_1 = __importDefault(require("concat-with-sourcemaps"));
const loaders_1 = __importDefault(require("./loaders"));
const normalize_path_1 = __importDefault(require("./utils/normalize-path"));
const safe_id_1 = require("./utils/safe-id");
const constants_1 = require("./constants");
/**
 * The options that could be `boolean` or `object`
 * We convert it to an object when it's truthy
 * Otherwise fallback to default value
 */
function inferOption(option, defaultValue) {
    if (option === false)
        return false;
    if (option && typeof option === 'object')
        return option;
    return option ? {} : defaultValue;
}
/**
 * 默认的 inject 配置
 * @param {*} injectConfig
 * @returns
 */
function inferInject(injectConfig = { type: 'link', injectCode: null }) {
    let { type = 'link', injectCode, ...others } = injectConfig;
    if (!injectCode) {
        injectCode = (info) => {
            const paramsString = JSON.stringify({ ...info, type });
            let code = '';
            code += `import injectStyles from "${constants_1.Virtual_Inject_Module_Id}";\n`;
            code += `injectStyles(${paramsString});\n`;
            return code;
        };
    }
    return { type, injectCode, ...others };
}
/**
 * Recursively get the correct import order from rollup
 * We only process a file once
 *
 * @param {string} id
 * @param {Function} getModuleInfo
 * @param {Set<string>} seen
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
/* eslint import/no-anonymous-default-export: [2, {"allowArrowFunction": true}] */
exports.default = (options = {}) => {
    const filter = (0, rollup_pluginutils_1.createFilter)(options.include, options.exclude);
    const postcssPlugins = Array.isArray(options.plugins) ? options.plugins.filter(Boolean) : options.plugins;
    const { sourceMap } = options;
    const inject = inferInject(options.inject);
    const postcssLoaderOptions = {
        /** 注入 css 的方式 的配置 */
        inject,
        /** 合并所有的 css 代码到一个外部文件上 */
        combineExtract: inject.type === 'link' && !!options.combineExtract,
        /** 生产的css文件与js文件的相对位置 */
        relativeBase: options.relativeBase || '',
        /** css 文件的最终输出目录，绝对路径 */
        output: options.output,
        /** css modules 配置  */
        modules: inferOption(options.modules, false),
        namedExports: options.namedExports,
        /** Automatically CSS modules for .module.xxx files */
        autoModules: options.autoModules,
        /** Postcss config file */
        config: inferOption(options.config, {}),
        /** PostCSS options */
        postcss: {
            parser: options.parser,
            plugins: postcssPlugins,
            syntax: options.syntax,
            stringifier: options.stringifier,
            exec: options.exec
        }
    };
    // loader 配置
    let use = ['stylus', 'less'];
    if (Array.isArray(options.use)) {
        use = options.use;
    }
    else if (options.use !== null && typeof options.use === 'object') {
        use = [
            ['stylus', options.use.stylus || {}],
            ['less', options.use.less || {}]
        ];
    }
    use.unshift(['postcss', postcssLoaderOptions]);
    const loaders = new loaders_1.default({
        use,
        loaders: options.loaders,
        extensions: options.extensions
    });
    // 引出的文件集合
    const extracted = new Map();
    const assetsEmited = new Set();
    return {
        name: 'postcss',
        resolveId(source) {
            if (source === constants_1.Virtual_Inject_Module_Id) {
                return source;
            }
            return null;
        },
        async load(id) {
            if (id === constants_1.Virtual_Inject_Module_Id) {
                return constants_1.Virtual_Inject_Module_Code;
            }
            return null;
        },
        async transform(code, id) {
            console.log(id);
            // 给入口文件添加引入主css的代码
            if (postcssLoaderOptions.combineExtract) {
                const { isEntry } = this.getModuleInfo(id);
                if (isEntry) {
                    return constants_1.Entry_Css_Str_Tpl_Code + '\n\n;' + code;
                }
            }
            // 过滤掉不处理的类型
            if (!filter(id) || !loaders.isSupported(id)) {
                return null;
            }
            // loader.process的 this 对象
            const loaderContext = {
                id,
                sourceMap,
                dependencies: new Set(),
                assets: new Map(),
                warn: this.warn.bind(this),
                plugin: this
            };
            // 执行处理
            const result = await loaders.process({ code, map: undefined }, loaderContext);
            // 获取依赖文件，加入监听列表
            for (const dep of loaderContext.dependencies) {
                this.addWatchFile(dep);
            }
            // 输出静态文件
            for (const [fileName, source] of loaderContext.assets) {
                if (!assetsEmited.has(fileName)) {
                    this.emitFile({ type: "asset", fileName, source });
                    assetsEmited.add(fileName);
                }
            }
            // 通过外链方式引入，需要输出 css 资源文件
            if (postcssLoaderOptions.inject.type === 'link') {
                if (postcssLoaderOptions.combineExtract) {
                    extracted.set(id, result.extracted);
                }
                else if (result.extracted) {
                    // 输出 css 资源文件
                    let { code, map, chunkName } = result.extracted;
                    if (map) {
                        code += `\n/*# sourceMappingURL=./${path_1.default.parse(chunkName).base}.map */`;
                        this.emitFile({ type: "asset", fileName: `${chunkName}.map`, source: JSON.stringify(map) });
                    }
                    this.emitFile({ type: "asset", fileName: chunkName, source: code });
                }
                return { code: result.code, map: { mappings: '' } };
            }
            return { code: result.code, map: result.map || { mappings: '' } };
        },
        augmentChunkHash() {
            if (extracted.size === 0)
                return;
            // eslint-disable-next-line unicorn/no-reduce
            const extractedValue = [...extracted].reduce((object, [key, value]) => ({
                ...object,
                [key]: value
            }), {});
            return JSON.stringify(extractedValue);
        },
        async generateBundle(writeOptions, bundle) {
            if (extracted.size === 0 || !(writeOptions.dir || writeOptions.file)) {
                return;
            }
            // 输出目录
            const dir = writeOptions.dir || path_1.default.dirname(writeOptions.file);
            // 入口chunk文件
            const entryChunkId = Object.keys(bundle).find(fileName => bundle[fileName].isEntry);
            // 入口chunk文件(输出位置)
            const entryFile = writeOptions.file || path_1.default.join(writeOptions.dir, entryChunkId);
            const getExtracted = () => {
                const entries = [...extracted.values()];
                // 根据引用关系，对入口 css 进行排序
                const { modules, facadeModuleId } = bundle[(0, normalize_path_1.default)(path_1.default.relative(dir, entryFile))];
                if (modules) {
                    const moduleIds = getRecursiveImportOrder(facadeModuleId, this.getModuleInfo);
                    entries.sort((a, b) => moduleIds.indexOf(a.id) - moduleIds.indexOf(b.id));
                }
                // 计算 hash 值
                const filehash = (0, safe_id_1.getSafeId)(entries.map(entry => entry.chunkName || entry.code).join('-'), path_1.default.basename(entryFile, path_1.default.extname(entryFile)));
                const fileName = `${filehash}.css`;
                // @ts-ignore 拼接代码
                const concat = new concat_with_sourcemaps_1.default(true, fileName, '\n');
                for (const result of entries) { // result = { id: this.id, code: result.css, map: outputMap, chunkName }
                    const relative = (0, normalize_path_1.default)(path_1.default.relative(dir, result.id));
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
                    codeFileName: postcssLoaderOptions.relativeBase + fileName,
                    mapFileName: postcssLoaderOptions.relativeBase + fileName + '.map'
                };
            };
            if (options.onExtract) {
                const shouldExtract = await options.onExtract(getExtracted);
                if (shouldExtract === false) {
                    return;
                }
            }
            let { code, codeFileName, map, mapFileName } = getExtracted();
            const entryChunk = bundle[entryChunkId];
            entryChunk.code = entryChunk.code.replace(constants_1.Entry_Css_Str_Tpl, codeFileName);
            this.emitFile({
                fileName: codeFileName,
                type: 'asset',
                source: code
            });
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
