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
  try {
    const paths = require.resolve(moduleName).split(splitString);
    return paths[0] + splitString;
  } catch (err) {
    const modulePath = path.resolve(process.cwd(), `./${splitString}`);
    if (fs.existsSync(path.resolve(modulePath, 'package.json'))) {
      return modulePath;
    }
    throw err;
  }
};

export {
  replaceExt,
  normalizePath,
  humanlizePath,
  findModulePath,
  modulePathResolve,
};
