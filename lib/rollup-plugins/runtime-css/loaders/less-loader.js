"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessLoader = void 0;
const types_1 = require("./types");
const paths_1 = require("../../../utils/paths");
class LessLoader extends types_1.Loader {
    constructor() {
        super(...arguments);
        this.name = 'less';
        this.alwaysProcess = false;
        this.extensions = ['.less'];
    }
    async process(chunk, context) {
        const { id, sourceMap } = context;
        const less = require('less');
        const { css, map, imports } = await less.render(chunk.code, {
            ...this.options,
            // @ts-ignore
            rewriteUrls: 'all',
            javascriptEnabled: true,
            filename: id,
            sourceMap: sourceMap ? { sourceMapFileInline: sourceMap === 'inline' } : undefined,
        });
        // 添加依赖关系
        for (const dep of imports)
            context.dependencies.add(dep);
        let newMap = null;
        if (map) {
            newMap = JSON.parse(map);
            newMap.sources = newMap.sources.map(source => (0, paths_1.humanlizePath)(source));
        }
        return {
            code: css,
            map: newMap
        };
    }
    ;
}
exports.LessLoader = LessLoader;
