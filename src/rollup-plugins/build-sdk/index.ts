import MD5 from 'md5';
import * as path from 'path';
import { OutputChunk, Plugin } from 'rollup';
import { SDK_TPL_STRING, SYSTEM_JS_CODE, REAL_TIME_CODE } from "../code-template";
import { SDKConfig, SDKJson } from '../../types';
import NAMES from '../../utils/names';

export {
    REAL_TIME_CODE
}

export type SDKPluginOptions = {
    cdnPath?: string;
    pkg_json?: any;
    import_maps?: Record<any, string>;
    sdk_config?: SDKConfig;
    callback: (info: SDKJson) => void;
}

export const InputName = path.resolve(process.cwd(), `./rumtime-systemjs-sdk.js`);

export const GetMd5 = (options:Omit<SDKPluginOptions, 'callback'>) => { 
    const { pkg_json = {}, import_maps ={}, sdk_config} = options;
    const {extraCodes = '', version = ''} = sdk_config || {};
    return MD5(
        JSON.stringify(pkg_json) +
        JSON.stringify(import_maps) +
        (typeof extraCodes === 'string' ?  extraCodes : extraCodes.join('\n;') )+
        version
    );
}

export default function(options: SDKPluginOptions):Plugin {
    const { cdnPath = '/', pkg_json = {}, import_maps ={}, sdk_config, callback } = options;
    const { extraCodes = '' } = sdk_config || {};
    const { peerDependencies = {} } = pkg_json;
    const md5 = GetMd5(options);
    const modules = Object.keys(peerDependencies).map(name => (`'${name}': () => import('${name}'),\n`)).join('\t');
    return {
        name: 'sdk-builder',
        resolveId(source: string) {
            if (InputName === source) {
                return InputName;
            }
            return null;
        },
        load(id: string) {
            if (id === InputName) {
                const code = SDK_TPL_STRING({
                    extra: typeof extraCodes === 'string' ?  extraCodes : extraCodes.join('\n;'),
                    dynamic_module_maps: modules,
                    import_maps: JSON.stringify(import_maps).replace(/^\{/, '').replace(/\}$/, ''),
                });
                return code;
            }
        },
        async generateBundle(_, bundle) {
            const SDKInfo: SDKJson = {
                md5,
                entry: '',
                files: [],
                cdnPath,
            }
            const [ entryId ] = Object.entries(bundle).find(([_, chunk]) => (chunk as OutputChunk).isEntry) as [string, OutputChunk];
            SDKInfo.entry = entryId;
            SDKInfo.files = Object.keys(bundle);
            if (sdk_config.pack) {
                SDKInfo.zipPath =  NAMES.packSDK()
            }
            callback(SDKInfo);
            // 插入构建信息文件
            this.emitFile({ 
                fileName: NAMES.sdkInfo,
                type: 'asset',
                source: JSON.stringify(SDKInfo, null, '\t')
            });
            // 插入 system.min.js
            this.emitFile({ 
                fileName: 'system.min.js',
                type: 'asset',
                source: SYSTEM_JS_CODE()
            })
        }
    }
}
