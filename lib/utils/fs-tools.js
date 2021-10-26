"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileTransfer = exports.bufferString = exports.clear = exports.copy = exports.unzip = void 0;
const fs_1 = __importDefault(require("fs"));
const del_1 = __importDefault(require("del"));
const path_1 = __importDefault(require("path"));
const colors_1 = __importDefault(require("colors"));
const copy_1 = __importDefault(require("copy"));
const yauzl_1 = __importDefault(require("yauzl"));
function unzip(zipPath, to) {
    const rootName = path_1.default.parse(zipPath).name;
    const getFilePath = (_fileName) => {
        const fileName = _fileName.replace(`${rootName}/`, '');
        const filePath = path_1.default.join(to, `./${fileName}`);
        const dirPath = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath);
        }
        return filePath;
    };
    return new Promise((resolve, reject) => {
        console.log(colors_1.default.grey('开始解压～'));
        yauzl_1.default.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                return reject(err);
            }
            ;
            zipfile.readEntry();
            zipfile.on("entry", (entry) => {
                if (/\/$/.test(entry.fileName)) { // Directory file names end with '/'.
                    zipfile.readEntry();
                }
                else {
                    console.log(colors_1.default.grey(entry.fileName));
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err)
                            throw err;
                        readStream.on("end", function () {
                            zipfile.readEntry();
                        });
                        readStream.pipe(fs_1.default.createWriteStream(getFilePath(entry.fileName), { flags: 'wx' }));
                    });
                }
            });
            zipfile.on('close', () => {
                resolve();
            });
            zipfile.on('error', (err) => resolve(err));
        });
    });
}
exports.unzip = unzip;
const copy = (from, to) => (new Promise((resolve, reject) => {
    (0, copy_1.default)(from, to, {}, err => {
        if (err) {
            return reject(err);
        }
        resolve();
    });
}));
exports.copy = copy;
const clear = (dirs) => (0, del_1.default)(typeof dirs === 'string' ? [dirs] : dirs);
exports.clear = clear;
const bufferString = (transform) => {
    return (name, data) => Buffer.from(transform(name, data.toString()));
};
exports.bufferString = bufferString;
/**
 * 文件传输转化
 * @param from
 * @param to
 * @param transform
 * @returns
 */
const fileTransfer = (from, to, transform) => {
    const items = fs_1.default.readdirSync(from, { withFileTypes: true });
    if (!fs_1.default.existsSync(to)) {
        fs_1.default.mkdirSync(to);
    }
    const ps = [];
    for (const item of items) {
        const fromPath = path_1.default.join(from, item.name);
        const toPath = path_1.default.join(to, item.name);
        if (item.isFile()) {
            ps.push(new Promise((resolve, reject) => {
                fs_1.default.readFile(fromPath, (rErr, data) => {
                    if (rErr)
                        return reject(rErr);
                    Promise.resolve(transform(item.name, data)).then(newData => {
                        fs_1.default.writeFile(toPath, newData, (wErr) => {
                            if (wErr)
                                reject(wErr);
                            resolve();
                        });
                    });
                });
            }));
        }
        else if (item.isDirectory()) {
            (0, exports.fileTransfer)(fromPath, toPath, transform);
        }
    }
    return Promise.all(ps);
};
exports.fileTransfer = fileTransfer;
