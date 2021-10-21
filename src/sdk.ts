/**
 * 构建SDK
 */
import fs from 'fs';
import url from 'url';
import { rollup } from 'rollup';
import NAMES from './utils/names';
import { SDKJson } from './types';
import { resolve, parse } from 'path';
import { getConfigs } from './utils/config';
import { rollupConfig } from './rollup_config';
import { download, getJson } from './utils/network';
import { copy, clear, unzip } from './utils/fs-tools';
import sdkPlugin, { InputName, GetMd5 } from './rollup-plugins/build-sdk';

const customConfig = getConfigs();

const { output, packageJson, sdk, minimize, base } = customConfig;

const DefaultSystemjsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/systemjs/6.11.0/system.min.js'

/**
 * 拷贝SDK文件到输出目录
 * @returns
 */
export const copySdk = () => (sdk.type === 'local' && copy(`${sdk.location}/**/*`, output));

/**
 * 检测SDK是否需要重新构建
 */
export const sdkHasChange = () => {
    if (sdk.type === 'local') {
        const { location } = sdk;
        const md5 = GetMd5({ pkg_json: packageJson, sdk_config: sdk });
        const sdkInfoPath = resolve(location, `./${NAMES.sdkInfo}`);
        // 1. SDK.json 是否存在？
        if (!fs.existsSync(sdkInfoPath)) return true;
        // 2. 读取 SDK.json 中的信息
        const {md5: lastMd5, files = []} = require(sdkInfoPath);
        // 3. MD5 是否一致，文件列表是否为空
        if (lastMd5 !== md5 || !files.length) return; true;
        // 4. 文件列表中指定的文件是否存在
        for (const file of files) {
            const exists = fs.existsSync(resolve(location,file)); 
            if (!exists) return true;
        }
        return false;
    }
    return true;
}

const urlResolve = (source:string, subPath: string) => {
    if (/\.\w+$/.test(source)) {
        return url.resolve(source, subPath);
    }
    if (/\/\w+$/.test(source)) {
        source += '/';
    }
    return url.resolve(source, subPath);
}

export type SDKInfo = {
    sdkEntry: string;
    systemjs: string;
    isRemote: boolean;
    realTime?: boolean;
}

/**
 * 构建SDK
 */
export async function buildSdk(force = false):Promise<SDKInfo> {
    if (sdk.type === 'remote-js') {
        return {
            isRemote: true,
            sdkEntry: sdk.remote,
            systemjs: sdk.systemjs || DefaultSystemjsCdn
        }
    } else if (sdk.type === 'remote-json') {
        const remoteSDKInfo = await getJson<SDKJson>(sdk.remote);
        if (!remoteSDKInfo.systemjs) {
            remoteSDKInfo.systemjs = 'system.min.js'
        }
        if (sdk.build_in) {
            if (remoteSDKInfo.zipPath) {
                const zipFileName = parse(remoteSDKInfo.zipPath).base;
                const zipFilePath = resolve(base, `./libs/SDK/${zipFileName}`);
                if (!fs.existsSync(zipFilePath) || force) {
                    const downloadUrl = /^https?/.test(remoteSDKInfo.cdnPath || '') ?
                        urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.zipPath) :
                        urlResolve(sdk.remote, remoteSDKInfo.zipPath);
                    if (fs.existsSync(resolve(base, './libs/SDK'))) {
                        await clear(resolve(base, './libs/SDK/**/*'));
                    }
                    await download(downloadUrl, zipFilePath);
                }
                await unzip(zipFilePath, output);
                return {
                    // 本地相对路径
                    isRemote: false,
                    sdkEntry: remoteSDKInfo.entry,
                    systemjs: remoteSDKInfo.systemjs
                }
            } else {
                return {
                    // 远程绝对路径
                    isRemote: true,
                    sdkEntry: urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.entry),
                    systemjs: urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.systemjs),
                }
            }
        } else {
            return {
                // 实时获取 SDK 入口文件
                isRemote: true,
                realTime: true,
                sdkEntry: sdk.remote,
                systemjs: urlResolve(remoteSDKInfo.cdnPath, remoteSDKInfo.systemjs),
            }
        }
    } else if (sdk.type === 'local') {                  //### 使用本地缓存的 SDK
        let SDKInfo: SDKJson;
        // 1. 初始化参数
        const { inputConfig: { plugins } } = rollupConfig(customConfig, false);
        const { peerDependencies = {} } = packageJson;
        // 2. 检测是否有变化
        if (sdkHasChange() || force) {
            // 3. 清空目录
            await clear(`${location}/**/*`);
            // 4. 编译
            const bundle = await rollup({
                input: InputName,
                preserveEntrySignatures: "exports-only",
                plugins: [
                    ...plugins,
                    ...((minimize && !plugins.some(item => item && item.name === 'terser')) ? [require('rollup-plugin-terser').terser()] : []), // SDK 一定要压缩
                    sdkPlugin({ pkg_json: packageJson, sdk_config: sdk, callback: (info) => SDKInfo = info }),
                ],
                external: []
            });
            // 5. 写入文件
            await bundle.write({
                dir: sdk.location,
                format: "system",
                entryFileNames: NAMES.sdkEntry,
                chunkFileNames: NAMES.sdkChunk,
                manualChunks: Object.keys(peerDependencies).reduce((pre, cur) => {
                    pre[cur] = [cur];
                    return pre;
                }, {} as any)
            });
            // 6. 打包zip包📦
            if (sdk.pack) {
                await require('zip-dir')(location, {
                    saveTo: resolve(sdk.location, SDKInfo.zipPath),
                });
            }
        } else {
            SDKInfo = require(resolve(sdk.location, `./${NAMES.sdkInfo}`))
        }
        // 6. 拷贝一份到输出目录
        await copySdk();
        return {
            isRemote: false,
            sdkEntry: SDKInfo.entry,
            systemjs: 'system.min.js'
        };
    }
}
