"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const terser_1 = require("terser");
const typescript_1 = __importDefault(require("typescript"));
const compile = async (code) => {
    const ES_3_Code = typescript_1.default.transpileModule(code, { compilerOptions: {
            module: typescript_1.default.ModuleKind.None,
            target: typescript_1.default.ScriptTarget.ES3,
        } }).outputText;
    const { code: miniCode } = await (0, terser_1.minify)(ES_3_Code, { sourceMap: false });
    return miniCode;
};
exports.compile = compile;
