const path = require("path");
const fs = require("fs-extra");
const ts = require('typescript');

const DistDir = path.resolve(__dirname, '../dist/');

fs.removeSync(DistDir)
if (!fs.existsSync(DistDir)) fs.mkdirSync(DistDir);

// bundle
ts.createProgram({
    rootNames: [path.resolve(__dirname, '../src/index.ts')],
    options: {
        outDir: DistDir,
        emitDeclarationOnly: false,
        esModuleInterop: true,
        declaration: true,
        skipLibCheck: true
    }
}).emit();

// copy
fs.writeFileSync(
    path.resolve(DistDir, './index.d.ts'),
    fs.readFileSync(path.resolve(__dirname, '../global.d.ts'),'utf8')
);