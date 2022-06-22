/* eslint-disable no-unused-vars */
/**
 * 限制目标函数只执行一次
 * @param func 目标函数
 * @returns
 */
export function once<Args extends unknown[] = unknown[], Rt = any>(func: (...args: Args) => Rt) {
  const runed = false;
  let returned:Rt;
  return (...args: Args) => {
    if (!runed) {
      returned = func(...args);
    }
    return returned;
  };
}
