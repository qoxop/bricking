const fs = require('fs');
const path =require('path');

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
})(path.resolve(__dirname, './lib'))
