"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
/**
 * 创建模版
 */
const path_1 = __importDefault(require("path"));
const fs_tools_1 = require("./utils/fs-tools");
const templatesDir = path_1.default.join(__dirname, '../templates');
const DefaultTemplate = {
    name: 'my-app-name',
    path: path_1.default.join(templatesDir, './default'),
    getTransform: (name) => (0, fs_tools_1.bufferString)((_, code) => code.replace('my-app-name', name))
};
const templates = {
    default: DefaultTemplate,
    remote: {
        ...DefaultTemplate,
        path: path_1.default.join(templatesDir, './remote')
    }
};
const create = async (tplName = 'default', name = 'my-app') => {
    const template = templates[tplName];
    if (template) {
        (0, fs_tools_1.fileTransfer)(template.path, path_1.default.join(process.cwd(), `./${name}`), template.getTransform(name));
    }
    else {
        throw new Error(`${tplName} 模版不存在～`);
    }
};
exports.create = create;
