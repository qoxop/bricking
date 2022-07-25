import path from "path";
import inquirer from 'inquirer';
import { btkPath } from "@bricking/toolkit";
import { spawnSync } from "child_process";
import config from "./config";

/**
 * 自动安装 peerDependencies
 * @param command, npm、yarn、pnpm
 */
export async function install(command: string) {
    const {name, version} = config.basePackage;
    const modulePath = btkPath.findModulePath(name);
    const { peerDependencies } = require(`${modulePath}${path.sep}package.json`);
    const pkgs = Object.entries(peerDependencies).map(([key, version]) => (`${key}@${version}`));
    const subCommands = {
        npm: 'install',
        yarn: 'add',
        pnpm: 'add'
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
    console.log('开始安装 peer dependencies ~');
    spawnSync(command, [subCommands[command], `${name}@${version}`, ...pkgs], { stdio: 'inherit' });
}