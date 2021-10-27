
/**
 * 构建脚本
 */
import fs from 'fs';
import url from 'url';
import path from 'path';
import { rollup } from 'rollup';
import { createHash } from "crypto";
import colors from 'colors';
import buildAppPlugin from './rollup-plugins/build-app';
// 配置信息
import { dom } from './html';
import { buildSdk, copySdk, SDKInfo } from './sdk';
import NAMES from './utils/names';
import { MODULESJson } from './types';
import { clear } from './utils/fs-tools';
import { getConfigs } from './utils/config';
import { rollupConfig } from './rollup_config';
import { REAL_TIME_SDK } from './rollup-plugins/build-sdk';

export const buildHtml = (options: {
    sdkInfo: SDKInfo;
    appEntry: string;
    output: string;
    cdn: string;
}) => {
    const { document } = dom.window;
    let {sdkInfo: { sdkEntry, systemjs, isRemote, realTime }, appEntry, output, cdn } = options;
    if (!isRemote) {
        sdkEntry = url.resolve(cdn, sdkEntry);
        systemjs = url.resolve(cdn, systemjs);
        appEntry = url.resolve(cdn, appEntry);
    }
    // 引入 system
    const systemScript = document.createElement('script');
    systemScript.src = systemjs;
    document.body.append(systemScript);
    if (realTime) { // 实时 SDK 模块
        // sdkEntry json 
        const combineCode = REAL_TIME_SDK(sdkEntry, url.resolve(cdn, appEntry));
        const hash = createHash("sha256").update([combineCode, 't2dkoi1a'].join(":")).digest("hex").slice(0, 8);
        const truesdkEntry = NAMES.sdkEntry.replace('[hash]', hash);
        fs.writeFileSync(path.join(output, truesdkEntry), combineCode);
        const sdkScript = document.createElement('script');
        sdkScript.src = url.resolve(cdn, truesdkEntry);
        sdkScript.type = 'systemjs-module';
        document.body.append(sdkScript);
    } else { // build_in SDK 模块
        const startScript = document.createElement('script');
        startScript.innerHTML = `System.import(${JSON.stringify(sdkEntry)}).then(function(){setTimeout(function(){System.import(${JSON.stringify(appEntry)})}, 10)})`;
        document.body.append(startScript);
    }
    fs.writeFileSync(path.join(output, './index.html'), dom.serialize(), { encoding: 'utf-8' });
}

export const build = async (app = false) => {
    console.log(colors.green('开始构建～'));
    console.time(colors.red.underline('构建时间'));
    // 1. 初始化配置参数
    const configs = getConfigs();
    const {prod: {cdn, pack, version }, entry, output, name, bootstrap } = configs;
    const entries = Object.entries(typeof entry === 'object' ? entry : { [configs.name]: entry });
    // 2. 定义模块信息对象
    const moduleInfo: MODULESJson = {
        version,
        updateTime: Date.now(),
        cdnPath: cdn,
        modules: {}
    };
    // 3. 清空输出目录
    await clear(`${output}/**/*`);
    // 4. 模块逐个编译
    for await (const [name, filePath] of entries) {
        console.log(colors.yellow(`开始处理模块 => ${name}：${filePath} \n`));
        const { inputConfig, outputConfig } = rollupConfig(configs);
        // 3.1 构建
        const bundle = await rollup({ input: filePath, ...inputConfig });
        // 3.2 写入bundle
        const output = await bundle.write({ 
            ...outputConfig,
            entryFileNames: NAMES.moduleEntry(name),
            chunkFileNames: NAMES.moduleChunk(name),
        });
        // 3.3 更新模块映射 & 打印信息
        output.output.forEach(item => {
            if (item.type === 'chunk' && item.isEntry) {
                moduleInfo.modules[name] = item.fileName;
            }
            console.log(colors.grey(`模块文件 => ${item.fileName}\n`));
        });
        bundle.close();
    }
    // 5. 写入模块信息
    if (pack) {
        moduleInfo.zipPath = NAMES.packMODULES(name);
    }
    await fs.promises.writeFile(
        path.join(configs.output, `./${NAMES.moduleInfo}`),
        JSON.stringify(moduleInfo, null, '\t'),
    );
    // 6. 打 zip 包
    if (pack) {
        await require('zip-dir')(configs.output, {
            saveTo: path.join(configs.output, moduleInfo.zipPath),
        });
    }
    // 7. 构建完整应用
    if (app) {
        let appEntry = '';
        const { inputConfig, outputConfig } = rollupConfig(configs);
        const bundle = await rollup({
            ...inputConfig,
            input: bootstrap,
            plugins: [buildAppPlugin(moduleInfo.modules), ...(inputConfig.plugins || [])]
        });
        const output = await bundle.write({
            ...outputConfig,
            entryFileNames: NAMES.appEntry,
            chunkFileNames: NAMES.appChunk,
        });
        appEntry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName
        const sdkInfo = await buildSdk();
        await copySdk();
        buildHtml({
            sdkInfo,
            appEntry,
            cdn: configs.prod.cdn,
            output: configs.output,
        })
    }
    console.timeEnd(colors.red.underline('构建时间'));
}
