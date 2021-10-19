"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 处理 js 模块中的静态资源引用
 */
const plugin_url_1 = __importDefault(require("@rollup/plugin-url"));
function default_1(options) {
    const plg = (0, plugin_url_1.default)(options);
    const originLoad = plg.load.bind(plg);
    plg.load = async function (id) {
        const codeStr = await originLoad(id);
        if (!codeStr || /^export default \"data:/.test(codeStr)) {
            return codeStr;
        }
        const matched = codeStr.match(/^export default \"(.*)\"$/);
        if (matched[1]) {
            return `export default new URL("${matched[1]}", import.meta.url).href`;
        }
        return codeStr;
    };
    return plg;
}
exports.default = default_1;
