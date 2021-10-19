"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.now = exports.date = void 0;
exports.date = new Date();
exports.now = `${exports.date.getFullYear()}-${exports.date.getMonth() + 1}-${exports.date.getDate()}T${exports.date.getHours()}_${exports.date.getMinutes()}_${exports.date.getSeconds()}`;
