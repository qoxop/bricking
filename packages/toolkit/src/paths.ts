/**
 * 路径工具
 */
import fs from 'fs';
import path, { sep } from 'path';

/**
 * normalizePath
 * @param filepath 文件路径
 * @returns
 */
const normalizePath = (filepath: string) => filepath && filepath.replace(/\\+/g, '/');

/**
 * humanlizePath
 * @param filepath 文件路径
 * @returns
 */
const humanlizePath = (filepath: string) => normalizePath(path.relative(process.cwd(), filepath));

/**
 * 替换扩展名
 * @param p 路径
 * @param ext 扩展名
 * @returns
 */
const replaceExt = (p: string, ext: string) => p.replace(/.\w+?$/, ext);

/**
 * urlResolve Url 合并
 * @param source 源路径
 * @param subPath 子路径
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
};

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const modulePathResolve = (filepath: string, relative: string, extraExtensions: string[] = []) => {
  const curDirPath = path.dirname(filepath);
  const absolutePath = path.join(curDirPath, relative);
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return {
      relativePath: relative,
      absolutePath,
    };
  }
  const totalExtensions = extensions.concat(extraExtensions);
  // [relative][ext]
  for (const ext of totalExtensions) {
    const curIndexPath = `${absolutePath}${ext}`;
    if (fs.existsSync(curIndexPath)) {
      return {
        relativePath: path.join(relative, `index${ext}`),
        absolutePath: curIndexPath,
      };
    }
  }
  // [relative]/index[ext]
  for (const ext of totalExtensions) {
    const subIndexPath = path.join(absolutePath, `index${ext}`);
    if (fs.existsSync(subIndexPath)) {
      return {
        relativePath: path.join(relative, `./index${ext}`),
        absolutePath: subIndexPath,
      };
    }
  }
};

const findModulePath = (moduleName: string) => {
  const splitString = `node_modules${sep}${moduleName}`;
  const paths = require.resolve(moduleName).split(splitString);
  return paths[0] + splitString;
}

export {
  replaceExt,
  urlResolve,
  normalizePath,
  humanlizePath,
  findModulePath,
  modulePathResolve,
};
