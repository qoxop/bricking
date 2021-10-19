"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAliasEntries = exports.getConfigs = void 0;
const path_1 = __importDefault(require("path"));
const cwd = process.cwd();
const configPath = path_1.default.resolve(cwd, './s.config.js');
const pkgPath = path_1.default.resolve(cwd, 'package.json');
const prodMode = process.env.NODE_ENV === 'production';
/**
 * 相对路径改绝对路径
 * @param obj
 * @param base
 * @param keys
 */
const ConfigAbsolutely = (obj, base, keys) => {
    keys.forEach(key => {
        if (!path_1.default.isAbsolute(obj[key])) {
            obj[key] = path_1.default.resolve(base, obj[key]);
        }
    });
};
const config = {
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
function getConfigs() {
    var _a, _b, _c, _d;
    if (config.init)
        return config;
    config.packageJson = require(pkgPath);
    config.name = config.packageJson.name;
    const userOptions = require(configPath);
    if (!userOptions.entry)
        throw new Error("entry field is empty~");
    if (!userOptions.bootstrap)
        throw new Error("bootstrap field is empty~");
    if (typeof userOptions.entry === 'string') {
        config.entry = { [config.name]: userOptions.entry };
    }
    else {
        config.entry = userOptions.entry;
    }
    ConfigAbsolutely(config.entry, config.base, Object.keys(config.entry));
    config.output = (_a = userOptions.output) !== null && _a !== void 0 ? _a : config.output;
    config.bootstrap = (_b = userOptions.bootstrap) !== null && _b !== void 0 ? _b : config.bootstrap;
    config.minimize = (_c = userOptions.minimize) !== null && _c !== void 0 ? _c : config.minimize;
    config.externals = (_d = userOptions.externals) !== null && _d !== void 0 ? _d : config.externals;
    config.prod = { ...config.prod, ...(userOptions.prod || {}) };
    config.assets = { ...config.assets, ...(userOptions.assets || {}) };
    config.sdk = { ...config.sdk, ...(userOptions.sdk || {}) };
    config.dev = { ...config.dev, ...(userOptions.dev || {}) };
    config.init = true;
    ConfigAbsolutely(config, config.base, ['output', 'bootstrap', 'tsconfig']);
    // 非空字符串的相对路径后需要加 / 
    if (!!config.assets.relative && !/\/$/.test(config.assets.relative)) {
        config.assets.relative += '/';
    }
    if (config.sdk.type === 'local') {
        ConfigAbsolutely(config.sdk, config.base, ['location']);
    }
    return config;
}
exports.getConfigs = getConfigs;
const getAliasEntries = (tsconfig, base) => {
    let tsPaths = {};
    try {
        tsPaths = require(tsconfig).compilerOptions.paths;
    }
    catch (error) {
        console.warn(error);
    }
    const entries = {};
    Object.entries(tsPaths).forEach(([key, value]) => {
        if (!/\*/.test(key) && value[0] && /\.tsx?$/.test(value[0])) {
            entries[key] = path_1.default.resolve(base, value[0]);
        }
    });
    return entries;
};
exports.getAliasEntries = getAliasEntries;
