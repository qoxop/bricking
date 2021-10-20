"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = exports.getJson = void 0;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function getJson(jsonUrl) {
    const url = new URL(jsonUrl);
    const client = /https/.test(url.protocol) ? https_1.default : http_1.default;
    return new Promise((resolve, reject) => {
        const req = client.request(url, (res) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                }
                catch (e) {
                    reject(e.message);
                }
            });
        });
        req.end();
    });
}
exports.getJson = getJson;
function download(downloadUrl, to) {
    if (!fs_1.default.existsSync(path_1.default.dirname(to))) {
        fs_1.default.mkdirSync(path_1.default.dirname(to), { recursive: true });
    }
    return new Promise((resolve, reject) => {
        const url = new URL(downloadUrl);
        const client = /https/.test(url.protocol) ? https_1.default : http_1.default;
        const req = client.request(url, req => {
            const chunks = [];
            req.on('data', (data) => chunks.push(data));
            req.on('end', () => {
                fs_1.default.writeFile(to, Buffer.concat(chunks), err => {
                    if (err)
                        return reject(err);
                    resolve(to);
                });
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
        req.end();
    });
}
exports.download = download;
