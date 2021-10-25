"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMd5 = exports.hasRealFile = exports.InputName = exports.REAL_TIME_SDK = void 0;
const fs_1 = __importDefault(require("fs"));
const md5_1 = __importDefault(require("md5"));
const path_1 = __importDefault(require("path"));
const names_1 = __importDefault(require("../../utils/names"));
const compile_1 = require("../../utils/compile");
const REAL_TIME_SDK = (jsonUrl, appEntry) => {
    return (`
System.register([__json_url__], (function (e) {
    "use strict";
    var m;
    return {
        setters: [function (e) {
            m = e.default;
        }],
        execute: function () {
            if (!m.entry) {
                throw new Error("模块入口不存在");
            }
            var cdn = __json_url_path__;
            if (/^https?/.test(m.cdnPath || '')) {
                cdn = m.cdnPath;
            }
            var sdkEntry = cdn.replace(/\\\/$/, '') + '/' + m.entry.replace(/^\\.?\\//, '');
            System.import(sdkEntry).then(function () {
                System.import(__app_entry__);
            })
        }
    }
}));
`).replace('__json_url__', JSON.stringify(jsonUrl))
        .replace('__json_url_path__', JSON.stringify(path_1.default.dirname(jsonUrl)))
        .replace('__app_entry__', JSON.stringify(appEntry));
};
exports.REAL_TIME_SDK = REAL_TIME_SDK;
exports.InputName = path_1.default.resolve(process.cwd(), `./rumtime-systemjs-sdk.js`);
exports.hasRealFile = fs_1.default.existsSync(exports.InputName);
const GetMd5 = (options) => {
    const { pkg_json = {}, import_maps = {}, sdk_config } = options;
    const { extraCodes = '', version = '' } = (sdk_config || {});
    return (0, md5_1.default)(JSON.stringify(pkg_json) +
        JSON.stringify(import_maps) +
        (typeof extraCodes === 'string' ? extraCodes : extraCodes.join('\n;')) +
        version);
};
exports.GetMd5 = GetMd5;
function default_1(options) {
    const { cdnPath = '/', pkg_json = {}, import_maps = {}, sdk_config, callback } = options;
    const { extraCodes = '' } = (sdk_config || {});
    const { peerDependencies = {} } = pkg_json;
    const md5 = (0, exports.GetMd5)(options);
    const modules = Object.keys(peerDependencies).map(name => (`"${name}": () => import("${name}"),\n`)).join('\t');
    return {
        name: 'sdk-builder',
        resolveId(source) {
            if (exports.InputName === source) {
                return exports.InputName;
            }
            return null;
        },
        load(id) {
            if (id === exports.InputName && !exports.hasRealFile) {
                let code = `${typeof extraCodes === 'string' ? extraCodes : extraCodes.join('\n;')}\n`;
                code += `window['$SystemReg'].obj({ ${modules} });\n`;
                if (Object.keys(import_maps).length) {
                    code += `window['$SystemReg'].url(${JSON.stringify(import_maps)});\n`;
                }
                return code;
            }
            return null;
        },
        async generateBundle(_, bundle) {
            const systemjs_code = fs_1.default.readFileSync(require.resolve('systemjs/dist/system.min.js'), { encoding: 'utf8' });
            const plugin_code = await (0, compile_1.compile)(fs_1.default.readFileSync(require.resolve('./snippets/systemjs-plugin'), { encoding: 'utf8' }));
            const [entryId, entryChunk] = Object.entries(bundle).find(([_, chunk]) => chunk.isEntry);
            // Add plugin_code
            entryChunk.code = plugin_code + '\n' + entryChunk.code;
            const SDKInfo = {
                md5, cdnPath, entry: entryId,
                files: Object.keys(bundle),
                systemjs: 'system.min.js',
                zipPath: ('pack' in sdk_config) && sdk_config.pack ? names_1.default.packSDK() : undefined,
            };
            // 插入构建信息文件 \ 插入 system.min.js
            this.emitFile({ fileName: names_1.default.sdkInfo, type: 'asset', source: JSON.stringify(SDKInfo, null, '\t') });
            this.emitFile({ fileName: 'system.min.js', type: 'asset', source: systemjs_code });
            callback(SDKInfo);
        }
    };
}
exports.default = default_1;
