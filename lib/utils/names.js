"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const time_1 = require("./time");
exports.default = {
    packSDK: () => `pack-sdk-${time_1.now}.zip`,
    packMODULES: (name) => `pack-${name}-${time_1.now}.zip`,
    moduleEntry: (name) => `m-${name}-app-[hash].js`,
    moduleChunk: (name) => `m-${name}-[hash].js`,
    sdkEntry: `sdk-entry-[hash].js`,
    sdkChunk: `sdk-[name]-[hash].js`,
    appEntry: `app-entry-[hash].js`,
    appChunk: `app-chunk-[hash].js`,
    moduleInfo: 'modules.json',
    sdkInfo: 'SDK.json'
};
