import { Plugin } from 'rollup';
import { REAL_TIME_CODE } from "../code-template";
import { SDKConfig, SDKJson } from '../../types';
export { REAL_TIME_CODE };
export declare type SDKPluginOptions = {
    cdnPath?: string;
    pkg_json?: any;
    import_maps?: Record<any, string>;
    sdk_config?: SDKConfig;
    callback: (info: SDKJson) => void;
};
export declare const InputName: string;
export declare const GetMd5: (options: Omit<SDKPluginOptions, 'callback'>) => string;
export default function (options: SDKPluginOptions): Plugin;
