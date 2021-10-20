"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = exports.buildHtml = void 0;
/**
 * 构建脚本
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rollup_1 = require("rollup");
const crypto_1 = require("crypto");
const colors_1 = __importDefault(require("colors"));
const build_app_1 = __importDefault(require("./rollup-plugins/build-app"));
// 配置信息
const html_1 = require("./html");
const sdk_1 = require("./sdk");
const names_1 = __importDefault(require("./utils/names"));
const fs_tools_1 = require("./utils/fs-tools");
const config_1 = require("./utils/config");
const rollup_config_1 = require("./rollup_config");
const build_sdk_1 = require("./rollup-plugins/build-sdk");
const buildHtml = (options) => {
    let { sdkEntry, appEntry, realTime = false, output, cdn } = options;
    sdkEntry = realTime ? sdkEntry : path_1.default.resolve(cdn, sdkEntry);
    appEntry = path_1.default.resolve(cdn, appEntry);
    if (realTime) { // 整合 SDK 与 app 入口
        const combineCode = (0, build_sdk_1.REAL_TIME_CODE)(sdkEntry, appEntry);
        const hash = (0, crypto_1.createHash)("sha256").update([combineCode, 't2dkoi1a'].join(":")).digest("hex").slice(0, 8);
        sdkEntry = names_1.default.sdkEntry.replace('[hash]', hash);
        fs_1.default.writeFileSync(path_1.default.resolve(output, sdkEntry), combineCode);
    }
    const { document } = html_1.dom.window;
    // 引入 system
    const systemScript = document.createElement('script');
    systemScript.src = 'system.min.js';
    document.body.append(systemScript);
    if (realTime) {
        const sdkScript = document.createElement('script');
        sdkScript.src = sdkEntry;
        sdkScript.type = 'systemjs-module';
        document.body.append(sdkScript);
    }
    else {
        const startScript = document.createElement('script');
        startScript.innerHTML = `System.import("${sdkEntry}").then(function() { System.import("${appEntry}") })`;
        document.body.append(startScript);
    }
    fs_1.default.writeFileSync(path_1.default.resolve(output, './index.html'), html_1.dom.serialize(), { encoding: 'utf-8' });
};
exports.buildHtml = buildHtml;
const build = async (app = false) => {
    console.log(colors_1.default.green('开始构建～'));
    console.time(colors_1.default.red.underline('构建时间'));
    // 1. 初始化配置参数
    const configs = (0, config_1.getConfigs)();
    const { prod: { cdn, pack, version }, entry, output, name, bootstrap, sdk } = configs;
    const entries = Object.entries(typeof entry === 'object' ? entry : { [configs.name]: entry });
    // 2. 定义模块信息对象
    const moduleInfo = {
        version,
        updateTime: Date.now(),
        cdnPath: cdn,
        modules: {}
    };
    // 3. 清空输出目录
    await (0, fs_tools_1.clear)(`${output}/**/*`);
    // 4. 模块逐个编译
    for await (const [name, filePath] of entries) {
        console.log(colors_1.default.yellow(`开始处理模块 => ${name}：${filePath} \n`));
        const { inputConfig, outputConfig } = (0, rollup_config_1.rollupConfig)(configs);
        // 3.1 构建
        const bundle = await (0, rollup_1.rollup)({ input: filePath, ...inputConfig });
        // 3.2 写入bundle
        const output = await bundle.write({
            ...outputConfig,
            entryFileNames: names_1.default.moduleEntry(name),
            chunkFileNames: names_1.default.moduleChunk(name),
        });
        // 3.3 更新模块映射 & 打印信息
        output.output.forEach(item => {
            if (item.type === 'chunk' && item.isEntry) {
                moduleInfo.modules[name] = item.fileName;
            }
            console.log(colors_1.default.grey(`模块文件 => ${item.fileName}\n`));
        });
        bundle.close();
    }
    // 5. 写入模块信息
    if (pack) {
        moduleInfo.zipPath = names_1.default.packMODULES(name);
    }
    await fs_1.default.promises.writeFile(path_1.default.resolve(configs.output, `./${names_1.default.moduleInfo}`), JSON.stringify(moduleInfo, null, '\t'));
    // 6. 打 zip 包
    if (pack) {
        await require('zip-dir')(configs.output, {
            saveTo: path_1.default.resolve(configs.output, moduleInfo.zipPath),
        });
    }
    // 7. 构建完整应用
    if (app) {
        const appInfo = { appEntry: '', sdkEntry: '' };
        const { inputConfig, outputConfig } = (0, rollup_config_1.rollupConfig)(configs);
        const bundle = await (0, rollup_1.rollup)({
            ...inputConfig,
            input: bootstrap,
            plugins: [(0, build_app_1.default)(moduleInfo.modules), ...(inputConfig.plugins || [])]
        });
        const output = await bundle.write({
            ...outputConfig,
            entryFileNames: names_1.default.appEntry,
            chunkFileNames: names_1.default.appChunk,
        });
        appInfo.appEntry = output.output.find(item => item.type === 'chunk' && item.isEntry).fileName;
        appInfo.sdkEntry = await (0, sdk_1.buildSdk)();
        (0, exports.buildHtml)({
            ...appInfo,
            realTime: sdk.realTime,
            output: configs.output,
            cdn: configs.prod.cdn
        });
    }
    console.timeEnd(colors_1.default.red.underline('构建时间'));
};
exports.build = build;
