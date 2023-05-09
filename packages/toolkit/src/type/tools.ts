import fs from 'fs-extra';
import path from 'path';
import ts from 'typescript';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { ls } from '../files';

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
  const TempDir = path.resolve(cwd, `./__temp/${Math.random().toString(36).slice(2)}}`);
  const OutputName = path.resolve(TempDir, `${path.parse(input).name}.d.ts`);
  try {
    // 生成类型定义文件
    generateDTS({
      rootNames: [input, ...ls(path.dirname(input))],
      outDir: TempDir,
    });
    // 对类型定义文件进行捆绑
    rollupDTS({
      cwd,
      output,
      input: OutputName,
    });
    return fs.removeSync(TempDir);
  } catch (e) {
    return fs.removeSync(TempDir);
  }
};

export const createTypeDefines = (props: {
  /** 基础目录 */
  base: string;
  /** 映射关系 */
  record: Record<string, string>;
  /** 输出目录 */
  output: string;
  /** 项目目录 */
  cwd?: string;
}) => {
  let {
    base,
    record,
    output,
    cwd = process.cwd(),
  } = props;
  const TempDir = path.resolve(cwd, './__temp');
  try {
    // 生成类型定义文件
    generateDTS({
      rootNames: [...ls(base)],
      outDir: TempDir,
    });
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const value = path.isAbsolute(record[key]) ? record[key] : path.resolve(cwd, record[key]);
        const rPath = path.relative(base, value);
        // 对类型定义文件进行捆绑
        rollupDTS({
          cwd,
          input: path.resolve(TempDir, rPath.replace(/\.tsx?$/, '.d.ts')),
          output: path.resolve(output, `./${key}.d.ts`),
        });
      }
    }
    // 删除临时目录
    fs.removeSync(TempDir);
  } catch (error) {
    console.trace(error);
    // 删除临时目录
    fs.removeSync(TempDir);
  }
};
