import {minify} from 'terser'
import ts from 'typescript';

export const compile = async (code: string) => {
    const ES_3_Code = ts.transpileModule(code, { compilerOptions: { 
        module: ts.ModuleKind.None,
        target: ts.ScriptTarget.ES3,
    }}).outputText;
    const { code: miniCode } = await minify(ES_3_Code, {sourceMap: false});
    return miniCode;
}