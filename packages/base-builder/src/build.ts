import './initialize';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import { getWebpackConfig, devServerConfig } from './config';
import { getUserOptions } from './options';

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
    chunkModules: false,
  })}\n\n`);
};

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
  let { bundle: { devEntry } } = getUserOptions();
  const baseWebpackConfig = getWebpackConfig(process.env.NODE_ENV, devEntry);
  const devServer = { ...devServerConfig, ...(port ? { port } : {}) };
  const compiler = webpack({ ...baseWebpackConfig, devServer });

  let log:Function;
  compiler.hooks.assetEmitted.tap('bricking-run-server', (file) => {
    if (/^base-js-bricking\..*js$/.test(file)) {
      log = () => {
        const { devServer: { hostname } } = getUserOptions();
        const origin = `${devServerConfig?.https ? 'https' : 'http'}://${hostname}:${devServerConfig?.port}`;
        console.log('\n');
        console.log('> \u001b[41m\u001b[37m🚀 🚀 server started ~  \u001b[39m\u001b[49m \n');
        console.log(`> origin =  \u001b[33m\u001b[4m${origin}\u001b[24m\u001b[39m`);
        console.log(`> entry  =  \u001b[33m\u001b[4m${origin}/${file}\u001b[24m\u001b[39m`);
      };
    }
  });
  compiler.hooks.afterDone.tap('bricking-run-server', () => {
    setTimeout(() => {
      if (log) {
        log();
      }
    }, 100);
  });

  const server = new WebpackDevServer(devServer, compiler);
  server.start();
};

export {
  runBuild,
  runServer,
};
