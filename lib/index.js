"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mfConfig = exports.config = void 0;
const path_1 = __importDefault(require("path"));
const cwd = process.cwd();
const pkgPath = path_1.default.resolve(cwd, 'package.json');
const prodMode = process.env.NODE_ENV === 'production';
const DefaultSystemjsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/systemjs/6.11.0/system.min.js';
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
exports.config = {
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
function mfConfig(userOptions) {
    var _a, _b, _c, _d, _e;
    exports.config.packageJson = require(pkgPath);
    exports.config.name = exports.config.packageJson.name;
    if (!userOptions.entry)
        throw new Error("entry field is empty~");
    if (!userOptions.bootstrap)
        throw new Error("bootstrap field is empty~");
    if (typeof userOptions.entry === 'string') {
        exports.config.entry = { [exports.config.name]: userOptions.entry };
    }
    else {
        exports.config.entry = userOptions.entry;
    }
    ConfigAbsolutely(exports.config.entry, exports.config.base, Object.keys(exports.config.entry));
    exports.config.output = (_a = userOptions.output) !== null && _a !== void 0 ? _a : exports.config.output;
    exports.config.bootstrap = (_b = userOptions.bootstrap) !== null && _b !== void 0 ? _b : exports.config.bootstrap;
    exports.config.minimize = (_c = userOptions.minimize) !== null && _c !== void 0 ? _c : exports.config.minimize;
    exports.config.externals = (_d = userOptions.externals) !== null && _d !== void 0 ? _d : exports.config.externals;
    exports.config.prod = { ...exports.config.prod, ...(userOptions.prod || {}) };
    exports.config.assets = { ...exports.config.assets, ...(userOptions.assets || {}) };
    exports.config.dev = { ...exports.config.dev, ...(userOptions.dev || {}) };
    switch ((_e = userOptions === null || userOptions === void 0 ? void 0 : userOptions.sdk) === null || _e === void 0 ? void 0 : _e.type) {
        case 'local':
            // @ts-ignore
            exports.config.sdk = { ...exports.config.sdk, ...userOptions.sdk };
            break;
        case 'remote-js':
            if (!userOptions.sdk.remote)
                throw new Error("remote-js模式需要一个远端入口文件");
            exports.config.sdk = {
                type: 'remote-js',
                systemjs: userOptions.sdk.systemjs || DefaultSystemjsCdn,
                remote: userOptions.sdk.remote,
                externals: userOptions.sdk.externals
            };
            break;
        case 'remote-json':
            if (!userOptions.sdk.remote)
                throw new Error("remote-json模式需要一个远端入口文件");
            exports.config.sdk = {
                type: 'remote-json',
                systemjs: userOptions.sdk.systemjs || DefaultSystemjsCdn,
                remote: userOptions.sdk.remote,
                build_in: userOptions.sdk.build_in === false ? false : true,
                externals: userOptions.sdk.externals
            };
            break;
    }
    exports.config.init = true;
    ConfigAbsolutely(exports.config, exports.config.base, ['output', 'bootstrap', 'tsconfig']);
    // 非空字符串的相对路径后需要加 / 
    if (!!exports.config.assets.relative && !/\/$/.test(exports.config.assets.relative)) {
        exports.config.assets.relative += '/';
    }
    if (exports.config.sdk.type === 'local') {
        ConfigAbsolutely(exports.config.sdk, exports.config.base, ['location']);
    }
    return exports.config;
}
exports.mfConfig = mfConfig;
