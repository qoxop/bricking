/**
 * 路径管理
 */
import * as fs from 'fs';
import * as path from 'path';
import { btkPath } from '@bricking/toolkit';
import { getUserOptions } from './options';
import { excludePackages } from './utils/constants';

const workspace = process.cwd();

const userOptions = getUserOptions();

const resolvePath = (relativePath: string) => path.resolve(workspace, relativePath);

const paths = {
  workspace,
  tsconfig: resolvePath('tsconfig.json'),
  jsconfig: resolvePath('jsconfig.json'),
  outputPath: resolvePath(userOptions.output),
  packageJson: resolvePath('package.json'),
  babelConfig: resolvePath('babel.config.js'),
  baseIndexTs: resolvePath(userOptions?.bundle?.entry || 'index.ts'),
  webpackCache: resolvePath('node_modules/.cache'),
  browserslist: resolvePath('.browserslistrc'),
  postcssConfig: resolvePath('postcss.config.js'),
  brickingrc: process.env.BRICKING_RC,
};

const getCustomWebpackPath = () => {
  let { bundle: { webpack: customWebpackPath } } = userOptions;
  if (!customWebpackPath) {
    return false;
  }
  if (!path.isAbsolute(customWebpackPath)) {
    customWebpackPath = path.resolve(workspace, customWebpackPath);
  }
  return fs.existsSync(customWebpackPath) ? customWebpackPath : false;
};

const getPackageJson = () => {
  if (!fs.existsSync(paths.packageJson)) {
    throw new Error(`${paths.packageJson} 不存在 ～`);
  }

  const { bundle: { dependencies: deps } } = getUserOptions();
  let {
    name,
    version,
    description = '',
    author = '',
    dependencies = {},
    peerDependencies = {},
  } = require(paths.packageJson);

  if (deps.autoInject) {
    const { exclude = [] } = deps;
    // 将 dependencies 改为 peerDependencies(用作开发时类型提醒)
    peerDependencies = { ...peerDependencies, ...dependencies };
    // 移除内置包依赖
    excludePackages.forEach((_name) => peerDependencies[_name] && (delete peerDependencies[_name]));
    // 移除 exclude
    exclude.forEach((_name) => {
      if (peerDependencies[_name]) {
        (delete peerDependencies[_name]);
      }
      if (peerDependencies[`@types/${_name}`]) {
        delete peerDependencies[`@types/${_name}`];
      }
    });
    return {
      name,
      version,
      description,
      author,
      peerDependencies,
    };
  }
  const { include = [] } = deps;
  peerDependencies = include.reduce((pre, moduleName) => {
    const modulePath = btkPath.findModulePath(moduleName);
    const { version: _version } = require(path.resolve(modulePath, 'package.json'));
    return { ...pre, [moduleName]: _version };
  }, {});
  return {
    name,
    version,
    description,
    author,
    peerDependencies,
  };
};

const reloadOptions = () => {
  const cacheKey = require.resolve(paths.brickingrc);
  if (require.cache[cacheKey]) {
    delete require.cache[cacheKey];
    require(paths.brickingrc);
  }
  return getUserOptions();
};

export {
  paths,
  workspace,
  reloadOptions,
  getPackageJson,
  getCustomWebpackPath,
};
