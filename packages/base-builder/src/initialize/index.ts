import * as fs from 'fs';
import * as path from 'path';
import { btkCompile } from '@bricking/toolkit';

btkCompile.registerTsHooks(['.ts', '.tsx']);

// 初始化 NODE_ENV
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// 配置文件路径
process.env.BRICKING_RC = path.resolve(process.cwd(), './.brickingrc.ts');

// 加载配置文件
if (fs.existsSync(process.env.BRICKING_RC)) {
  require(process.env.BRICKING_RC);
} else {
  throw new Error('config file ".brickingrc.ts" lose ~');
}
