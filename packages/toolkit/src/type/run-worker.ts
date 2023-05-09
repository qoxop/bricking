import path from 'path';
import fs from 'fs-extra';
import { Worker } from 'node:worker_threads';

export type TypesData = {
  list: Array<{ input: string, output: string, cwd: string }>;
  id: string;
}

export const runTypesWorker = (workerData: TypesData['list']) => {
  const cwd = workerData[0]?.cwd || process.cwd();
  const worker = new Worker(require.resolve('./types-worker'), { workerData });
  const callbacks:any = {};
  worker.on('message', (data) => {
    const finished:string[] = [];
    // 执行
    Object.keys(callbacks).forEach((k) => {
      if (callbacks[k](data)) {
        finished.push(k);
      }
    });
    // 删除
    finished.forEach((k) => {
      delete callbacks[k];
    });
  });
  const generated = new Promise<void>((resolve, reject) => {
    callbacks.init = (data) => {
      if (typeof data.init === 'boolean') {
        data.init ? resolve() : reject();
        return true;
      }
    };
  });
  const emit = (data: TypesData['list']) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    worker.postMessage({ id, list: data });
    return new Promise<void>((resolve, reject) => {
      callbacks[id] = (msg) => {
        if (typeof msg[id] === 'boolean') {
          msg[id] ? resolve() : reject();
          return true;
        }
      };
    });
  };
  return {
    emit,
    generated,
    terminate: async () => {
      await worker.terminate();
      try {
        fs.removeSync(path.resolve(cwd, './__temp'));
      } catch (error) {
        // ignore
      }
    },
  };
};
