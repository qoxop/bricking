const path = require("path");
const fs = require("fs");
const del = require("del");
const ts = require('typescript');

const DistDir = path.resolve(__dirname, '../dist/');

// clear
del.sync(DistDir);
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

const tabLine = (str = '') => str.split('\n').map(line => line.trim() ? `\t${line}`: line).join('\n');
// concat types
const globalDeclareTypes = `declare global {\n
${tabLine(fs.readFileSync(path.resolve(__dirname, '../global.d.ts'),'utf8'))}
\n}`
fs.writeFileSync(
    path.resolve(DistDir, './index.d.ts'),
    `/// <reference types="systemjs" />\n\nimport "systemjs";\n\n${globalDeclareTypes}\n\nexport default window.$bricking;`
);