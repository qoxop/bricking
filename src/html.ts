import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { getConfigs } from './utils/config';

const { base } = getConfigs();

export const newDom = () => new JSDOM(fs.readFileSync(path.resolve(base, 'index.html'), 'utf8'));

export const dom:JSDOM = new JSDOM(fs.readFileSync(path.resolve(base, 'index.html'), 'utf8'));

