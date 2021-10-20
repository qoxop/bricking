"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INJECT_IMPORT_MAPS = exports.SDK_TPL_STRING = exports.REAL_TIME_CODE = exports.SYSTEM_JS_CODE = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SYSTEM_JS_CODE = () => fs_1.default.readFileSync(require.resolve('systemjs/dist/system.min.js'), { encoding: 'utf8' });
exports.SYSTEM_JS_CODE = SYSTEM_JS_CODE;
const REAL_TIME_CODE = (jsonUrl, appEntry) => {
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
                System.import("${appEntry}");
            })
        }
    }
}));
`).replace('__json_url__', JSON.stringify(jsonUrl))
        .replace('__json_url_path__', JSON.stringify(path_1.default.dirname(jsonUrl)));
};
exports.REAL_TIME_CODE = REAL_TIME_CODE;
const SDK_TPL_STRING = ({ dynamic_module_maps = '', import_maps = '', extra = '' } = {}) => `

const import_maps = {
    ${import_maps}
};

const dynamic_module_maps = {
    ${dynamic_module_maps}
};

${extra}

const resolve = System.constructor.prototype.resolve;
const instantiate = System.constructor.prototype.instantiate;

/**
 * 将一个模块变量注册成 systemjs 模块
 * @param m
 * @returns
 */
function getVarRegister(m) {
    return [ [], (_export) => ({ setters: [], execute: () => { _export(m) } }) ]
};

/**
 * 自定义 Systemjs 模块路径解析
 */
System.constructor.prototype.resolve = function (id, parentURL) {
    if (import_maps[id]) {
        return resolve.call(this, import_maps[id], parentURL)
    } else if (dynamic_module_maps[id]) {
        return id;
    }
    return resolve.call(this, id, parentURL)
};

/**
 * 自定义模块加载方法
 */
System.constructor.prototype.instantiate = function (url, firstParentUrl) {
    if (dynamic_module_maps && dynamic_module_maps[url]) {
        return new Promise(function (resolve, reject) {
            if (typeof dynamic_module_maps[url] === 'function') { // 异步模块
                dynamic_module_maps[url]().then((m) => resolve(getVarRegister(m))).catch(reject);
            } else { // 同步模块
                resolve(getVarRegister(dynamic_module_maps[url]));
            }
        });
    }
    return instantiate.call(this, url, firstParentUrl)
};

window['$SystemReg'] = {
    obj(maps = {}, force = true) {
        Object.keys(maps).forEach(name => {
            if (force || !dynamic_module_maps[name]) {
                const module = maps[name];
                if (module && (typeof module === 'object')) {
                    if (!('default' in module)) {
                        module.default = { ...module };
                    }
                    dynamic_module_maps[name] = module;
                } else {
                    console.warn('模块必须是一个对象~');
                }
            }
        })
    },
    url(maps = {}, force = true) {
        Object.keys(maps).forEach(name => {
            if (force || !import_maps[name]) {
                import_maps[name] = maps[name]
            }
        })
    }
};
`;
exports.SDK_TPL_STRING = SDK_TPL_STRING;
const INJECT_IMPORT_MAPS = (import_maps) => (`
if (window['$SystemReg'] && typeof window['$SystemReg'].url === 'string') {
    window['$SystemReg'].url(${import_maps});
}
`);
exports.INJECT_IMPORT_MAPS = INJECT_IMPORT_MAPS;
