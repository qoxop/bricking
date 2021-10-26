"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAliasEntries = exports.getConfigs = exports.config = void 0;
require("./register");
const path_1 = __importDefault(require("path"));
const cwd = process.cwd();
const configPath = path_1.default.join(cwd, './s.config.ts');
exports.config = require(configPath).default;
const getConfigs = () => exports.config;
exports.getConfigs = getConfigs;
const getAliasEntries = (tsconfig, base) => {
    let tsPaths = {};
    try {
        tsPaths = require(tsconfig).compilerOptions.paths;
    }
    catch (error) {
        console.warn(error);
    }
    const entries = {};
    Object.entries(tsPaths).forEach(([key, value]) => {
        if (!/\*/.test(key) && value[0] && /\.tsx?$/.test(value[0])) {
            entries[key] = path_1.default.join(base, value[0]);
        }
    });
    return entries;
};
exports.getAliasEntries = getAliasEntries;
