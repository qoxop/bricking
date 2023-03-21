import { workerData, parentPort } from 'node:worker_threads';
import { createTypeDefine } from './tools';

type TypesData = {
  list: Array<{ input: string, output: string, cwd: string }>;
  id: string;
}

if (workerData && workerData.length) {
  setTimeout(() => {
    try {
      workerData.forEach(((item) => {
        try {
          createTypeDefine(item);
        } catch (e) {
          console.trace(e);
        }
      }));
      parentPort?.postMessage({ init: true });
    } catch (e) {
      parentPort?.postMessage({ init: false });
    }
  }, 10);
}

parentPort?.on('message', (data: TypesData) => {
  try {
    data.list.forEach(((item) => {
      createTypeDefine(item);
    }));
    parentPort?.postMessage({ [data.id]: true });
  } catch (e) {
    parentPort?.postMessage({ [data.id]: false });
  }
});
