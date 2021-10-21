import './register';
import path from 'path';
import { Configs } from '../types';


const cwd = process.cwd();
const configPath = path.resolve(cwd, './s.config.ts');

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
        if (!/\*/.test(key) && value[0] && /\.tsx?$/.test(value[0])) {
            entries[key] = path.resolve(base, value[0]);
        }
    });
    return entries;
}