import { Options } from './types';

let userOptions = require(process.env.BRICKING_RC).default as Options;

export function getUserOptions(force = false): Options {
  if (force) {
    delete require.cache[process.env.BRICKING_RC];
    userOptions = require(process.env.BRICKING_RC).default;
  }
  return userOptions;
}
