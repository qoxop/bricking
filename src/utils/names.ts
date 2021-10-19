import { now } from "./time";

export default {
    packSDK: () => `pack-sdk-${now}.zip`,
    packMODULES: (name) => `pack-${name}-${now}.zip`,
    moduleEntry: (name: string) => `m-${name}-app-[hash].js`,
    moduleChunk: (name: string) => `m-${name}-[hash].js`,
    sdkEntry: `sdk-entry-[hash].js`,
    sdkChunk: `sdk-[name]-[hash].js`,
    appEntry: `app-entry-[hash].js`,
    appChunk: `app-chunk-[hash].js`,
    moduleInfo: 'modules.json',
    sdkInfo: 'SDK.json'
}