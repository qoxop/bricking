const path = require("path");
const fs = require("fs");
const del = require("del");

const DistDir = path.resolve(__dirname, '../dist/');

// clear
del.sync(DistDir);
if (!fs.existsSync(DistDir)) fs.mkdirSync(DistDir);

// bundle
require("esbuild").build({
    entryPoints: [path.resolve(__dirname,'../index.ts')],
    bundle: true,
    platform: 'browser',
    target: 'esnext',
    format: 'esm',
    minify: true,
    outfile: path.resolve(__dirname, '../dist/index.js'),
});

// create package.json
const packageJson = require('../package.json');
delete packageJson.publishConfig;
delete packageJson.scripts;
delete packageJson.dependencies.systemjs;
fs.writeFileSync(
    path.resolve(__dirname, '../dist/package.json'),
    JSON.stringify(packageJson, null, '\t')
);

const tabLine = (str = '') => str.split('\n').map(line => line.trim() ? `\t${line}`: line).join('\n');
// concat types
const globalDeclareTypes = `declare global {\n
${tabLine(fs.readFileSync(path.resolve(__dirname, '../global.d.ts'),'utf8'))}
\n}`
fs.writeFileSync(
    path.resolve(__dirname, '../dist/index.d.ts'),
    `/// <reference types="systemjs" />\n\nimport "systemjs";\n\n${globalDeclareTypes}`
);