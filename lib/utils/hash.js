"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeId = exports.getHash = void 0;
const crypto_1 = require("crypto");
const pluginutils_1 = require("@rollup/pluginutils");
const getHash = (data, ...other) => (0, crypto_1.createHash)("sha256").update([data, 'yt7RWop1a', ...other].join(":")).digest("hex").slice(0, 8);
exports.getHash = getHash;
const getSafeId = (data, id) => (0, pluginutils_1.makeLegalIdentifier)(`${id}_${(0, exports.getHash)(data, id)}`);
exports.getSafeId = getSafeId;
