// 自定义通用模块，仅供参考，不需要请直接删除

function createPromise<T = any>() {
  let resolve: (value: T | PromiseLike<T>) => void = null as any;
  let reject: (reason?: any) => void = null as any;
  const promise = new Promise<T>((rs, rj) => {
    resolve = rs;
    reject = rj
  });
  return { resolve, reject, promise }
}

/**
 * execTasks 的返回类型
 */
type ExecTasksReturn<T> = {
  errors: Array<{err: any, task: T}>;
  results: Array<{result: any, task: T}>
}

/**
 * 执行任务
 * @param tasks 任务列表
 * @param cb 任务回调
 * @param parallel 并行数量
 * @returns 
 */
export async function execTasks<T>(tasks: T[], cb: (task: T) => Promise<any>, parallel = 10, ): Promise<ExecTasksReturn<T>> {
  const { promise, resolve } = createPromise<ExecTasksReturn<T>>();

  let ps: ReturnType<typeof createPromise>;

  const results: Array<{result: any, task: T}> =[];
  const errors: Array<{err: any, task: T}> = [];
  let count = 0;
  let handling = 0;
  for await (const task of tasks) {
    count++;
    handling++;
    cb(task).then(result => {
      results.push({ result, task });
    }).catch(err => {
      errors.push({ err, task })
    }).finally(() => {
      handling--;
      if (handling === 0 && count === tasks.length) {
          return resolve({ results, errors })
      }
      // @ts-ignore
      ps && ps.resolve();
    });
    if (handling + 1 > parallel) {
      ps = createPromise();
      await ps.promise;
    }
  }
  return await promise;
}