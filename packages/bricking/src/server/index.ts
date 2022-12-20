import * as path from 'path';
import express from 'express';
import { exec } from 'child_process';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import * as logs from '../utils/log';

export type DevServe = {
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
  exec(`${process.platform === 'win32' ? 'start' : 'open'} ${url}`);
  opened = true;
};
// @ts-ignore
let servePromise:Promise<any> = null;
export const startServe = (config: DevServe, dist: string) => {
  if (!servePromise) {
    servePromise = new Promise((resolve) => {
      const devServe = express();
      // 1. 跨域设置
      devServe.use((req, res, next) => {
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
      // 5. 启动开发服务器
      devServe.listen(config.port, () => {
        logs.keepLog(`[🛰 Serve]: ${config.host}:${config.port}`);
        resolve(devServe);
      });
    });
  }
  return servePromise;
};
