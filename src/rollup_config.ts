
/**
 * 构建脚本
 */
import path from 'path';
import { RollupOptions, OutputOptions } from 'rollup';
// 自定义插件
import fileUrl from './rollup-plugins/file-url';
import runtimeCss from './rollup-plugins/runtime-css';
// 配置信息
import { Configs } from './types';

const prodMode = process.env.NODE_ENV === 'production';

export function rollupConfig(options: Configs, isApp = true) {
    const { peerDependencies } =  options.packageJson;
    const assetsOutput = path.resolve(options.output, options.assets.relative);
    // 输入配置
    const inputConfig: RollupOptions = {
        preserveEntrySignatures: "exports-only",
        plugins: [
            require('@rollup/plugin-node-resolve').default(),
            // @ts-ignore
            require('@rollup/plugin-commonjs')(),
            // Css 文件处理
            runtimeCss({
                modules: options?.assets?.cssModules,
                autoModules: options?.assets?.autoCssModules,
                relativeBase: options.assets.relative,
                output: assetsOutput,
                combineExtract: isApp,
                plugins: [
                    require('postcss-url')({ url: 'copy', assetsPath: assetsOutput, useHash: true }),
                    ...(options.minimize && prodMode ? [require('cssnano')({ preset: 'default' })] : []),
                ],
                use: {
                    less: { rewriteUrls: 'all' }
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
                tsconfig: options.tsconfig,
            }),
            ...(options.minimize && prodMode ? [require('rollup-plugin-terser').terser({ format: {comments: false }})] : [])
        ],
        external: Object.keys(peerDependencies || {}).concat(options.externals),
    };
    const outputConfig: OutputOptions = {
        dir: options.output,
        format: 'system',
    }
    return { inputConfig, outputConfig }
}
