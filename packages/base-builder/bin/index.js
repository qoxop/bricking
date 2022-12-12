#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

require('yargs')
    .scriptName('build-base')
    .usage('$0 <cmd> [args]')
    .command(
        'dev [dir]', 
        '启动开发服务器',
        function (yargs) {
            yargs.positional('port', {
                alias: 'p',
                default: '',
                describe: '指定开发服务器端口'
            });
            yargs.positional('dir', {
              alias: 'd',
              default: process.cwd(),
              describe: '指定项目根目录'
            });
            yargs.positional('prod', {
                default: false,
                describe: '以生产模式进行构建'
            });
        },
        function (argv) {
            const cwd = path.isAbsolute(argv.dir) ? argv.dir :  path.resolve(process.cwd(), argv.dir);
            spawn('node', [
                path.resolve(__dirname, './task.dev.js'),
                ...process.argv.slice(3),
            ],{
                cwd,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: argv.prod ? 'production' : 'development',
                }
            });
        }
    ).command(
        'build [dir]',
        '构建项目',
        function (yargs) {
            yargs.positional('dir', {
                alias: 'd',
                default: process.cwd(),
                describe: '指定项目根目录'
            });
        },
        function (argv) {
            const cwd = path.isAbsolute(argv.dir) ? argv.dir :  path.resolve(process.cwd(), argv.dir);
            spawn('node', [
                path.resolve(__dirname, './task.build.js'),
                ...process.argv.slice(3),
            ],{
                cwd,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                }
            });
        }
    ).command(
        'test [dir]',
        '仅编译类型文件',
        function (yargs) {
            yargs.positional('dir', {
                alias: 'd',
                default: process.cwd(),
                describe: '指定项目根目录'
            });
        },
        function (argv) {
            const cwd = path.isAbsolute(argv.dir) ? argv.dir :  path.resolve(process.cwd(), argv.dir);
            spawn('node', [
                path.resolve(__dirname, './task.test.js'),
                ...process.argv.slice(3),
            ],{
                cwd,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                }
            });
        }
    )
    .help()
    .argv;