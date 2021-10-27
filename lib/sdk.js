"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSdk = exports.sdkHasChange = exports.copySdk = void 0;
/**
 * 构建SDK
 */
const fs_1 = __importDefault(require("fs"));
const url_1 = __importDefault(require("url"));
const rollup_1 = require("rollup");
const names_1 = __importDefault(require("./utils/names"));
const path_1 = require("path");
const config_1 = require("./utils/config");
const rollup_config_1 = require("./rollup_config");
const network_1 = require("./utils/network");
const fs_tools_1 = require("./utils/fs-tools");
const build_sdk_1 = __importStar(require("./rollup-plugins/build-sdk"));
const constants_1 = require("./constants");
const customConfig = (0, config_1.getConfigs)();
const { output, packageJson, sdk, minimize, base, prod } = customConfig;
const DefaultSystemjsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/systemjs/6.11.0/system.min.js';
/**
 * 拷贝SDK文件到输出目录
 * @returns
 */
const copySdk = () => (sdk.type === 'local' && (0, fs_tools_1.copy)(`${sdk.location}/**/*`, output));
exports.copySdk = copySdk;
/**
 * 检测SDK是否需要重新构建
 */
const sdkHasChange = () => {
    if (sdk.type === 'local') {
        const { location } = sdk;
        const md5 = (0, build_sdk_1.GetMd5)({ pkg_json: packageJson, sdk_config: sdk });
        const sdkInfoPath = (0, path_1.resolve)(location, `./${names_1.default.sdkInfo}`);
        // 1. SDK.json 是否存在？
        if (!fs_1.default.existsSync(sdkInfoPath))
            return true;
        // 2. 读取 SDK.json 中的信息
        const { md5: lastMd5, files = [] } = require(sdkInfoPath);
        // 3. MD5 是否一致，文件列表是否为空
        if (lastMd5 !== md5 || !files.length)
            return;
        true;
        // 4. 文件列表中指定的文件是否存在
        for (const file of files) {
            const exists = fs_1.default.existsSync((0, path_1.resolve)(location, file));
            if (!exists)
                return true;
        }
        return false;
    }
    return true;
};
exports.sdkHasChange = sdkHasChange;
const urlResolve = (source, subPath) => {
    if (/\.\w+$/.test(source)) {
        return url_1.default.resolve(source, subPath);
    }
    if (/\/\w+$/.test(source)) {
        source += '/';
    }
    return url_1.default.resolve(source, subPath);
};
/**
 * 构建SDK
 */
async function buildSdk(force = false) {
    if (sdk.type === 'remote-js') {
        return {
            isRemote: true,
            sdkEntry: sdk.remote,
            systemjs: sdk.systemjs || DefaultSystemjsCdn
        };
    }
    else if (sdk.type === 'remote-json') {
        const remoteSDKInfo = await (0, network_1.getJson)(sdk.remote);
        if (!remoteSDKInfo.systemjs || !remoteSDKInfo.cdnPath || ['/', ''].includes(remoteSDKInfo.cdnPath)) {
            remoteSDKInfo.systemjs = DefaultSystemjsCdn;
        }
        else {
            remoteSDKInfo.systemjs = url_1.default.resolve(remoteSDKInfo.cdnPath, remoteSDKInfo.systemjs);
        }
        if (sdk.build_in) {
            if (remoteSDKInfo.zipPath) {
                const zipFileName = (0, path_1.parse)(remoteSDKInfo.zipPath).base;
                const zipFilePath = (0, path_1.resolve)(base, `./libs/SDK/${zipFileName}`);
                if (!fs_1.default.existsSync(zipFilePath) || force) {
                    const downloadUrl = /^https?/.test(remoteSDKInfo.cdnPath || '') ?
                        urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.zipPath) :
                        urlResolve(sdk.remote, remoteSDKInfo.zipPath);
                    if (fs_1.default.existsSync((0, path_1.resolve)(base, './libs/SDK'))) {
                        await (0, fs_tools_1.clear)((0, path_1.resolve)(base, './libs/SDK/**/*'));
                    }
                    await (0, network_1.download)(downloadUrl, zipFilePath);
                }
                await (0, fs_tools_1.unzip)(zipFilePath, output);
                return {
                    // 本地相对路径
                    isRemote: false,
                    sdkEntry: remoteSDKInfo.entry,
                    systemjs: remoteSDKInfo.systemjs
                };
            }
            else {
                return {
                    // 远程绝对路径
                    isRemote: true,
                    sdkEntry: urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.entry),
                    systemjs: urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.systemjs),
                };
            }
        }
        else {
            return {
                // 实时获取 SDK 入口文件
                isRemote: true,
                realTime: true,
                sdkEntry: sdk.remote,
                systemjs: urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.systemjs),
            };
        }
    }
    else if (sdk.type === 'local') { //### 使用本地缓存的 SDK
        let SDKInfo;
        // 1. 初始化参数
        const { inputConfig: { plugins } } = (0, rollup_config_1.rollupConfig)(customConfig, false);
        const { peerDependencies = {} } = packageJson;
        // 2. 检测是否有变化
        if ((0, exports.sdkHasChange)() || force) {
            // 3. 清空目录
            await (0, fs_tools_1.clear)(`${sdk.location}/**/*`);
            // 4. 编译
            const bundle = await (0, rollup_1.rollup)({
                input: build_sdk_1.InputName,
                preserveEntrySignatures: "exports-only",
                plugins: [
                    ...plugins,
                    ...((minimize && !plugins.some(item => item && item.name === 'terser')) ? [require('rollup-plugin-terser').terser()] : []),
                    (0, build_sdk_1.default)({ cdnPath: prod.cdn, pkg_json: packageJson, sdk_config: sdk, callback: (info) => SDKInfo = info }),
                ],
                external: [constants_1.STYLE_EXTERNALS_MODULE]
            });
            // 5. 写入文件
            await bundle.write({
                dir: sdk.location,
                format: "system",
                entryFileNames: names_1.default.sdkEntry,
                chunkFileNames: names_1.default.sdkChunk,
                manualChunks: Object.keys(peerDependencies).reduce((pre, cur) => {
                    pre[cur] = [cur];
                    return pre;
                }, {})
            });
            // 6. 打包zip包📦
            if (sdk.pack) {
                await require('zip-dir')(location, {
                    saveTo: (0, path_1.resolve)(sdk.location, SDKInfo.zipPath),
                });
            }
        }
        else {
            SDKInfo = require((0, path_1.resolve)(sdk.location, `./${names_1.default.sdkInfo}`));
        }
        return {
            isRemote: false,
            sdkEntry: SDKInfo.entry,
            systemjs: 'system.min.js'
        };
    }
}
exports.buildSdk = buildSdk;
