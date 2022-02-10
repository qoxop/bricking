function once<Args extends unknown[] = unknown[], Rt = any>(func: (...args: Args) => Rt) {
    let runed = false;
    let returned = null;
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