"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const normalize_path_1 = __importDefault(require("./normalize-path"));
const humanlizePath = filepath => (0, normalize_path_1.default)(path_1.default.relative(process.cwd(), filepath));
exports.default = humanlizePath;
