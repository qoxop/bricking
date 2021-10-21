import { addHook } from 'pirates';
import * as ts from 'typescript';

addHook((code) => {
    return ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText;
}, { exts: ['.ts']})