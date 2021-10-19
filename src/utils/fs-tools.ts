import fs from'fs';
import del from 'del';
import path from 'path';
import colors from 'colors';
import _copy from 'copy';
import yauzl from 'yauzl';

export function unzip(zipPath:string, to: string): Promise<void> {
    const rootName = path.parse(zipPath).name;
    const getFilePath  = (_fileName: string) => {
        const fileName = _fileName.replace(`${rootName}/`, '');
        const filePath = path.resolve(to, `./${fileName}`);
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        return filePath;
    }
    return new Promise((resolve, reject) => {
        console.log(colors.grey('开始解压～'));
        yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                return reject(err);
            };
            zipfile.readEntry();
            zipfile.on("entry", (entry) => {
                if (/\/$/.test(entry.fileName)) { // Directory file names end with '/'.
                    zipfile.readEntry();
                } else {
                    console.log(colors.grey(entry.fileName));
                    zipfile.openReadStream(entry, function(err, readStream) {
                        if (err) throw err;
                        readStream.on("end", function() {
                            zipfile.readEntry();
                        });
                        readStream.pipe(fs.createWriteStream(getFilePath(entry.fileName), { flags: 'wx' }));
                    });
                }
            })
            zipfile.on('close', () => {
                resolve()
            });
            zipfile.on('error', (err) => resolve(err))
        });
    });
}




export const copy = (from: string, to: string) => (new Promise<void>((resolve, reject) => {
    _copy(from, to, {}, err => {
        if (err) {
            return reject(err);
        }
        resolve();
    })
}));

export const clear = (dirs: string|string[])=> del(typeof dirs === 'string' ? [dirs]: dirs);

export const bufferString = (transform: (name: string, data: string) => string) => {
    return (name: string, data: Buffer) => Buffer.from(transform(name, data.toString()));
}

/**
 * 文件传输转化
 * @param from 
 * @param to 
 * @param transform 
 * @returns 
 */
export const fileTransfer = (from: string, to: string, transform: (name: string, data: Buffer) => Buffer|Promise<Buffer>): Promise<any> => {
    const items = fs.readdirSync(from, { withFileTypes: true });
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to);
    }
    const ps = [];
    for (const item of items) {
        const fromPath = path.resolve(from, item.name);
        const toPath = path.resolve(to, item.name);
        if (item.isFile()) {
            ps.push(new Promise<void>((resolve, reject) => {
                fs.readFile(fromPath, (rErr, data) => {
                    if (rErr) return reject(rErr);
                    Promise.resolve(transform(item.name, data)).then(newData => {
                        fs.writeFile(toPath, newData, (wErr) => {
                            if (wErr) reject(wErr);
                            resolve();
                        });
                    })
                })
            }))
        } else if (item.isDirectory()) {
            fileTransfer(fromPath, toPath, transform)
        }
    }
    return Promise.all(ps);
}