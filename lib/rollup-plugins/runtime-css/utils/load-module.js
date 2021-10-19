"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModule = void 0;
const import_cwd_1 = __importDefault(require("import-cwd"));
function loadModule(moduleId) {
    // Trying to load module normally (relative to plugin directory)
    try {
        return require(moduleId);
    }
    catch {
        // Ignore error
    }
    // Then, trying to load it relative to CWD
    return import_cwd_1.default.silent(moduleId);
}
exports.loadModule = loadModule;
