"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollupConfig = void 0;
/**
 * 构建脚本
 */
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const file_url_1 = __importDefault(require("./rollup-plugins/file-url"));
const runtime_css_1 = __importDefault(require("./rollup-plugins/runtime-css"));
const prodMode = process.env.NODE_ENV === 'production';
function rollupConfig(configs, isApp = true) {
    const { peerDependencies } = configs.packageJson;
    const assetsOutput = path_1.default.join(configs.output, configs.assets.relative);
    // 输入配置
    const inputConfig = {
        preserveEntrySignatures: "exports-only",
        plugins: [
            require('@rollup/plugin-node-resolve').default(),
            require('@rollup/plugin-commonjs')(),
            // Css 文件处理
            (0, runtime_css_1.default)({
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
            (0, file_url_1.default)({ limit: 0 }),
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
            ...(configs.minimize && prodMode ? [require('rollup-plugin-terser').terser({ format: { comments: false } })] : [])
        ],
        external: Object.keys(peerDependencies || {}).concat(configs.sdk.externals || []).concat([constants_1.STYLE_EXTERNALS_MODULE]),
    };
    const outputConfig = {
        dir: configs.output,
        format: 'system',
    };
    return { inputConfig, outputConfig };
}
exports.rollupConfig = rollupConfig;
