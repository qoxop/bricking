#!/usr/bin/env node

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
            require('../dist/build').runBuild();
        }
    ).command(
        'serve',
        '启动静态服务',
        () => void 0,
        () => {
            process.env.NODE_ENV = 'production';
            require('../dist/build').runServe();
        }
    ).command(
        'install',
        '安装基础包的对等依赖(以提供开发时的类型提醒)',
        () => void 0,
        () => {
            require('../dist/install').install();
        }
    )
    .help()
    .argv;