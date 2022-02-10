/**
 * 路径工具
 */

import path from 'path'

const normalizePath = (filepath: string) => filepath && filepath.replace(/\\+/g, '/');

const humanlizePath = (filepath: string) => normalizePath(path.relative(process.cwd(), filepath));

/**
 * Url 合并
 * @param source
 * @param subPath
 * @returns
 */
const urlResolve = (source:string, subPath: string): string => {
    if (!/^http/.test(source)) {
        return path.join(source, subPath);
    }
    // http://www.a.com/path -> http://www.a.com/path/
    if (/\/\w+$/.test(source)) {
        source += '/';
    }
    return new URL(subPath, source).href;
}

export {
    urlResolve,
    normalizePath,
    humanlizePath,
}