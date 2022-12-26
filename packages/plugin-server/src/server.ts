import * as path from 'path';
import express from 'express';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import { createWss, initWatcher } from './livereload';

type ExpressApp = ReturnType<typeof express>;
export type ServeConfig = {
  port: number;
  host: string;
  open: string;
  /**
   * 配置那些路径走代理服务
   */
  proxyPath?: string | RegExp | (string | RegExp)[];
  /**
   * 代理配置
   *
   * https://github.com/chimurai/http-proxy-middleware#options
   */
  proxy?: ProxyOptions;
  routes?: Array<{
    method?: 'get'|'post';
    path: string;
    handler: express.Handler
  }>
}

let opened = false;

export const openBrowser = (url: string) => {
  if (opened) return;
  require('./openBrowser')(url);
  opened = true;
};

let servePromise:Promise<ExpressApp> = null as any;

export const startServe = (config: ServeConfig, dist: string):Promise<ExpressApp> => {
  if (!servePromise) {
    servePromise = new Promise((resolve) => {
      const devServe = express();
      // 1. 跨域设置
      devServe.use((_, res, next) => {
        // res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      });
      // 2. 静态资源服务
      devServe.use(express.static(dist));
      // 3. 代理设置
      if (config.proxy && config.proxyPath) {
        devServe.use(
          config.proxyPath,
          createProxyMiddleware(config.proxy),
        );
      }
      if (config.routes && config.routes.length) {
        config.routes.forEach(({ method = 'get', path: p, handler }) => {
          if (['get', 'post'].includes(method) && p && !!handler) {
            devServe[method](p, handler);
          }
        });
      }
      // 4. support browserHistory
      devServe.get('*', (_, response) => {
        response.sendFile(path.resolve(dist, 'index.html'));
      });
      // 5. 监听变化 -> 通知页面刷新
      if (!process.env.USE_WS_PROXY_PORT) createWss(devServe);

      // 6. 启动开发服务器
      devServe.listen(config.port, () => {
        console.log(`[🛰 Serve]: ${config.host}:${config.port}`);
        initWatcher({
          dir: dist,
          wsPort: +(process.env.USE_WS_PROXY_PORT || config.port),
        });
        if (config.open) {
          const url = /^http/.test(config.open)
            ? config.open
            : `http://${config.host}:${config.port}/${config.open.replace(/^\//, '')}`;
          openBrowser(url);
        }
        resolve(devServe);
      });
    });
  }
  return servePromise;
};
