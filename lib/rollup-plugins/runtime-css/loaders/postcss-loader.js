"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostcssLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const import_cwd_1 = __importDefault(require("import-cwd"));
const postcss_load_config_1 = __importDefault(require("postcss-load-config"));
const safe_identifier_1 = require("safe-identifier");
const postcss_1 = __importDefault(require("postcss"));
const types_1 = require("./types");
const hash_1 = require("../../../utils/hash");
const ensurePostCSSOption = (option) => typeof option === 'string' ? (0, import_cwd_1.default)(option) : option;
const isModuleFile = (file) => (/\.module\.[a-z]{2,6}$/.test(file));
function escapeClassNameDashes(string) {
    return string.replace(/-+/g, match => {
        return `$${match.replace(/-/g, '_')}$`;
    });
}
function ensureClassName(name) {
    name = escapeClassNameDashes(name);
    return (0, safe_identifier_1.identifier)(name, false);
}
function loadConfig(config) {
    if (config) {
        if (!fs_1.default.existsSync(config)) {
            config = path_1.default.join(process.cwd(), config);
        }
        return (0, postcss_load_config_1.default)({}, config).catch((err) => {
            if (!err.message.includes('No PostCSS Config found')) {
                throw err;
            }
            return {};
        });
    }
    return Promise.resolve({});
}
class PostcssLoader extends types_1.Loader {
    constructor() {
        super(...arguments);
        this.name = 'postcss';
        this.alwaysProcess = true;
        this.extensions = ['.less', '.css'];
    }
    async process(chunk, context) {
        // 参数初始化
        const { output, stylesRelative = '', assetsRelative = '', plugins = [], config: configPath, injectStyle = false, modules = { force: false, auto: true, namedExports: true }, ...othersOptions } = this.options;
        const config = await loadConfig(configPath);
        const { force, auto, namedExports, ...modulesOptions } = modules;
        const useModules = force || (auto && isModuleFile(context.id));
        const modulesExported = {}; // css 模块化对象
        // 处理插件列表
        const usePlugins = [
            ...plugins,
            ...(config.plugins || []),
            // 处理 url
            require('postcss-url')({ url: 'copy', assetsPath: path_1.default.join(output, assetsRelative), useHash: true })
        ];
        if (useModules) {
            // css module
            usePlugins.unshift(require('postcss-modules')({
                generateScopedName: '[name]_[local]__[hash:base64:5]',
                ...modulesOptions,
                getJSON(filepath, json, outpath) {
                    modulesExported[filepath] = json;
                    if (typeof (modulesOptions === null || modulesOptions === void 0 ? void 0 : modulesOptions.getJSON) === 'function') {
                        modulesOptions.getJSON(filepath, json, outpath);
                    }
                }
            }));
        }
        // 处理配置对象
        const postcssOptions = {
            ...othersOptions,
            ...(config.options || {}),
            to: path_1.default.join(output, path_1.default.parse(context.id).base),
            from: context.id,
        };
        postcssOptions.parser = ensurePostCSSOption(postcssOptions.parser);
        postcssOptions.syntax = ensurePostCSSOption(postcssOptions.syntax);
        postcssOptions.stringifier = ensurePostCSSOption(postcssOptions.stringifier);
        // 设置 prev sourceMap
        if (chunk.map && postcssOptions.map) {
            postcssOptions.map.prev = typeof chunk.map === 'string' ? JSON.parse(chunk.map) : chunk.map;
        }
        const result = await (0, postcss_1.default)(usePlugins).process(chunk.code, postcssOptions);
        // 添加依赖文件
        for (const message of result.messages) {
            if (message.type === 'dependency')
                context.dependencies.add(message.file);
        }
        // 添加警告信息
        for (const warning of result.warnings()) {
            if (!('message' in warning)) {
                warning.message = warning.text;
            }
            context.warn(warning);
        }
        // 处理 sourceMap
        const outputMap = result.map && JSON.parse(result.map.toString());
        // if (outputMap && outputMap.sources) {
        //     outputMap.sources = outputMap.sources.map(v => normalizePath(v))
        // }
        let code = '';
        const extracted = {
            id: context.id,
            code: result.css,
            map: outputMap,
            hash: `${(0, hash_1.getHash)(result.css, context.id)}`
        };
        if (namedExports) {
            const json = modulesExported[context.id];
            const getClassName = typeof namedExports === 'function' ? namedExports : ensureClassName;
            for (const name in json) {
                const newName = getClassName(name);
                if (!json[newName]) {
                    json[newName] = json[name];
                }
                code += `export var ${newName} = ${JSON.stringify(json[name])};\n`;
            }
        }
        if (!injectStyle) {
            return {
                code: code + `export default ${JSON.stringify(modulesExported[context.id])};`,
                extracted,
                map: outputMap,
            };
        }
        const injectOptions = typeof injectStyle === 'object' ? { ...injectStyle, stylesRelative, hash: extracted.hash } : { stylesRelative, hash: extracted.hash };
        const cssVariableName = (0, safe_identifier_1.identifier)('css', true);
        const module = useModules ? JSON.stringify(modulesExported[context.id]) : cssVariableName;
        code = `import $__inject_styles from "mf-build/lib/runtimes/inject-style";\n` + code;
        code += `var ${cssVariableName} = ${JSON.stringify(result.css)};\n`;
        code += `$__inject_styles(${cssVariableName}, ${JSON.stringify(injectOptions)});\n`;
        code += `export default ${module};\n`;
        return {
            code,
            map: outputMap,
        };
    }
    ;
}
exports.PostcssLoader = PostcssLoader;
