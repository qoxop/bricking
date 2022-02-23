/**
 * 入口代码生成
 */
import * as fs from 'fs';
import * as path from 'path';
import { paths } from '../paths';
import { getUserOptions } from '../options';

module.exports = function(source) {
    console.log(source)
    const {
        cwd,
        bundle: {
            dependencies: { exclude, sync },
            moduleRecord,
        }
    } = reloadOptions();
    console.log(cwd);
    if (!fs.existsSync(paths.packageJson))  {
        throw new Error(`${paths.packageJson} 不存在～`);
    }
    const {
        dependencies,
        name: baseName,
    } = require(paths.packageJson);
    const customModuleNames = Object.keys(moduleRecord);
    const npmModuleNames = Object
        .keys(dependencies || {})
        .filter(key => !exclude.includes(key) && !/^@types\//.test(key));

    // require('xx')
    const syncImports:string[] = [];
    // () => import('xx')
    const asyncImports:string[] = [];

    customModuleNames.forEach(name => {
        const moduleName = name === 'index' ?
            baseName :
            `${baseName}/${name}`;
        const requireInfo = typeof moduleRecord[name] === 'string' ?
            { path: moduleRecord[name], sync: false } :
            moduleRecord[name] as any;
        const absolutePath = path.isAbsolute(requireInfo.path) ?
            requireInfo.path:
            path.resolve(cwd, requireInfo.path);
        if (requireInfo.sync || name === 'index') {
            syncImports.push(`"${moduleName}": require("${absolutePath}")`);
        } else {
            asyncImports.push(`"${moduleName}": () => import("${absolutePath}")`);
        }
    });
    npmModuleNames.forEach(name => {
        if (sync.includes(name)) {
            syncImports.push(`"${name}": require("${name}")`);
        } else {
            asyncImports.push(`"${name}": () => import("${name}")`);
        }
    });
    let entryCode = `import "@bricking/runtime";\n`;
    if (!customModuleNames.includes('index') && fs.existsSync(paths.baseIndexTs)) {
        entryCode += `import "${paths.baseIndexTs}";\n`
    }
    if (syncImports.length) {
        entryCode += `\n\n window.$bricking.mm.set({${syncImports.join(',')}});`;
    }
    if (asyncImports.length) {
        entryCode += `\n\n window.$bricking.mm.setDynamic({${asyncImports.join(',')}});`
    }
    return entryCode;
};


const code = `
import { updateOptions } from "@bricking/create-base";

updateOptions({
    cwd: __dirname,
    output: 'dist',
});
`

const reloadOptions = () => {
    if (!fs.existsSync(paths.baseOptions)) {
        fs.writeFileSync(
            paths.baseOptions,
            code
        )
    }
    const cacheKey = require.resolve(paths.baseOptions,);
    if (require.cache[cacheKey]) {
        delete require.cache[cacheKey];
    }
    require(paths.baseOptions);
    return getUserOptions();
}