#!/usr/bin/env node

const { argv } = require('yargs');

const { _: commands, $0, ...ARGS} = argv;
const command = commands[0];
// 参数环境变量
process.env.$ARGS = ARGS;
process.env.NODE_ENV = 'production';

function buildSdk() {
    process.env.NODE_ENV = 'production';
    require('../lib/sdk').buildSdk(true);
}

function buildModules(app = false) {
    process.env.NODE_ENV = 'production';
    return require('../lib/build').build(app);
}

function startDevServe() {
    process.env.NODE_ENV = 'development';
    require('../lib/dev').start();
}

switch(command) {
    case 'create':
        const tplName = ARGS['t'] || 'default';
        const projName = ARGS['n'] || 'my-app';
        require('../lib/create').create(tplName, projName);
        break;
    case 'build':
        if (ARGS['sdk']) {
            buildSdk();
        } else if (ARGS['app']) {
            buildModules(true);
        } else {
            buildModules(false);
        }
        break;
    case 'dev':
        startDevServe();
        break;
    case 'serve':
        let ps = Promise.resolve();
        if (ARGS['app']) {
            ps = buildModules(true);
        } else {
            ps = buildModules(false);
        }
        ps.then(() => {
            require('../lib/serve').serve();
        })
        break;
    default:
        if (ARGS['h'] === true || ARGS['help'] === true) {
            console.log('TODO~');
        } else {
            console.error('无效命令～');
        }
}
