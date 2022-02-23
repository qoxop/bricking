import { merge } from 'webpack-merge';
import webpack, { Configuration } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import { getWebpackConfig, devServerConfig } from './src/config'
import { updateOptions } from './src/options';

// @ts-ignore
let baseWebpackConfig = getWebpackConfig(process.env.NODE_ENV || 'production')

const defaultCallback = (err, stats) => {
    if (err) {
        return console.error(err);
    }
    console.log(stats)
}
/**
 * 执行编译构建任务
 * @param callback
 */
const runBuild = (callback = defaultCallback) => {
    console.log(baseWebpackConfig);
    webpack(baseWebpackConfig, callback);
};

/**
 * 监听变化，实时重新编译构建
 */
const runWatch = (callback = defaultCallback) => {
    const compiler = webpack(baseWebpackConfig);
    compiler.watch({
        aggregateTimeout: 600,
        ignored: /node_modules/,
        poll: 2000,
    }, callback)
}

/**
 * 执行编译构建，并启动开发服务器
 */
const runServer = async () => {
    const compiler = webpack(baseWebpackConfig);
    const server = new WebpackDevServer(devServerConfig, compiler);
    console.log('Starting server...');
    await server.start();
    server.startCallback(() => {
        const origin = `${devServerConfig?.https ? 'https' : 'http'}://${devServerConfig?.host}:${devServerConfig?.port}`;
        console.log(`Successfully started server on ${origin} \n`);
        console.log(`entry file = ${origin}/${baseWebpackConfig.output?.filename} \n`);
    });
}

/**
 * 合并配置文件
 * @param mergeConf
 * @returns 
 */
const mergeConfig = (mergeConf: Configuration | ((base: Configuration) => Configuration)) => {
    if (typeof mergeConf === 'function') {
        baseWebpackConfig = mergeConf(baseWebpackConfig);
    } else {
        baseWebpackConfig = merge(baseWebpackConfig, mergeConf);
    }
    return {
        run: runBuild,
        watch: runWatch,
        server: runServer
    }
}

export {
    runBuild,
    runWatch,
    runServer,
    mergeConfig,
    updateOptions,
}