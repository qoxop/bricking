import path from 'path';
import type { Plugin } from 'rollup';
import * as logs from '../utils/log';

export default function log(options: { workspace?: string }): Plugin {
  const { workspace = process.cwd() } = options;
  let count = 0;
  let restart = -1;
  return {
    name: 'bricking-log',
    transform(_, id) {
      count += 1;
      const spin = ['⌜', '⌝', '⌟', '⌞'][count % 4];
      logs.tempLog(`${spin} process: ${path.relative(workspace, id)}  x${count}`);
      return null;
    },
    buildEnd(error) {
      if (error) {
        console.error(error);
      } else {
        restart += 1;
        if (restart > 0) {
          logs.tempLog(`[🔥Restart]: x${restart}`);
        }
      }
    },
  };
}
