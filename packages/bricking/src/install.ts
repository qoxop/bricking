import path from 'path';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { btkPath, btkNetwork } from '@bricking/toolkit';
import config from './config';

/**
 * 获取安装命令
 * @returns
 */
export async function getCommands() {
  const subCommands = {
    npm: 'install',
    yarn: 'add',
    pnpm: 'add',
  };
  let command = '';
  if (['npm', 'pnpm', 'yarn'].includes(process.argv0)) {
    command = process.argv0;
  }
  if (!command) {
    if (existsSync(path.resolve(process.cwd(), 'yarn.lock'))) {
      command = 'yarn';
    } else if (existsSync(path.resolve(process.cwd(), 'pnpm-lock.yaml'))) {
      command = 'pnpm';
    } else if (existsSync(path.resolve(process.cwd(), 'package-lock.json'))) {
      command = 'npm';
    }
  }
  if (!subCommands[command]) {
    const answers = await inquirer.prompt([{
      name: 'pkgManager',
      type: 'list',
      message: '请选择一个包管理器',
      choices: [{
        name: 'yarn',
        value: 'yarn',
      },
      {
        name: 'npm',
        value: 'npm',
      },
      {
        name: 'pnpm',
        value: 'pnpm',
      },
      ],
    }]);
    command = answers.pkgManager;
  }
  return {
    command,
    subCommand: subCommands[command],
  };
}

type BaseLibInfo = {
  name: string,
  version: string,
  peerDependencies: Record<string, string>;
  remoteEntry: string;
}
/**
 * 获取基础包信息，如果不存在直接安装后读取本地package.json
 * @returns
 */
export async function getBaseLibInfo(): Promise<BaseLibInfo> {
  if (typeof config.basePackage === 'string') {
    const { name, publicPath, typesPack, ...other } = await btkNetwork.getJson<any>(config.basePackage);
    return {
      ...other,
      name,
      version: `${publicPath}${typesPack}`,
    };
  }
  const { name, version } = config.basePackage;
  const { command, subCommand } = await getCommands();
  const installBase = () => spawnSync(command, [subCommand, `${name}@${version}`], { stdio: 'inherit' });
  let modulePath = '';
  let pkgInfo = {} as any;
  try {
    // 本地依赖包存在
    modulePath = btkPath.findModulePath(name);
    pkgInfo = require(`${modulePath}${path.sep}package.json`);
    // 版本不一致 -> 重新安装
    if (pkgInfo.name !== name || pkgInfo.version !== version) {
      installBase();
      modulePath = btkPath.findModulePath(name);
      pkgInfo = require(`${modulePath}${path.sep}package.json`);
    }
  } catch (error) {
    // 本地依赖包不存在 -> 安装
    installBase();
    modulePath = btkPath.findModulePath(name);
    pkgInfo = require(`${modulePath}${path.sep}package.json`);
  }
  console.log(`base-lib-name: ${name}`);
  console.log(`base-lib-version: ${version}`);
  return {
    name,
    version,
    ...pkgInfo,
  };
}

/**
 * 自动安装 peerDependencies
 */
export async function install() {
  let {
    name,
    version,
    peerDependencies,
  } = await getBaseLibInfo();
  const pkgs = Object.entries(peerDependencies).map(([key, _version]) => (`${key}@${_version}`));
  const { command, subCommand } = await getCommands();
  spawnSync(command, [subCommand, `${name}@${version}`, ...pkgs], { stdio: 'inherit' });
}
