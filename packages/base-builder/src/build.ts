import './initialize';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import { getWebpackConfig, devServerConfig } from './config';

/**
 * 构建任务默认回调方法
 * @param err
 * @param stats
 */
const defaultCallback = (err, stats) => {
    if (err) throw err;
    process.stdout.write(`${stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
    })}\n\n`);
}

/**
 * 执行编译构建任务
 * @param callback
 */
const runBuild = (callback = defaultCallback) => {
    webpack(getWebpackConfig(process.env.NODE_ENV), callback);
};

/**
 * 执行编译构建，并启动开发服务器
 */
const runServer = async (port?: string) => {
    const baseWebpackConfig = getWebpackConfig(process.env.NODE_ENV);
    const compiler = webpack(baseWebpackConfig);
    const server = new WebpackDevServer({
        ...devServerConfig,
        ...(port ? {port} : {})
    }, compiler);
    console.log('Starting server...');
    await server.start();
    server.startCallback(() => {
        const origin = `${devServerConfig?.https ? 'https' : 'http'}://${devServerConfig?.host}:${devServerConfig?.port}`;
        console.log(`Successfully started server on ${origin} \n`);
        console.log(`entry file = ${origin}/${baseWebpackConfig.output?.filename} \n`);
    });
}

export {
    runBuild,
    runServer,
}