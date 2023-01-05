import { btkType } from '@bricking/toolkit';
import config, { workspace, sourceBase, outputPackPath } from './config';

try {
  btkType.createTypeDefines({
    base: sourceBase,
    record: typeof config.entry === 'string' ? { index: config.entry } : config.entry,
    output: outputPackPath,
    cwd: workspace,
  });
} catch (error) {
  console.error(error);
}
