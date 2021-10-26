
/**
 * 构建脚本
 */
import path from 'path';
import { RollupOptions, OutputOptions } from 'rollup';
import { STYLE_EXTERNALS_MODULE } from './constants'
import fileUrl from './rollup-plugins/file-url';
import runtimeCss from './rollup-plugins/runtime-css';
import { Configs } from './types';

const prodMode = process.env.NODE_ENV === 'production';

export function rollupConfig(configs: Configs, isApp = true) {
    const { peerDependencies } = configs.packageJson;
    const assetsOutput = path.join(configs.output, configs.assets.relative);
    // 输入配置
    const inputConfig: RollupOptions = {
        preserveEntrySignatures: "exports-only",
        plugins: [
            require('@rollup/plugin-node-resolve').default(),
            require('@rollup/plugin-commonjs')(),
            // Css 文件处理
            runtimeCss({
                inject: {
                    type: configs.assets.injectType,
                },
                stylesRelative: configs.assets.relative,
                modules: {
                    force: configs.assets.cssModules,
                    auto: configs.assets.autoCssModules,
                    namedExports: false
                },
                output: assetsOutput,
                postcss: {
                    plugins: [
                        ...(configs.minimize && prodMode ? [require('cssnano')({ preset: 'default' })] : []),
                    ],
                }
            }),
            // 处理文件
            fileUrl({ limit:  0}),
            require('@rollup/plugin-replace')({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                },
                preventAssignment: true,
            }),
            // 编译 ts
            require('@rollup/plugin-typescript')({
                tsconfig: configs.tsconfig,
            }),
            ...(configs.minimize && prodMode ? [require('rollup-plugin-terser').terser({ format: {comments: false }})] : [])
        ],
        external: Object.keys(peerDependencies || {}).concat(configs.sdk.externals || []).concat([STYLE_EXTERNALS_MODULE]),
    };
    const outputConfig: OutputOptions = {
        dir: configs.output,
        format: 'system',
    }
    return { inputConfig, outputConfig }
}
