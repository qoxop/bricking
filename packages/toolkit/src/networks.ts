/**
 * 网络工具
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

/**
 * JSON 文件信息获取，支持本地、http、https
 * @param jsonUrl
 * @returns 
 */
function getJson<T = any>(jsonUrl: string):Promise<T> {
    // 本地 JSON
    if (!/^http/.test(jsonUrl)) {
        try {
            return Promise.resolve(require(jsonUrl) as T);
        } catch (error) {
            return Promise.reject(error);
        }
        
    }
    const url = new URL(jsonUrl);
    const client = /https/.test(url.protocol) ? https : http;
    return new Promise((resolve, reject) => {
        const req = client.request(url, (res) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    reject(e.message);
                }
            });
        });
        req.end();
    })
}

/**
 * 文件下载
 * @param downloadUrl 
 * @param to 
 * @returns 
 */
function download(downloadUrl:string, to: string): Promise<string> {
    if (!fs.existsSync(path.dirname(to))) {
        fs.mkdirSync(path.dirname(to), { recursive: true });
    }
    return new Promise((resolve, reject) => {
        const url = new URL(downloadUrl);
        const client = /https/.test(url.protocol) ? https : http;
        const req = client.request(url, req => {
            const chunks = [];
            req.on('data', (data) => chunks.push(data));
            req.on('end', () => {
                fs.writeFile(to, Buffer.concat(chunks), err => {
                    if (err) return reject(err);
                    resolve(to);
                });
            })
        });
        req.on('error', reject);
        req.end();
    });
}

export {
    getJson,
    download,
}