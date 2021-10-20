
/**
 * 构建脚本
 */
import fs from 'fs';
import path from 'path';
import { rollup } from 'rollup';
import { createHash } from "crypto";
import colors from 'colors';
import buildAppPlugin from './rollup-plugins/build-app';
// 配置信息
import { dom } from './html';
import { buildSdk } from './sdk';
import NAMES from './utils/names';
import { MODULESJson } from './types';
import { clear } from './utils/fs-tools';
import { getConfigs } from './utils/config';
import { rollupConfig } from './rollup_config';
import { REAL_TIME_CODE } from './rollup-plugins/build-sdk';

export const buildHtml = (options: {
    sdkEntry: string,
    appEntry: string,
    realTime: boolean,
    output: string,
    cdn: string,
}) => {
    let {sdkEntry, appEntry, realTime = false, output, cdn } = options;
    sdkEntry = realTime ? sdkEntry : path.resolve(cdn, sdkEntry);
    appEntry = path.resolve(cdn, appEntry);
    
    if (realTime) { // 整合 SDK 与 app 入口
        const combineCode = REAL_TIME_CODE(sdkEntry, appEntry);
        const hash = createHash("sha256").update([combineCode, 't2dkoi1a'].join(":")).digest("hex").slice(0, 8);
        sdkEntry = NAMES.sdkEntry.replace('[hash]', hash);
        fs.writeFileSync(path.resolve(output, sdkEntry), combineCode);
    }
    const { document } = dom.window;
    // 引入 system
    const systemScript = document.createElement('script');
    systemScript.src = 'system.min.js';
    document.body.append(systemScript);


    if (realTime) {
        const sdkScript = document.createElement('script');
        sdkScript.src = sdkEntry;
        sdkScript.type = 'systemjs-module';
        document.body.append(sdkScript);
    } else {
        const startScript = document.createElement('script');
        startScript.innerHTML = `System.import("${sdkEntry}").then(function() { System.import("${appEntry}") })`;
        document.body.append(startScript);
    }

    fs.writeFileSync(path.resolve(output, './index.html'), dom.serialize(), { encoding: 'utf-8' });
}

export const build = async (app = false) => {
    console.log(colors.green('开始构建～'));
    console.time(colors.red.underline('构建时间'));
    // 1. 初始化配置参数
    const configs = getConfigs();
    const {prod: {cdn, pack, version }, entry, output, name, bootstrap, sdk } = configs;
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
        path.resolve(configs.output, `./${NAMES.moduleInfo}`),
        JSON.stringify(moduleInfo, null, '\t'),
    );
    // 6. 打 zip 包
    if (pack) {
        await require('zip-dir')(configs.output, {
            saveTo: path.resolve(configs.output, moduleInfo.zipPath),
        });
    }
    // 7. 构建完整应用
    if (app) {
        const appInfo = { appEntry: '', sdkEntry: '' };
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
        appInfo.appEntry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName
        appInfo.sdkEntry = await buildSdk();
        buildHtml({
            ...appInfo,
            realTime: sdk.realTime,
            output: configs.output,
            cdn: configs.prod.cdn
        })
    }
    console.timeEnd(colors.red.underline('构建时间'));
}
