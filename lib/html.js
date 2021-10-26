"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dom = exports.newDom = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsdom_1 = require("jsdom");
const config_1 = require("./utils/config");
const { base } = (0, config_1.getConfigs)();
const newDom = () => new jsdom_1.JSDOM(fs_1.default.readFileSync(path_1.default.join(base, 'index.html'), 'utf8'));
exports.newDom = newDom;
exports.dom = new jsdom_1.JSDOM(fs_1.default.readFileSync(path_1.default.join(base, 'index.html'), 'utf8'));
