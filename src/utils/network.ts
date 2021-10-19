import https from 'https';
import http from 'http';
import fs from 'fs';

export function getJson<T = any>(jsonUrl: string):Promise<T> {
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

export function download(downloadUrl:string, to: string): Promise<string> {
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
        req.on('error', (err) => {
            reject(err);
        })
        req.end();
    })
}
