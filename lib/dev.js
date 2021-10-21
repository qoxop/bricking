"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
/**
 * 开发脚本
 */
const colors_1 = __importDefault(require("colors"));
const express_1 = __importDefault(require("express"));
const rollup_1 = require("rollup");
const plugin_alias_1 = __importDefault(require("@rollup/plugin-alias"));
const rollup_plugin_livereload_1 = __importDefault(require("rollup-plugin-livereload"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const sdk_1 = require("./sdk");
const build_1 = require("./build");
const fs_tools_1 = require("./utils/fs-tools");
const rollup_config_1 = require("./rollup_config");
const config_1 = require("./utils/config");
const customConfig = (0, config_1.getConfigs)();
const { inputConfig, outputConfig } = (0, rollup_config_1.rollupConfig)(customConfig);
const { tsconfig, base, output, dev, bootstrap } = customConfig;
const EntryFileName = 'app.js';
const start = async () => {
    // 1. 清空输出目录
    await (0, fs_tools_1.clear)(`${output}/**/*`);
    // 2. 构建 SDK
    const sdkInfo = await (0, sdk_1.buildSdk)();
    // 3. 生成HTML文件
    (0, build_1.buildHtml)({ output, sdkInfo, appEntry: EntryFileName, cdn: '/' });
    // 4. 监听变化，实时编译
    const watcher = (0, rollup_1.watch)({
        ...inputConfig,
        plugins: inputConfig.plugins.concat([
            (0, plugin_alias_1.default)({ entries: (0, config_1.getAliasEntries)(tsconfig, base) }),
            (0, rollup_plugin_livereload_1.default)(),
        ]),
        input: bootstrap,
        output: { ...outputConfig, entryFileNames: EntryFileName },
        watch: {
            buildDelay: 300,
            exclude: ['node_modules/**']
        }
    });
    watcher.on('event', (event) => {
        if (event.code === 'BUNDLE_END') {
            event.result.close();
        }
    });
    const devServe = (0, express_1.default)();
    // 5. 跨域设置
    devServe.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.originalUrl);
        next();
    });
    // 6. 静态资源服务
    devServe.use(express_1.default.static(output));
    // 7. 代理设置
    if (dev.proxyPath && dev.proxyOption) {
        devServe.use(dev.proxyPath, (0, http_proxy_middleware_1.createProxyMiddleware)(dev.proxyOption));
    }
    // 8. 启动开发服务器
    devServe.listen(dev.port, () => {
        console.log(colors_1.default.green('\nServing!\n'), colors_1.default.grey(`- Local: http://${dev.host}:${dev.port}\n`));
        require('child_process').exec(`${process.platform === 'win32' ? 'start' : 'open'} http://${dev.host}:${dev.port}`);
    });
};
exports.start = start;
