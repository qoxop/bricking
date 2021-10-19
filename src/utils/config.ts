import path from 'path';
import { Configs, UserOptions } from '../types';

const cwd = process.cwd();
const configPath = path.resolve(cwd, './s.config.js');
const pkgPath = path.resolve(cwd, 'package.json');
const prodMode = process.env.NODE_ENV === 'production';

/**
 * 相对路径改绝对路径
 * @param obj 
 * @param base 
 * @param keys 
 */
const ConfigAbsolutely = (obj: any, base: string, keys: string[]) => {
    keys.forEach(key => {
        if (!path.isAbsolute(obj[key])) {
            obj[key] = path.resolve(base, obj[key]);
        }
    })
}

const config:Configs = {
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
    },
    sdk: {
        type: 'local',
        location: './libs',
        extraCodes: '',
        realTime: false,
        pack: false
    },
    dev: {
        port: 5000
    }
};

export function getConfigs() {
    if (config.init) return config;

    config.packageJson = require(pkgPath);
    config.name = config.packageJson.name;

    const userOptions = require(configPath) as UserOptions;

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
    config.sdk = { ...config.sdk, ...(userOptions.sdk || {}) };
    config.dev = { ...config.dev, ...(userOptions.dev || {}) };
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

export const getAliasEntries = (tsconfig: string, base: string) => {
    let tsPaths = {} as any;
    try {
        tsPaths = require(tsconfig).compilerOptions.paths;
    } catch (error) {
        console.warn(error);
    }
    const entries = {};
    Object.entries(tsPaths).forEach(([key, value]) => {
        if (!/\*/.test(key) && value[0] && /\.tsx?$/.test(value[0])) {
            entries[key] = path.resolve(base, value[0]);
        }
    })
    return entries;
}