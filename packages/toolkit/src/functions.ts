/**
 * 限制目标函数只执行一次
 * @param func 目标函数
 * @returns 
 */
function once<Args extends unknown[] = unknown[], Rt = any>(func: (...args: Args) => Rt) {
    let runed = false;
    let returned:any = null;
    return (...args: Args) => {
        if (!runed) {
            returned = func(...args);
        }
        return returned;
    }
}

export {
    once
}