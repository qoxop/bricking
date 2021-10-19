"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_template_1 = require("../code-template");
function default_1(import_maps = {}) {
    return {
        name: 'app-builder',
        async generateBundle(_, bundle) {
            if (import_maps && Object.keys(import_maps).length) {
                const [_, entryChunk] = Object.entries(bundle).find(([_, chunk]) => chunk.isEntry);
                entryChunk.code = (0, code_template_1.INJECT_IMPORT_MAPS)(JSON.stringify(import_maps)) + '\n' + entryChunk.code;
            }
        }
    };
}
exports.default = default_1;
