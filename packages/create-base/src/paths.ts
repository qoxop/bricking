/**
 * 路径管理
 */
import * as fs from 'fs';
import * as path from 'path';

import { getUserOptions } from './options';

const userOptions = getUserOptions()
const workspace = fs.realpathSync(userOptions.cwd);
const resolvePath = relativePath => path.resolve(workspace, relativePath);

export const paths = {
    workspace,
    tsconfig: resolvePath('tsconfig.json'),
    jsconfig: resolvePath('jsconfig.json'),
    packageJson: resolvePath('package.json'),
    baseIndexTs: resolvePath('index.ts'),
    outputPath: resolvePath(userOptions.output),
    webpackCache: resolvePath('node_modules/.cache'),
    babelConfig: resolvePath('babel.config.js'),
    postcssConfig: resolvePath('postcss.config.js'),
    browserslist: resolvePath('.browserslistrc'),
    baseOptions: resolvePath('.baseOptions.ts'),
}
