import express from 'express';
import { exec } from 'child_process';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import * as logs from '../utils/log';

export type DevServe = {
    port: 3000;
    host: string;
    open: string;
    proxyPath?: string | RegExp | (string | RegExp)[];
    proxy?: ProxyOptions;
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
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.originalUrl);
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
      // 4. 启动开发服务器
      devServe.listen(config.port, () => {
        logs.keepLog(`[🛰 Serve]: ${config.host}:${config.port}`);
        resolve(devServe);
      });
    });
  }
  return servePromise;
};
