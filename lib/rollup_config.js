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
function rollupConfig(options, isApp = true) {
    var _a, _b;
    const { peerDependencies } = options.packageJson;
    const assetsOutput = path_1.default.resolve(options.output, options.assets.relative);
    // 输入配置
    const inputConfig = {
        preserveEntrySignatures: "exports-only",
        plugins: [
            require('@rollup/plugin-node-resolve').default(),
            // @ts-ignore
            require('@rollup/plugin-commonjs')(),
            // Css 文件处理
            (0, runtime_css_1.default)({
                modules: (_a = options === null || options === void 0 ? void 0 : options.assets) === null || _a === void 0 ? void 0 : _a.cssModules,
                autoModules: (_b = options === null || options === void 0 ? void 0 : options.assets) === null || _b === void 0 ? void 0 : _b.autoCssModules,
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
            (0, file_url_1.default)({ limit: 0 }),
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
            ...(options.minimize && prodMode ? [require('rollup-plugin-terser').terser({ format: { comments: false } })] : [])
        ],
        external: Object.keys(peerDependencies || {}).concat(options.externals),
    };
    const outputConfig = {
        dir: options.output,
        format: 'system',
    };
    return { inputConfig, outputConfig };
}
exports.rollupConfig = rollupConfig;
