"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pify_1 = __importDefault(require("pify"));
const load_module_1 = require("./utils/load-module");
exports.default = {
    name: 'stylus',
    test: /\.(styl|stylus)$/,
    async process({ code }) {
        const stylus = (0, load_module_1.loadModule)('stylus');
        if (!stylus) {
            throw new Error('You need to install "stylus" packages in order to process Stylus files');
        }
        const style = stylus(code, {
            ...this.options,
            filename: this.id,
            sourcemap: this.sourceMap && {}
        });
        const css = await (0, pify_1.default)(style.render.bind(style))();
        const deps = style.deps();
        for (const dep of deps) {
            this.dependencies.add(dep);
        }
        return {
            code: css,
            map: style.sourcemap
        };
    }
};
