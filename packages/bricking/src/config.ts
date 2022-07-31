import * as path from 'path';
import { btkCompile } from '@bricking/toolkit';
import { BrickingOptions } from './typing';

btkCompile.registerTsHooks(['.ts', '.tsx']);

const workspace = process.cwd();
const configPath = path.resolve(workspace, './bricking.ts');
const tsConfigPath = path.resolve(workspace, './tsconfig.json');
const packageJsonPath = path.resolve(workspace, './package.json');

const config: Required<BrickingOptions> = require(configPath).default;
const tsConfig = require(tsConfigPath);
const packageJson = require(packageJsonPath);

export {
  tsConfig,
  packageJson,
  workspace,
  configPath,
  tsConfigPath,
  packageJsonPath,
};

export default config;
