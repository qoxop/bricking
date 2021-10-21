/**
 * 拷贝SDK文件到输出目录
 * @returns
 */
export declare const copySdk: () => Promise<void>;
/**
 * 检测SDK是否需要重新构建
 */
export declare const sdkHasChange: () => boolean;
export declare type SDKInfo = {
    sdkEntry: string;
    systemjs: string;
    isRemote: boolean;
    realTime?: boolean;
};
/**
 * 构建SDK
 */
export declare function buildSdk(force?: boolean): Promise<SDKInfo>;
