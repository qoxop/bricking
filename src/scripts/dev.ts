/**
 * 开发脚本
 */
import { watch } from 'rollup';
import alias from '@rollup/plugin-alias';
import livereload from 'rollup-plugin-livereload';
import { buildHtml } from './build';
import { clear } from '../utils/fs-tools';
import { buildSdk, copySdk, sdkHasChange } from './sdk';
import { rollupConfig } from '../rollup_config';
import { getConfigs, getAliasEntries } from '../utils/config';

const customConfig = getConfigs();

const { inputConfig, outputConfig } = rollupConfig(customConfig);

const { tsconfig, base, output, bootstrap } = customConfig;

const EntryFileName = 'app.js';


export const start = async () => {
    // 1. 清空输出目录
    await clear(`${output}/**/*`);
    // 2. 构建 SDK
    if (sdkHasChange()) { // SDK 必须以生产模式构建
        throw new Error("检测到配置变化，请重新构建 SDK，运行 ` bricking build --sdk ` ");
    }
    const sdkInfo = await buildSdk();
    await copySdk();
    // 3. 生成HTML文件
    buildHtml({ output, sdkInfo, appEntry: EntryFileName, cdn: '/' });
    // 4. 监听变化，实时编译
    const watcher = watch({
        ...inputConfig,
        plugins: inputConfig.plugins.concat([
            alias({entries: getAliasEntries(tsconfig, base)}),
            livereload(),
        ]),
        input: bootstrap,
        output: { ...outputConfig, entryFileNames: EntryFileName },
        watch: {
            buildDelay: 300,
            exclude: ['node_modules/**']
        }
    });
    

    let started = false
    watcher.on('event', (event) => {
        if (event.code === 'BUNDLE_END') {
            event.result.close();
        }
        if (event.code === 'END' && !started) {
            require('./serve').serve(false);
            started = true;
        }
    });
    
}
