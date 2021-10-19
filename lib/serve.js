"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serve = void 0;
const colors_1 = __importDefault(require("colors"));
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const config_1 = require("./utils/config");
const serve = () => {
    const configs = (0, config_1.getConfigs)();
    const devServe = (0, express_1.default)();
    devServe.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', req.originalUrl);
        next();
    });
    // 静态资源服务
    devServe.use(express_1.default.static(configs.output));
    // 代理设置
    if (configs.dev.proxyPath && configs.dev.proxyOption) {
        devServe.use(configs.dev.proxyPath, (0, http_proxy_middleware_1.createProxyMiddleware)(configs.dev.proxyOption));
    }
    // 启动开发服务器
    devServe.listen(configs.dev.port, () => {
        console.log(colors_1.default.green('\nServing!\n'), colors_1.default.grey(`- Local: http://localhost:${configs.dev.port}\n`));
    });
};
exports.serve = serve;