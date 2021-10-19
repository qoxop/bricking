import { Options as ProxyOptions } from 'http-proxy-middleware'

export type SDKConfig = {
    type: 'local'|'remote';
    location: string;
    extraCodes: string|string[];
    realTime: boolean;
    pack: boolean;
    version?: string
}
export type DEVConfig = {
    port: number;
    proxyPath?: string;
    proxyOption?: ProxyOptions
}
export type ASSETSConfig = {
    relative: string;
    cssModules: boolean;
    autoCssModules: boolean;
}
export type PRODConfig = {
    cdn: string;
    version: string;
    pack: boolean;
}
export type SDKJson = {
    md5: string;
    files: string[];
    entry: string;
    cdnPath?: string;
    zipPath?: string;
}
export type MODULESJson = {
    version: string;
    updateTime: number;
    cdnPath: string;
    zipPath?: string;
    modules: {
        [k: string]: string;
    }
}

export type UserOptions = {
    entry: string | {[name: string]: string};
    output?: string;
    bootstrap?:string;
    minimize?: boolean;
    externals?: string[];
    prod?: Partial<PRODConfig>;
    assets?: Partial<ASSETSConfig>;
    sdk?: Partial<SDKConfig>;
    dev?: Partial<DEVConfig>;
}

export type Configs = {
    name: string;
    base: string;
    entry: {[name: string]: string};
    output: string;
    bootstrap:string;
    minimize: boolean;
    tsconfig: string;
    packageJson: any;
    externals: string[];
    prod: PRODConfig,
    assets: ASSETSConfig,
    sdk: SDKConfig;
    dev: DEVConfig;
    [key: string]: any
}