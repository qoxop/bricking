import path from 'path';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { btkPath, btkNetwork, colors } from '@bricking/toolkit';
import config, { packageJson } from './config';

const upSearch = (p: string, cb: (_p: string) => void):void => {
  while (existsSync(p) && p !== path.join(p, '../') && cb(p)) {
    p = path.join(p, '../');
  }
};

const getInstallCommands = async () => {
  let command = '';
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
      return !command;
    });
  }
  if (!subCommands[command]) {
    const answers = await inquirer.prompt([{
      name: 'pkgManager',
      type: 'list',
      message: '请选择一个包管理器',
      choices: [
        { name: 'yarn', value: 'yarn' },
        { name: 'npm', value: 'npm' },
        { name: 'pnpm', value: 'pnpm' },
      ],
    }]);
    command = answers.pkgManager;
  }
  return {
    command,
    subCommand: subCommands[command],
  };
};

const installDependencies = async (dependencies: Record<string, string>) => {
  const pkgs = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`);
  const { command, subCommand } = await getInstallCommands();
  const sub = [subCommand, ...pkgs];
  console.log(colors.grey(`\n 🚂 ${command} ${sub.join(' ')} \n`));
  spawnSync(command, sub, { stdio: 'inherit' });
};

type BaseLibInfo = {
  name?: string,
  version?: string,
  peerDependencies?: Record<string, string>;
  remoteEntry?: string;
  document?: string;
}

let baseLibInfo: BaseLibInfo = {};
function getBaseLibInfo() {
  return baseLibInfo;
}

async function initBaseLibInfo() {
  let _baseLibInfo:BaseLibInfo = {};
  if (config.basePackage === 'use-cdn-runtime') {
    // 加载CDN运行时脚本
    _baseLibInfo.remoteEntry = 'https://unpkg.com/@bricking/runtime@0.4.6/dist/bricking.min.js';
  } else if (config.basePackage === 'use-local-runtime') {
    // 加载本地运行时脚本
    _baseLibInfo.remoteEntry = config.publicPath ? `${config.publicPath}bricking.min.js` : './bricking.min.js';
  } else if (typeof config.basePackage === 'string') {
    if (/\.js$/.test(config.basePackage)) {
      // 指定一个自定义的运行时脚本
      _baseLibInfo.remoteEntry = config.basePackage;
    } else {
      // 指定一个运行时 + 共享依赖的包，以 json 配置文件的方式
      const { name, publicPath, typesPack, ...other } = await btkNetwork.getJson<any>(config.basePackage);
      _baseLibInfo = {
        ...other,
        name,
        version: `${publicPath}${typesPack}`,
      };
      const baseLibAbsent = !packageJson.dependencies[name];
      const baseLibDifferent = packageJson.dependencies[name] !== _baseLibInfo.version;
      const baseLibNoInWorkspace = !/workspace/.test(packageJson.dependencies[name]);
      if (_baseLibInfo.version && (baseLibAbsent || (baseLibDifferent && baseLibNoInWorkspace))) {
        await installDependencies({ [name]: _baseLibInfo.version });
      }
    }
  } else if (config.basePackage?.name) {
    // 指定一个运行时 + 共享依赖的包, 以 npm 包的方式
    const { name, version = 'latest' } = config.basePackage;
    let modulePath = '';
    let pkgInfo = {} as any;
    try {
      // 本地依赖包存在
      modulePath = btkPath.findModulePath(name);
      pkgInfo = require(`${modulePath}${path.sep}package.json`);
      if (!/workspace/.test(version) && (pkgInfo.name !== name || pkgInfo.version !== version)) {
        throw new Error('版本信息不一致');
      }
    } catch (error) {
      // 本地依赖包不存在 或者 版本信息不一致 -> 安装
      await installDependencies({ [name]: version });
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

async function install(deps: string[] = []) {
  const { peerDependencies } = baseLibInfo;
  if (!peerDependencies) return;
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
  await installDependencies(pkgs);
}

export {
  install,
  initBaseLibInfo,
  getBaseLibInfo,
  BaseLibInfo,
};
