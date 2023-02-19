import { btkType } from '@bricking/toolkit';
import config, { workspace, sourceBase, outputPackPath } from './config';

try {
  if (config.modules) {
    btkType.createTypeDefines({
      base: sourceBase,
      record: typeof config.modules === 'string' ? { index: config.modules } : config.modules,
      output: outputPackPath,
      cwd: workspace,
    });
  }
} catch (error) {
  console.error(error);
}
