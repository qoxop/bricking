import { workerData, parentPort } from 'node:worker_threads';
import { rollupDTS } from './tools';

type TypesData = Array<{ input: string, output: string, cwd: string }>;

if (workerData && workerData.length) {
  setTimeout(() => {
    try {
      (workerData as TypesData).forEach(((item) => {
        try {
          rollupDTS(item);
        } catch (e) {
          console.error(e);
        }
      }));
      parentPort?.postMessage({ finished: true });
    } catch (error) {
      parentPort?.postMessage({ error });
    }
  }, 10);
}
