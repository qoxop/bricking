import colors from 'colors';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getConfigs } from './utils/config';

export const serve = () => {
    const configs = getConfigs()
    const devServe = express();
    devServe.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.originalUrl);
        next();
    });
    // 静态资源服务
    devServe.use(express.static(configs.output));
    // 代理设置
    if (configs.dev.proxyPath && configs.dev.proxyOption) {
        devServe.use(
            configs.dev.proxyPath,
            createProxyMiddleware(configs.dev.proxyOption)
        );
    }
    // 启动开发服务器
    devServe.listen(configs.dev.port, () => {
        console.log(colors.green('\nServing!\n'), colors.grey(`- Local: http://${configs.dev.host}:${configs.dev.port}\n`));
        require('child_process').exec(`${process.platform === 'win32' ? 'start' : 'open'} http://${configs.dev.host}:${configs.dev.port}`);
    });
}