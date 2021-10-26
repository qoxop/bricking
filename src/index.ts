import path from 'path';
import { Configs, UserOptions } from './types';

const cwd = process.cwd();
const pkgPath = path.join(cwd, 'package.json');
const prodMode = process.env.NODE_ENV === 'production';
const DefaultSystemjsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/systemjs/6.11.0/system.min.js';

/**
 * 相对路径改绝对路径
 * @param obj 
 * @param base 
 * @param keys 
 */
const ConfigAbsolutely = (obj: any, base: string, keys: string[]) => {
    keys.forEach(key => {
        if (!path.isAbsolute(obj[key])) {
            obj[key] = path.join(base, obj[key]);
        }
    })
}

export const config: Configs = {
    init: false,
    name: '',
    base: cwd,
    entry: {},
    output: './dist',
    bootstrap: './index.ts',
    minimize: prodMode,
    tsconfig: './tsconfig.json',
    packageJson: {},
    externals: [],
    prod: {
        cdn: '/',
        version: '1.0.0',
        pack: false
    },
    assets: {
        relative: 'assets/',
        cssModules: false,
        autoCssModules: true,
        injectType: 'link',
    },
    sdk: {
        type: 'local',
        location: './libs',
        extraCodes: '',
        pack: false,
        externals: [],
        version: '1.0.0',
    },
    dev: {
        port: 5000,
        host: 'localhost'
    }
};

export function mfConfig(userOptions: UserOptions):Configs {
    config.packageJson = require(pkgPath);
    config.name = config.packageJson.name;
    if (!userOptions.entry) throw new Error("entry field is empty~");
    if (!userOptions.bootstrap) throw new Error("bootstrap field is empty~");

    if (typeof userOptions.entry ==='string') {
        config.entry = {[config.name]: userOptions.entry}
    } else {
        config.entry = userOptions.entry;
    }
    ConfigAbsolutely(config.entry, config.base, Object.keys(config.entry));
    
    config.output = userOptions.output ?? config.output;
    config.bootstrap = userOptions.bootstrap ?? config.bootstrap;
    config.minimize = userOptions.minimize ?? config.minimize;
    config.externals = userOptions.externals ?? config.externals;
    config.prod = { ...config.prod, ...(userOptions.prod || {}) };
    config.assets = { ...config.assets, ...(userOptions.assets || {}) };
    config.dev = { ...config.dev, ...(userOptions.dev || {}) };
    switch (userOptions?.sdk?.type) {
        case 'local':
            // @ts-ignore
            config.sdk = { ...config.sdk, ...userOptions.sdk };
            break;
        case 'remote-js':
            if (!userOptions.sdk.remote) throw new Error("remote-js模式需要一个远端入口文件");
            config.sdk = {
                type: 'remote-js',
                systemjs: userOptions.sdk.systemjs || DefaultSystemjsCdn,
                remote: userOptions.sdk.remote,
                externals: userOptions.sdk.externals
            }
            break;
        case 'remote-json':
            if (!userOptions.sdk.remote) throw new Error("remote-json模式需要一个远端入口文件");
            config.sdk = {
                type: 'remote-json',
                systemjs: userOptions.sdk.systemjs || DefaultSystemjsCdn,
                remote: userOptions.sdk.remote,
                build_in: userOptions.sdk.build_in === false ? false : true,
                externals: userOptions.sdk.externals
            }
            break;
    }
    config.init = true;
    ConfigAbsolutely(config, config.base, [ 'output', 'bootstrap', 'tsconfig']);

    // 非空字符串的相对路径后需要加 / 
    if (!!config.assets.relative && !/\/$/.test(config.assets.relative)) {
        config.assets.relative += '/';
    }
    if (config.sdk.type === 'local') {
        ConfigAbsolutely(config.sdk, config.base, ['location'])
    }
    return config;
}
