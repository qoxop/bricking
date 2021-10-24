"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loader = void 0;
const path_1 = __importDefault(require("path"));
class Loader {
    constructor(options) {
        this.options = options;
    }
    test(filepath) {
        return this.extensions.includes(path_1.default.extname(filepath));
    }
}
exports.Loader = Loader;
