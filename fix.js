const fs = require('fs');
const path = require('path');
const copy = require('copy');

const sourceDir = (sp) => `${path.join(__dirname, sp)}/**/*`;
const sourceFile = (name) =>  `${path.join(__dirname, name)}`;
const targetPath = (tp) => path.join(__dirname, `./package`, tp);

// 拷贝模版
copy(sourceDir('./templates'), targetPath('./templates'), {}, err => {
    if (err) {
        return console.error(err);
    }
    console.log('templates copied ~ \n');
});

// 拷贝文件
copy([
    sourceFile('./package.json'),
    sourceFile('./LICENSE'),
    sourceFile('./README.md'),
    sourceFile('./yarn.lock')
], targetPath('./'), {}, err => {
    if (err) {
        return console.error(err);
    }
    console.log('files copied ~ \n');
});

(function clearTSD(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
        const filepath = path.resolve(dir, item);
        fs.stat(filepath, function (err, stat) {
            if (err) {
                console.error(err);
            } else {
                if (stat.isFile()) {
                    if (/\.d\.ts$/.test(filepath) && !['index.d.ts', 'types.d.ts'].includes(item)) {
                        fs.unlinkSync(filepath);
                    }
                } else if (stat.isDirectory()) {
                    clearTSD(filepath);
                }
            }
        })
    }
})(path.resolve(__dirname, './package'));

fs.unlinkSync(path.resolve(__dirname, './package/types.js'))
