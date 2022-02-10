/**
 * 支持在 node 中直接引入 ts 文件
 */
import ts from 'typescript';
import { minify } from 'terser';
import { addHook } from 'pirates';
import { once } from './functions';

/**
 * 注册 TS 钩子
 * 支持在引入使用 Ts 编写的模块
 */
const registerTsHooks = once((extraExt?: string[]) => {
    addHook(
        (code) => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText,
        { exts: ['.ts'].concat(extraExt ? extraExt : [])}
    );
 })

/**
 * 使用Ts编译器，将代码编译到 ES3
 * @param code
 * @returns 
 */
const compileToEs3 = async (code: string) => {
     const ES_3_Code = ts.transpileModule(code, { compilerOptions: { 
         module: ts.ModuleKind.None,
         target: ts.ScriptTarget.ES3,
     }}).outputText;
     const { code: miniCode } = await minify(ES_3_Code, {sourceMap: false});
     return miniCode;
 }
 
 export {
    registerTsHooks,
    compileToEs3
 }