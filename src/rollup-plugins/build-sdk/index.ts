import fs from 'fs';
import MD5 from 'md5';
import path from 'path';
import { OutputChunk, Plugin } from 'rollup';
import NAMES from '../../utils/names';
import { compile } from '../../utils/compile';
import { SDKConfig, SDKJson } from '../../types';

export type SDKPluginOptions = {
    cdnPath?: string;
    pkg_json?: any;
    import_maps?: Record<any, string>;
    sdk_config?: SDKConfig;
    callback: (info: SDKJson) => void;
}

export const REAL_TIME_SDK = (jsonUrl: string, appEntry:string) => {
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
    .replace('__json_url_path__', JSON.stringify(path.dirname(jsonUrl)))
    .replace('__app_entry__', JSON.stringify(appEntry))
}

export const InputName = path.resolve(process.cwd(), `./rumtime-systemjs-sdk.js`);
export const hasRealFile = fs.existsSync(InputName);

export const GetMd5 = (options:Omit<SDKPluginOptions, 'callback'>) => { 
    const { pkg_json = {}, import_maps ={}, sdk_config} = options;
    const {extraCodes = '', version = ''} = (sdk_config || {}) as any;
    return MD5(
        JSON.stringify(pkg_json) +
        JSON.stringify(import_maps) +
        (typeof extraCodes === 'string' ?  extraCodes : extraCodes.join('\n;') )+
        version
    );
}

export default function(options: SDKPluginOptions):Plugin {
    const { cdnPath = '/', pkg_json = {}, import_maps = {}, sdk_config, callback } = options;
    const { extraCodes = '' } = (sdk_config || {}) as any;
    const { peerDependencies = {} } = pkg_json;
    const md5 = GetMd5(options);
    const modules = Object.keys(peerDependencies).map(name => (`"${name}": () => import("${name}"),\n`)).join('\t');
    return {
        name: 'sdk-builder',
        resolveId(source: string) {
            if (InputName === source) {
                return InputName;
            }
            return null;
        },
        load(id: string) {
            if (id === InputName && !hasRealFile) {
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
            const systemjs_code = fs.readFileSync(require.resolve('systemjs/dist/system.min.js'), {encoding: 'utf8'});
            const plugin_code = await compile(fs.readFileSync(require.resolve('./snippets/systemjs-plugin'), { encoding: 'utf8' }));
            const [ entryId, entryChunk] = Object.entries(bundle).find(([_, chunk]) => (chunk as OutputChunk).isEntry) as [string, OutputChunk];

            // Add plugin_code
            entryChunk.code = plugin_code + '\n' + entryChunk.code;

            const SDKInfo: SDKJson = { 
                md5, cdnPath, entry: entryId,
                files: Object.keys(bundle),
                systemjs: 'system.min.js',
                zipPath: ('pack' in sdk_config) && sdk_config.pack ?  NAMES.packSDK() : undefined,
            }
            // 插入构建信息文件 \ 插入 system.min.js
            this.emitFile({ fileName: NAMES.sdkInfo, type: 'asset', source: JSON.stringify(SDKInfo, null, '\t') });
            this.emitFile({ fileName: 'system.min.js', type: 'asset', source: systemjs_code });
            callback(SDKInfo);
        }
    }
}
