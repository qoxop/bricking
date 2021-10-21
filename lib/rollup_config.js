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
// 自定义插件
const file_url_1 = __importDefault(require("./rollup-plugins/file-url"));
const runtime_css_1 = __importDefault(require("./rollup-plugins/runtime-css"));
const prodMode = process.env.NODE_ENV === 'production';
function rollupConfig(configs, isApp = true) {
    var _a, _b;
    const { peerDependencies } = configs.packageJson;
    const assetsOutput = path_1.default.resolve(configs.output, configs.assets.relative);
    // 输入配置
    const inputConfig = {
        preserveEntrySignatures: "exports-only",
        plugins: [
            require('@rollup/plugin-node-resolve').default(),
            require('@rollup/plugin-commonjs')(),
            // Css 文件处理
            (0, runtime_css_1.default)({
                modules: (_a = configs === null || configs === void 0 ? void 0 : configs.assets) === null || _a === void 0 ? void 0 : _a.cssModules,
                autoModules: (_b = configs === null || configs === void 0 ? void 0 : configs.assets) === null || _b === void 0 ? void 0 : _b.autoCssModules,
                relativeBase: configs.assets.relative,
                output: assetsOutput,
                combineExtract: isApp,
                plugins: [
                    require('postcss-url')({ url: 'copy', assetsPath: assetsOutput, useHash: true }),
                    ...(configs.minimize && prodMode ? [require('cssnano')({ preset: 'default' })] : []),
                ],
                use: {
                    less: { rewriteUrls: 'all' }
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
        external: Object.keys(peerDependencies || {}).concat(configs.sdk.externals || []),
    };
    const outputConfig = {
        dir: configs.output,
        format: 'system',
    };
    return { inputConfig, outputConfig };
}
exports.rollupConfig = rollupConfig;
