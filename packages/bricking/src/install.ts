import path from 'path';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { btkPath, btkNetwork, colors } from '@bricking/toolkit';
import config, { packageJson } from './config';

// eslint-disable-next-line no-unused-vars
const upSearch = (p: string, cb: (_p: string) => void):void => {
  while (existsSync(p) && p !== path.join(p, '../')) {
    cb(p);
    p = path.join(p, '../');
  }
};

let command = '';
/**
 * 获取安装命令
 */
const getCommands = async () => {
  const subCommands = {
    npm: 'install',
    yarn: 'add',
    pnpm: 'install',
  };
  if (!command && ['npm', 'pnpm', 'yarn'].includes(process.argv0)) {
    command = process.argv0;
  }
  if (!command && /node_modules\/\.pnpm\/bricking/.test(process.argv[1])) {
    command = 'pnpm';
  }
  if (!command) {
    upSearch(process.cwd(), (p) => {
      if (existsSync(path.resolve(p, 'yarn.lock'))) {
        command = 'yarn';
      } else if (existsSync(path.resolve(p, 'pnpm-lock.yaml'))) {
        command = 'pnpm';
      } else if (existsSync(path.resolve(p, 'package-lock.json'))) {
        command = 'npm';
      }
    });
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
};

/**
 * 依赖安装
 */
const installDeps = async (deps: Record<string, string>) => {
  const pkgs = Object.entries(deps).map(([name, version]) => `${name}@${version}`);
  // eslint-disable-next-line no-shadow
  const { command, subCommand } = await getCommands();
  const sub = [subCommand, ...pkgs];
  console.log(colors.grey(`\n 🚂 ${command} ${sub.join(' ')} \n`));
  spawnSync(command, sub, { stdio: 'inherit' });
};

export type BaseLibInfo = {
  name: string,
  version: string,
  peerDependencies: Record<string, string>;
  remoteEntry: string;
  document?: string;
}

let baseLibInfo: BaseLibInfo;
export function getBaseLibInfo() {
  return baseLibInfo;
}

/**
 * 获取基座包信息，并下载相关依赖
 */
export async function initBaseLibInfo() {
  let _baseLibInfo:BaseLibInfo = null as any;
  // 以 json 链接方式配置
  if (typeof config.basePackage === 'string') {
    const { name, publicPath, typesPack, ...other } = await btkNetwork.getJson<any>(config.basePackage);
    _baseLibInfo = {
      ...other,
      name,
      version: `${publicPath}${typesPack}`,
    };
    if (!packageJson.dependencies[name] || (packageJson.dependencies[name] !== _baseLibInfo.version && !/workspace/.test(packageJson.dependencies[name]))) {
      await installDeps({ [name]: _baseLibInfo.version });
    }
  } else {
    // 指定名称和版本号的方式配置
    const { name, version } = config.basePackage;
    let modulePath = '';
    let pkgInfo = {} as any;
    try {
      // 本地依赖包存在
      modulePath = btkPath.findModulePath(name);
      pkgInfo = require(`${modulePath}${path.sep}package.json`);
      // 版本不一致 -> 重新安装
      if (pkgInfo.name !== name || pkgInfo.version !== version) {
        await installDeps({ [name]: version });
        modulePath = btkPath.findModulePath(name);
        pkgInfo = require(`${modulePath}${path.sep}package.json`);
      }
    } catch (error) {
      // 本地依赖包不存在 -> 安装
      await installDeps({ [name]: version });
      modulePath = btkPath.findModulePath(name);
      pkgInfo = require(`${modulePath}${path.sep}package.json`);
    }
    _baseLibInfo = {
      name,
      version,
      ...pkgInfo,
    };
  }
  baseLibInfo = _baseLibInfo;
}

export async function install(deps: string[] = []) {
  const { peerDependencies } = baseLibInfo;
  if (deps.length === 0) {
    const choices = Object.entries(peerDependencies).map(([name, version]) => ({
      name,
      value: `${name}@${version}`,
    }));
    const answers = await inquirer.prompt([
      {
        name: 'deps',
        type: 'checkbox',
        message: '请选择要安装的模块',
        choices,
      },
    ]);
    deps = answers.deps;
  }
  const pkgs = deps.reduce((prev, cur) => {
    const [name, version = 'latest'] = cur.split('@');
    prev[name] = peerDependencies[name] || version;
    return prev;
  }, {});
  await installDeps(pkgs);
}
