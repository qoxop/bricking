import fs from 'fs';
import path from "path";
import del from 'del';
import ts from 'typescript';
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";

const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

export const generateDTS = (props: {
    rootNames: string[],
    ourDir: string
}) => {
    ts.createProgram({
        rootNames: props.rootNames,
        options: {
            outDir: props.ourDir,
            emitDeclarationOnly: true,
            esModuleInterop: true,
            declaration: true,
            skipLibCheck: true
        }
    }).emit();
}

export const rollupDTS = (props: {
    input: string,
    output: string
    cwd?: string,
}) => {
    const {
        input,
        output,
        cwd = process.cwd(),
    } = props;
    Extractor.invoke(ExtractorConfig.prepare({
        configObjectFullPath:  path.resolve(cwd, './tsconfig.json'),
        packageJsonFullPath: path.resolve(cwd, './package.json'),
        configObject: {
            compiler: {
                tsconfigFilePath: path.resolve(cwd, './tsconfig.json'),
            },
            projectFolder: cwd,
            bundledPackages: [],
            mainEntryPointFilePath: path.resolve(cwd, input),
            dtsRollup: {
                "enabled": true,
                "untrimmedFilePath": path.resolve(cwd, output)
            },
        }
    }), {
        localBuild: true,
        showVerboseMessages: true
    })
}


export const createTypeDefine = (props: {
    input: string,
    output: string,
    cwd?: string,
}) => {
    let {
        input,
        output,
        cwd = process.cwd(),
    } = props;
    if (!/\.tsx?$/.test(input)) {
        const ext = extensions.find(ext => fs.existsSync(`${input}${ext}`));
        if (!ext) {
            throw new Error(`${input} 文件不存在`);
        }
        input = `${input}${ext}`;
    }
    const TempDir = path.resolve(cwd, './__temp');
    const OutputName = path.resolve(TempDir, `${path.parse(input).name}.d.ts`);
    // 生成类型定义文件
    generateDTS({
        rootNames: [input],
        ourDir: TempDir
    });
    // 对类型定义文件进行捆绑
    rollupDTS({
        cwd,
        output,
        input: OutputName,
    });
    // 删除临时目录
    del(TempDir);
}
