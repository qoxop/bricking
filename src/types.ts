import { Options as ProxyOptions } from 'http-proxy-middleware'

export type SDKConfig = {
    type: 'local',
    pack?: boolean;
    version?: string;
    location?: string;
    externals?: string[];
    extraCodes?: string|string[];
} | {
    type: 'remote-js',
    remote: string;
    externals: string[];
    systemjs?: string;
} | {
    type: 'remote-json',
    remote: string;
    externals: string[];
    build_in?: boolean;
    systemjs?: string;
}

export type DEVConfig = {
    port: number;
    host?: string;
    proxyPath?: string;
    proxyOption?: ProxyOptions
}
export type ASSETSConfig = {
    relative: string;
    cssModules: boolean;
    autoCssModules: boolean;
    injectType?: 'link'|'style';
}
export type PRODConfig = {
    cdn: string;
    version: string;
    pack: boolean | string;
}
export type SDKJson = {
    md5: string;
    files: string[];
    entry: string;
    systemjs: string|'build-in';
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
    sdk?: SDKConfig;
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
    prod: PRODConfig,
    assets: ASSETSConfig,
    sdk: Required<SDKConfig>;
    dev: DEVConfig;
    [key: string]: any
}