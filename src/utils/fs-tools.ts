import fs from'fs';
import del from 'del';
import path from 'path';
import colors from 'colors';
import _copy from 'copy';
import yauzl from 'yauzl';
import yazl from 'yazl';


function fileIterator(dir: string, base: string, callback: (paths: { absolute: string; relative: string }, buff: Buffer) => void) {
    const files = fs.readdirSync(dir, { withFileTypes: true }) || [];
    files.forEach(item => {
        const absolute = path.join(dir, item.name);
        const relative = path.join(base, item.name)
        if (item.isFile()) {
            const buff = fs.readFileSync(path.join(dir, item.name));
            return callback({ absolute, relative }, buff);
        }
        if (item.isDirectory()) {
            fileIterator(absolute, relative, callback);
        }
    });
}

export function doZip(dir: string, prefix: string, output: string) {
    return new Promise<void>((resolve, reject) => {
        const zipFile = new yazl.ZipFile();
        zipFile.outputStream.pipe(fs.createWriteStream(output)).on("close", () => {
            console.log('📦 打包成功～')
            resolve()
        }).on('error', (err) => {
            console.error('📦 打包出错～');
            reject(err);
        });
        fileIterator(dir, prefix, ({ relative }, buff) => {
            zipFile.addBuffer(buff, relative);
        });
        zipFile.end();
    });
}

export function unZip(zipPath:string, to: string): Promise<void> {
    const rootName = path.parse(zipPath).name;
    const getFilePath  = (_fileName: string) => {
        const fileName = _fileName.replace(`${rootName}/`, '');
        const filePath = path.join(to, `./${fileName}`);
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
        const fromPath = path.join(from, item.name);
        const toPath = path.join(to, item.name);
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