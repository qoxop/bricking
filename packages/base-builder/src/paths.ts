/**
 * 路径管理
 */
import * as fs from 'fs';
import * as path from 'path';
import { getUserOptions } from './options';

const workspace = process.cwd();

const userOptions = getUserOptions();

const resolvePath = (relativePath: string) => path.resolve(workspace, relativePath);

const paths = {
  workspace,
  readme: resolvePath('README.md'),
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

function getCustomWebpackPath() {
  let { bundle: { webpack: customWebpackPath } } = userOptions;
  if (!customWebpackPath) {
    return false;
  }
  if (!path.isAbsolute(customWebpackPath)) {
    customWebpackPath = path.resolve(workspace, customWebpackPath);
  }
  return fs.existsSync(customWebpackPath) ? customWebpackPath : false;
}

const getPackageJson = () => {
  if (!fs.existsSync(paths.packageJson)) throw new Error(`${paths.packageJson} 不存在 ～`);

  const { bundle: { expose, exposeAll, exposeExclude } } = getUserOptions();
  let {
    name,
    version,
    description = '',
    author = '',
    dependencies = {},
    peerDependencies = {},
  } = require(paths.packageJson);
  let shareDependencies: Record<string, string> = {};
  if (exposeAll) {
    Object.entries(dependencies).forEach(([key, value]) => {
      const excluded = exposeExclude.some((item) => (typeof item === 'string' ? item === key : item.test(key)));
      if (!excluded) {
        shareDependencies[key] = value as string;
      }
    });
  } else {
    expose.forEach((item) => {
      if (typeof item === 'string') {
        if (dependencies[item] !== undefined) {
          shareDependencies[item] = dependencies[item];
        }
      } else if (dependencies[item.name]) {
        shareDependencies[item.name] = dependencies[item.name];
      }
    });
  }
  return {
    name,
    author,
    version,
    description,
    peerDependencies: { ...peerDependencies, ...shareDependencies },
  };
};

export {
  paths,
  workspace,
  getPackageJson,
  getCustomWebpackPath,
};
