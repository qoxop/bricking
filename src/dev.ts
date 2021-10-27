/**
 * 开发脚本
 */
import colors from 'colors';
import express from 'express';
import { watch } from 'rollup';
import alias from '@rollup/plugin-alias';
import livereload from 'rollup-plugin-livereload';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { buildSdk, copySdk } from './sdk';
import { buildHtml } from './build';
import { clear } from './utils/fs-tools';
import { rollupConfig } from './rollup_config';
import { getConfigs, getAliasEntries } from './utils/config';

const customConfig = getConfigs();

const { inputConfig, outputConfig } = rollupConfig(customConfig);

const { tsconfig, base, output, dev, bootstrap } = customConfig;

const EntryFileName = 'app.js';


export const start = async () => {
    // 1. 清空输出目录
    await clear(`${output}/**/*`);
    // 2. 构建 SDK
    const sdkInfo = await buildSdk();
    await copySdk();
    // 3. 生成HTML文件
    buildHtml({ output, sdkInfo, appEntry: EntryFileName, cdn: '/' });
    // 4. 监听变化，实时编译
    const watcher = watch({
        ...inputConfig,
        plugins: inputConfig.plugins.concat([
            alias({entries: getAliasEntries(tsconfig, base)}),
            livereload(),
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
    const devServe = express();
    // 5. 跨域设置
    devServe.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.originalUrl);
        next();
    });
    // 6. 静态资源服务
    devServe.use(express.static(output));
    // 7. 代理设置
    if (dev.proxyPath && dev.proxyOption) {
        devServe.use(
            dev.proxyPath,
            createProxyMiddleware(dev.proxyOption)
        );
    }
    // 8. 启动开发服务器
    devServe.listen(dev.port, () => {
        console.log(colors.green('\nServing!\n'), colors.grey(`- Local: http://${dev.host}:${dev.port}\n`));
        require('child_process').exec(`${process.platform === 'win32' ? 'start' : 'open'} http://${dev.host}:${dev.port}`);
    });
}
