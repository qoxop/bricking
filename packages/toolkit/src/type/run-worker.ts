import path from 'path';
import fsExtra from 'fs-extra';
import { Worker } from 'node:worker_threads';
import { generateDTS } from './tools';
import { ls } from '../files';

export type Types = Array<{
  input: string;
  output: string;
  cwd: string;
}>

export const runTypesWorker = async (types: Types) => {
  const cwd = types[0]?.cwd || process.cwd();
  const TempDir = path.resolve(cwd, './__temp');
  // 生成类型定义文件
  generateDTS({
    outDir: TempDir,
    rootNames: [...ls(cwd)].filter((item) => /\.tsx?$/.test(item)),
  });
  const DTypes = types.map((item) => {
    const rPath = path.relative(cwd, item.input);
    return {
      ...item,
      input: path.resolve(TempDir, rPath.replace(/\.tsx?$/, '.d.ts')),
    };
  });
  const worker = new Worker(require.resolve('./types-worker'), { workerData: DTypes });
  return new Promise<void>((resolve, reject) => {
    worker.on('message', (data) => {
      if (data.finished) {
        resolve();
        worker.terminate();
        fsExtra.removeSync(TempDir);
      } else if (data.error) {
        reject(data.error);
      }
    });
  });
};
