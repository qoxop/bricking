#!/usr/bin/env node

const { existsSync } = require('fs');
const { resolve } = require('path');

require('yargs')
    .scriptName('bricking')
    .command(
        'dev', 
        '启动开发服务器',
         () => void 0,
         () => {
            process.env.NODE_ENV = 'development';
            require('../dist/build').runStart();
        }
    ).command(
        'build',
        '构建项目',
        () => void 0,
        () => {
            process.env.NODE_ENV = 'production';
            require('../dist/build').runStart();
        }
    ).command(
        'serve',
        '启动静态服务',
        () => void 0,
        () => {
            process.env.NODE_ENV = 'production';
            require('../dist/build').runStart();
        }
    ).command(
        'install',
        '安装基础包的对等依赖(以提供开发时的类型提醒)',
        () => void 0,
        () => {
            console.log(process.argv0);
            let command = '';
            if (['npm', 'pnpm', 'yarn'].includes(process.argv0)) {
                command = process.argv0;
            }
            if (!command) {
                if (existsSync(resolve(process.cwd(), 'yarn.lock'))) {
                    command = 'yarn';
                } else if (existsSync(resolve(process.cwd(), 'pnpm-lock.yaml'))) {
                    command = 'pnpm';
                } else if (existsSync(resolve(process.cwd(), 'package-lock.json'))) {
                    command = 'npm';
                }
            }
            require('../dist/install').install(command);
        }
    )
    .help()
    .argv;