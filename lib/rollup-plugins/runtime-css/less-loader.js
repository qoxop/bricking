"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pify_1 = __importDefault(require("pify"));
const humanlize_path_1 = __importDefault(require("./utils/humanlize-path"));
const load_module_1 = require("./utils/load-module");
/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */
exports.default = {
    name: 'less',
    test: /\.less$/,
    async process({ code }) {
        const less = (0, load_module_1.loadModule)('less');
        if (!less) {
            throw new Error('You need to install "less" packages in order to process Less files');
        }
        let { css, map, imports } = await (0, pify_1.default)(less.render.bind(less))(code, {
            ...this.options,
            sourceMap: this.sourceMap && {},
            filename: this.id
        });
        for (const dep of imports) {
            this.dependencies.add(dep);
        }
        if (map) {
            map = JSON.parse(map);
            map.sources = map.sources.map(source => (0, humanlize_path_1.default)(source));
        }
        return {
            code: css,
            map
        };
    }
};
