"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const import_cwd_1 = __importDefault(require("import-cwd"));
const postcss_1 = __importDefault(require("postcss"));
const postcss_load_config_1 = __importDefault(require("postcss-load-config"));
const safe_identifier_1 = require("safe-identifier");
const humanlize_path_1 = __importDefault(require("./utils/humanlize-path"));
const normalize_path_1 = __importDefault(require("./utils/normalize-path"));
const safe_id_1 = require("./utils/safe-id");
function loadConfig(id, { ctx: configOptions, path: configPath }) {
    const handleError = err => {
        if (!err.message.includes('No PostCSS Config found')) {
            throw err;
        }
        // Return empty options for PostCSS
        return {};
    };
    configPath = configPath ? path_1.default.resolve(configPath) : path_1.default.dirname(id);
    const ctx = {
        file: {
            extname: path_1.default.extname(id),
            dirname: path_1.default.dirname(id),
            basename: path_1.default.basename(id)
        },
        options: configOptions || {}
    };
    return (0, postcss_load_config_1.default)(ctx, configPath).catch(handleError);
}
function escapeClassNameDashes(string) {
    return string.replace(/-+/g, match => {
        return `$${match.replace(/-/g, '_')}$`;
    });
}
function ensureClassName(name) {
    name = escapeClassNameDashes(name);
    return (0, safe_identifier_1.identifier)(name, false);
}
function ensurePostCSSOption(option) {
    return typeof option === 'string' ? (0, import_cwd_1.default)(option) : option;
}
function isModuleFile(file) {
    return /\.module\.[a-z]{2,6}$/.test(file);
}
/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */
exports.default = {
    name: 'postcss',
    alwaysProcess: true,
    // this === loaderContex
    // const loaderContext = {
    //   id,
    //   sourceMap,
    //   dependencies: new Set(),
    //   warn: this.warn.bind(this),
    //   plugin: this
    // }
    async process({ code, map }) {
        const { options, id } = this;
        const { inject, relativeBase, combineExtract } = options;
        const config = options.config ? await loadConfig(id, options.config) : {};
        const plugins = [...(options.postcss.plugins || []), ...(config.plugins || [])];
        const injectLink = options.inject.type === 'link';
        const injectInline = options.inject.type === 'inline';
        // css 模块化对象
        const modulesExported = {};
        const shouldModules = (options.autoModules !== false && isModuleFile(this.id)) || options.modules;
        // 如果开启需要开启 css modules，将插件放到列表头部
        if (shouldModules) {
            plugins.unshift(require('postcss-modules')({
                generateScopedName: process.env.ROLLUP_POSTCSS_TEST ? '[name]_[local]' : '[name]_[local]__[hash:base64:5]',
                ...options.modules,
                getJSON(filepath, json, outpath) {
                    modulesExported[filepath] = json;
                    if (typeof options.modules === 'object' &&
                        typeof options.modules.getJSON === 'function') {
                        return options.modules.getJSON(filepath, json, outpath);
                    }
                }
            }));
        }
        // 初始化 postcss 配置
        const postcssOptions = {
            ...this.options.postcss,
            ...config.options,
            to: options.output ? path_1.default.resolve(options.output, path_1.default.parse(this.id).base) : this.id,
            from: this.id,
            map: (!!this.sourceMap) && (injectLink ? { inline: false, annotation: false, sourcesContent: true } : { inline: true, annotation: false, sourcesContent: true })
        };
        delete postcssOptions.plugins;
        postcssOptions.parser = ensurePostCSSOption(postcssOptions.parser);
        postcssOptions.syntax = ensurePostCSSOption(postcssOptions.syntax);
        postcssOptions.stringifier = ensurePostCSSOption(postcssOptions.stringifier);
        if (map && postcssOptions.map) {
            postcssOptions.map.prev = typeof map === 'string' ? JSON.parse(map) : map;
        }
        if (plugins.length === 0) {
            const noopPlugin = () => ({ postcssPlugin: 'postcss-noop-plugin', Once() { } });
            plugins.push(noopPlugin());
        }
        const result = await (0, postcss_1.default)(plugins).process(code, postcssOptions);
        // 添加依赖文件
        for (const message of result.messages) {
            if (message.type === 'dependency') {
                this.dependencies.add(message.file);
            }
        }
        // 添加警告信息
        for (const warning of result.warnings()) {
            // @ts-ignore
            if (!warning.message) {
                // @ts-ignore
                warning.message = warning.text;
            }
            this.warn(warning);
        }
        // 处理 sourceMap
        const outputMap = result.map && JSON.parse(result.map.toString());
        if (outputMap && outputMap.sources) {
            outputMap.sources = outputMap.sources.map(v => (0, normalize_path_1.default)(v));
        }
        let output = '';
        let extracted;
        // 自定义命名导出
        if (options.namedExports) {
            const json = modulesExported[this.id];
            const getClassName = typeof options.namedExports === 'function' ?
                options.namedExports :
                ensureClassName;
            for (const name in json) {
                const newName = getClassName(name);
                if (name !== newName && typeof options.namedExports !== 'function') {
                    this.warn(`Exported "${name}" as "${newName}" in ${(0, humanlize_path_1.default)(this.id)}`);
                }
                if (!json[newName]) {
                    json[newName] = json[name];
                }
                output += `export var ${newName} = ${JSON.stringify(json[name])};\n`;
            }
        }
        const cssVariableName = (0, safe_identifier_1.identifier)('css', true);
        const chunkName = `${relativeBase}${(0, safe_id_1.getSafeId)(result.css, path_1.default.parse(this.id).name)}.css`;
        if (injectLink) {
            if (!combineExtract) {
                // 使用相对路径插入 css link
                output += inject.injectCode({ relativeUrl: chunkName, id: chunkName, type: 'link' });
            }
            // 默认导出模块化对象，不管有没有使用 css 模块
            output += `export default ${JSON.stringify(modulesExported[this.id])};`;
            // 定义导出的css文件信息
            extracted = { id: this.id, code: result.css, map: outputMap, chunkName };
        }
        else if (injectInline) {
            // 如果开启模块化，默认导出模块化对象，否则导出css变量
            const module = shouldModules ? JSON.stringify(modulesExported[this.id]) : cssVariableName;
            // 定义css变量 (css 实际内容的字符串)  
            output += `var ${cssVariableName} = ${JSON.stringify(result.css)};\n`;
            // 将css内容通过内联方式插入文档
            output += inject.injectCode({ cssVariableName, id: chunkName, type: 'inline' });
            // 定义默认导出
            output += `export default ${module};\n`;
            output += `export var stylesheet=${JSON.stringify(result.css)};\n`;
        }
        return {
            code: output,
            map: outputMap,
            extracted
        };
    }
};
