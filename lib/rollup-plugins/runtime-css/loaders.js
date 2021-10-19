"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promise_series_1 = __importDefault(require("promise.series"));
const postcss_loader_1 = __importDefault(require("./postcss-loader"));
const stylus_loader_1 = __importDefault(require("./stylus-loader"));
const less_loader_1 = __importDefault(require("./less-loader"));
const matchFile = (filepath, condition) => {
    if (typeof condition === 'function') {
        return condition(filepath);
    }
    return condition && condition.test(filepath);
};
class Loaders {
    constructor(options = {}) {
        this.use = [];
        this.loaders = [];
        this.use = options.use.map(rule => {
            if (typeof rule === 'string')
                return [rule];
            if (Array.isArray(rule))
                return rule;
            throw new TypeError('The rule in `use` option must be string or Array!');
        });
        const extensions = options.extensions || ['.css', '.sss', '.pcss'];
        const customPostcssLoader = {
            ...postcss_loader_1.default,
            test: filepath => extensions.some(ext => path_1.default.extname(filepath) === ext)
        };
        this.registerLoader(customPostcssLoader);
        this.registerLoader(stylus_loader_1.default);
        this.registerLoader(less_loader_1.default);
        if (options.loaders) {
            options.loaders.forEach(loader => this.registerLoader(loader));
        }
    }
    registerLoader(loader) {
        const existing = this.getLoader(loader.name);
        if (existing) {
            this.removeLoader(loader.name);
        }
        this.loaders.push(loader);
        return this;
    }
    removeLoader(name) {
        this.loaders = this.loaders.filter(loader => loader.name !== name);
        return this;
    }
    isSupported(filepath) {
        return this.loaders.some(loader => {
            return matchFile(filepath, loader.test);
        });
    }
    /**
     * Process the resource with loaders in serial
     * @param {object} resource
     * @param {string} resource.code
     * @param {any} resource.map
     * @param {object} context
     * @param {string} context.id The absolute path to resource
     * @param {boolean | 'inline'} context.sourceMap
     * @param {Set<string>} context.dependencies A set of dependencies to watch
     * @returns {{code: string, map?: any}}
     */
    process({ code, map }, context) {
        return (0, promise_series_1.default)(this.use
            .slice()
            .reverse()
            .map(([name, options]) => {
            const loader = this.getLoader(name);
            const loaderContext = {
                options: options || {},
                ...context
            };
            return v => {
                if (loader.alwaysProcess ||
                    matchFile(loaderContext.id, loader.test)) {
                    return loader.process.call(loaderContext, v);
                }
                // Otherwise directly return input value
                return v;
            };
        }), { code, map });
    }
    getLoader(name) {
        return this.loaders.find(loader => loader.name === name);
    }
}
exports.default = Loaders;
