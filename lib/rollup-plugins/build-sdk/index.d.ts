import { Plugin } from 'rollup';
import { SDKConfig, SDKJson } from '../../types';
export declare type SDKPluginOptions = {
    cdnPath?: string;
    pkg_json?: any;
    import_maps?: Record<any, string>;
    sdk_config?: SDKConfig;
    callback: (info: SDKJson) => void;
};
export declare const REAL_TIME_SDK: (jsonUrl: string, appEntry: string) => string;
export declare const InputName: string;
export declare const hasRealFile: boolean;
export declare const GetMd5: (options: Omit<SDKPluginOptions, 'callback'>) => string;
export default function (options: SDKPluginOptions): Plugin;
