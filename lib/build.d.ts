import { SDKInfo } from './sdk';
export declare const buildHtml: (options: {
    sdkInfo: SDKInfo;
    appEntry: string;
    output: string;
    cdn: string;
}) => void;
export declare const build: (app?: boolean) => Promise<void>;
