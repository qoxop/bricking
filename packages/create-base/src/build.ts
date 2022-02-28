import './initialize';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

// import typesPack from './utils/types-pack';
import { getWebpackConfig, devServerConfig } from './config';

// @ts-ignore
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
 * 监听变化，实时重新编译构建
 */
const runWatch = (callback = defaultCallback) => {
    const compiler = webpack(getWebpackConfig(process.env.NODE_ENV));
    compiler.watch({
        aggregateTimeout: 600,
        ignored: /node_modules/,
        poll: 2000,
    }, callback);
}

/**
 * 执行编译构建，并启动开发服务器
 */
const runServer = async () => {
    const baseWebpackConfig = getWebpackConfig(process.env.NODE_ENV);
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

export {
    runBuild,
    runWatch,
    runServer,
}