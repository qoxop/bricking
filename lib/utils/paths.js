"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanlizePath = exports.normalizePath = void 0;
const path_1 = __importDefault(require("path"));
const normalizePath = (filepath) => filepath && filepath.replace(/\\+/g, '/');
exports.normalizePath = normalizePath;
const humanlizePath = (filepath) => (0, exports.normalizePath)(path_1.default.relative(process.cwd(), filepath));
exports.humanlizePath = humanlizePath;
