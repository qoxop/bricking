import * as path from 'path';
import { btkCompile, btkFunc } from '@bricking/toolkit';
import { postcssRelativeUrl } from '@bricking/plugin-style'
import { BrickingOptions } from './typing';
import { AssetsMap } from './plugins/rollup-url';

btkCompile.registerTsHooks(['.ts', '.tsx']);

const workspace = process.cwd();
const configPath = path.resolve(workspace, './bricking.ts');
const tsConfigPath = path.resolve(workspace, './tsconfig.json');
const packageJsonPath = path.resolve(workspace, './package.json');

const config: Required<BrickingOptions> = require(configPath).default;

const tsConfig = require(tsConfigPath);
const packageJson = require(packageJsonPath);

// 需要额外添加 URL 处理插件
(config as any).style.postcss.plugins.push(postcssRelativeUrl({
  cssOutput: path.dirname(path.resolve(config.output, config.style.filename as string)),
  baseOutput: config.output,
  limit: config.assets.limit,
  filename: config.assets.filename,
  loadPaths: config.assets.loadPaths,
  getDataUrl: btkFunc.getDataUrl,
  AssetsMap,
}));

export {
  tsConfig,
  packageJson,
  workspace,
  configPath,
  tsConfigPath,
  packageJsonPath,
};

export default config;
