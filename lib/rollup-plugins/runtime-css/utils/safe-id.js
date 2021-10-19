"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeId = void 0;
const crypto_1 = require("crypto");
const pluginutils_1 = require("@rollup/pluginutils");
const getSafeId = (data, id) => {
    const hash = (0, crypto_1.createHash)("sha256").update([data, 'yt7RWop1a', id,].join(":")).digest("hex").slice(0, 8);
    return (0, pluginutils_1.makeLegalIdentifier)(`${id}_${hash}`);
};
exports.getSafeId = getSafeId;
