import fs from 'fs';
import path from 'path';
import del from 'del';
import ts from 'typescript';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const extensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

export const generateDTS = (props: {
    /** 绝对路径文件列表 */
    rootNames: string[],
    /** 输出目录的绝对路径 */
    outDir: string
}) => {
  ts.createProgram({
    rootNames: props.rootNames,
    options: {
      outDir: props.outDir,
      emitDeclarationOnly: true,
      esModuleInterop: true,
      declaration: true,
      skipLibCheck: true,
    },
  }).emit();
};

export const rollupDTS = ({ input, output, cwd = process.cwd() }:{
    /** 输入文件的绝对路径 */
    input: string;
    /** 输出文件的绝对路径 */
    output: string;
    /** 项目目录 */
    cwd?: string;
}) => {
  Extractor.invoke(ExtractorConfig.prepare({
    configObjectFullPath: path.resolve(cwd, './tsconfig.json'),
    packageJsonFullPath: path.resolve(cwd, './package.json'),
    configObject: {
      compiler: {
        tsconfigFilePath: path.resolve(cwd, './tsconfig.json'),
      },
      projectFolder: cwd,
      bundledPackages: [],
      mainEntryPointFilePath: input,
      dtsRollup: {
        enabled: true,
        untrimmedFilePath: output,
      },
    },
  }), {
    localBuild: true,
    showVerboseMessages: true,
  });
};

export const createTypeDefine = (props: {
    /** 输入文件的绝对路径 */
    input: string;
    /** 输出文件的绝对路径 */
    output: string;
    /** 项目目录 */
    cwd?: string;
}) => {
  let {
    input,
    output,
    cwd = process.cwd(),
  } = props;
  if (!/\.tsx?$/.test(input)) {
    const ext = extensions.find((_ext) => fs.existsSync(`${input}${_ext}`));
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
    outDir: TempDir,
  });
  // 对类型定义文件进行捆绑
  rollupDTS({
    cwd,
    output,
    input: OutputName,
  });
  // 删除临时目录
  del(TempDir);
};
