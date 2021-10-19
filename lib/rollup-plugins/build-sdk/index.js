"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMd5 = exports.InputName = exports.REAL_TIME_CODE = void 0;
const md5_1 = __importDefault(require("md5"));
const path = __importStar(require("path"));
const code_template_1 = require("../code-template");
Object.defineProperty(exports, "REAL_TIME_CODE", { enumerable: true, get: function () { return code_template_1.REAL_TIME_CODE; } });
const names_1 = __importDefault(require("../../utils/names"));
exports.InputName = path.resolve(process.cwd(), `./rumtime-systemjs-sdk.js`);
const GetMd5 = (options) => {
    const { pkg_json = {}, import_maps = {}, sdk_config } = options;
    const { extraCodes = '', version = '' } = sdk_config || {};
    return (0, md5_1.default)(JSON.stringify(pkg_json) +
        JSON.stringify(import_maps) +
        (typeof extraCodes === 'string' ? extraCodes : extraCodes.join('\n;')) +
        version);
};
exports.GetMd5 = GetMd5;
function default_1(options) {
    const { cdnPath = '/', pkg_json = {}, import_maps = {}, sdk_config, callback } = options;
    const { extraCodes = '' } = sdk_config || {};
    const { peerDependencies = {} } = pkg_json;
    const md5 = (0, exports.GetMd5)(options);
    const modules = Object.keys(peerDependencies).map(name => (`'${name}': () => import('${name}'),\n`)).join('\t');
    return {
        name: 'sdk-builder',
        resolveId(source) {
            if (exports.InputName === source) {
                return exports.InputName;
            }
            return null;
        },
        load(id) {
            if (id === exports.InputName) {
                const code = (0, code_template_1.SDK_TPL_STRING)({
                    extra: typeof extraCodes === 'string' ? extraCodes : extraCodes.join('\n;'),
                    dynamic_module_maps: modules,
                    import_maps: JSON.stringify(import_maps).replace(/^\{/, '').replace(/\}$/, ''),
                });
                return code;
            }
        },
        async generateBundle(_, bundle) {
            const SDKInfo = {
                md5,
                entry: '',
                files: [],
                cdnPath,
            };
            const [entryId] = Object.entries(bundle).find(([_, chunk]) => chunk.isEntry);
            SDKInfo.entry = entryId;
            SDKInfo.files = Object.keys(bundle);
            if (sdk_config.pack) {
                SDKInfo.zipPath = names_1.default.packSDK();
            }
            callback(SDKInfo);
            // 插入构建信息文件
            this.emitFile({
                fileName: names_1.default.sdkInfo,
                type: 'asset',
                source: JSON.stringify(SDKInfo, null, '\t')
            });
            // 插入 system.min.js
            this.emitFile({
                fileName: 'system.min.js',
                type: 'asset',
                source: (0, code_template_1.SYSTEM_JS_CODE)()
            });
        }
    };
}
exports.default = default_1;
