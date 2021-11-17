import './register';
import path from 'path';
import { Configs } from '../types';


const cwd = process.cwd();
const configPath = path.join(cwd, './s.config.ts');

export const config:Configs = require(configPath).default as Configs;

export const getConfigs = () => config;

export const getAliasEntries = (tsconfig: string, base: string) => {
    let tsPaths = {} as any;
    try {
        tsPaths = require(tsconfig).compilerOptions.paths;
    } catch (error) {
        console.warn(error);
    }
    const entries = {};
    Object.entries(tsPaths).forEach(([key, value]) => {
        let relativePath = value[0];
        if (/\/\*$/.test(key)) {
            key = key.replace(/\/\*$/, '');
        }
        if (/\/\*$/.test(relativePath)) {
            relativePath = relativePath.replace(/\/\*$/, '');
        }
        if (!entries[key]) {
            entries[key] = path.join(base, relativePath);
        }
    });
    return entries;
}