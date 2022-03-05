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
 * @param extraExt - 需要额外支持的文件后缀名，默认 .ts
 */
const registerTsHooks = once((extraExt?: string[]) => {
  addHook(
    (code) => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exts: ['.ts'].concat(extraExt || []) },
  );
});

/**
 * 使用Ts编译器，将代码编译到 ES3
 * @param code - 代码字符串
 * @returns
 */
const compileToEs3 = async (code: string) => {
  const Es3Code = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES3,
    },
  }).outputText;
  const { code: miniCode } = await minify(Es3Code, { sourceMap: false });
  return miniCode;
};

export {
  registerTsHooks,
  compileToEs3,
};
