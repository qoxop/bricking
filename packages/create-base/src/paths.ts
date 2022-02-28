/**
 * 路径管理
 */
import * as fs from 'fs';
import * as path from 'path';
import { getUserOptions } from './options';

const workspace = process.cwd();

const userOptions = getUserOptions();

const resolvePath = (relativePath: string) => path.resolve(workspace, relativePath);

const paths = {
    workspace,
    tsconfig: resolvePath('tsconfig.json'),
    jsconfig: resolvePath('jsconfig.json'),
    outputPath: resolvePath(userOptions.output),
    packageJson: resolvePath('package.json'),
    babelConfig: resolvePath('babel.config.js'),
    baseIndexTs: resolvePath(userOptions?.bundle?.entry || 'index.ts'),
    webpackCache: resolvePath('node_modules/.cache'),
    browserslist: resolvePath('.browserslistrc'),
    postcssConfig: resolvePath('postcss.config.js'),
    brickingrc: process.env.BRICKING_RC,
};

const getCustomWebpackPath = () => {
    let { bundle: { webpack: customWebpackPath }} = userOptions;
    if (!customWebpackPath) {
        return false;
    }
    if (!path.isAbsolute(customWebpackPath)) {
        customWebpackPath = path.resolve(workspace, customWebpackPath);
    }
    return fs.existsSync(customWebpackPath) ? customWebpackPath : false;
}

const getPackageJson = () => {
    if (!fs.existsSync(paths.packageJson)) {
        throw new Error(`${paths.packageJson} 不存在 ～`);
    }
    return require(paths.packageJson);
}
const reloadOptions = () => {
    const cacheKey = require.resolve(paths.brickingrc);
    if (require.cache[cacheKey]) {
        delete require.cache[cacheKey];
        require(paths.brickingrc);
    }
    return getUserOptions();
}

export {
    paths,
    workspace,
    reloadOptions,
    getPackageJson,
    getCustomWebpackPath,
}