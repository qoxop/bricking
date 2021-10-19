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
const { inputConfig: { plugins } } = rollupConfig(customConfig, false);
const { output, packageJson, sdk, minimize } = customConfig;

/**
 * 拷贝SDK文件到输出目录
 * @returns
 */
export const copySdk = () => copy(`${sdk.location}/**/*`, output);

/**
 * 检测SDK是否需要重新构建
 */
export const sdkHasChange = () => {
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

/**
 * 构建SDK
 */
export async function buildSdk(force = false):Promise<string> {
    const { location, type, realTime } = sdk;
    if (type === 'remote' ) { //### 使用远端在线的 SDK
        // 实时的或者以 js 结尾的
        if (/https?.*\.js$/.test(location) || realTime) {
            return location;
        }
        const remoteSDKInfo = await getJson<SDKJson>(location);
        // 存在 zip 包的
        if (remoteSDKInfo.zipPath) {
            const fileName = parse(remoteSDKInfo.zipPath).base;
            const zipPath = resolve(location, `./SDK/${fileName}`);
            // 本地已经存在同名的zip包
            if (!fs.existsSync(zipPath) || force) {
                let zipDownloadUrl = url.resolve(new URL(location).origin, remoteSDKInfo.entry);
                if (/^https?/.test(remoteSDKInfo.cdnPath || '')) {
                    zipDownloadUrl = url.resolve(remoteSDKInfo.cdnPath, remoteSDKInfo.entry);
                }
                // 清空存放zip包的目录
                if (fs.existsSync(resolve(location, './SDK'))) {
                    await clear(resolve(location, './SDK/**/*'));
                }
                await download(zipDownloadUrl, zipPath);
            }
            // 解压到输出目录
            await unzip(zipPath, output)
            // 使用相对路径
            return remoteSDKInfo.entry;
        }
        if (!remoteSDKInfo.cdnPath || ['', '/'].includes(remoteSDKInfo.cdnPath)) {
            return url.resolve(new URL(location).origin, remoteSDKInfo.entry);
        }
        return url.resolve(remoteSDKInfo.cdnPath, remoteSDKInfo.entry);
    } else {                  //### 使用本地缓存的 SDK
        let SDKInfo: SDKJson;
        // 1. 初始化参数
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
                dir: location,
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
                    saveTo: resolve(location, SDKInfo.zipPath),
                });
            }
        } else {
            SDKInfo = require(resolve(location, `./${NAMES.sdkInfo}`))
        }
        // 6. 拷贝一份到输出目录
        await copySdk();
        return SDKInfo.entry;
    }
}


