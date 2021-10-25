"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INJECT_IMPORT_MAPS = void 0;
const INJECT_IMPORT_MAPS = (import_maps = {}) => (`
if (window['$SystemReg'] && typeof window['$SystemReg'].url === 'string') {
    window['$SystemReg'].url(${JSON.stringify(import_maps)});
}
`);
exports.INJECT_IMPORT_MAPS = INJECT_IMPORT_MAPS;
function default_1(import_maps = {}) {
    return {
        name: 'app-builder',
        async generateBundle(_, bundle) {
            if (import_maps && Object.keys(import_maps).length) {
                const [_, entryChunk] = Object.entries(bundle).find(([_, chunk]) => chunk.isEntry);
                entryChunk.code = (0, exports.INJECT_IMPORT_MAPS)(import_maps) + '\n' + entryChunk.code;
            }
        }
    };
}
exports.default = default_1;
