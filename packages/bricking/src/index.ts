import * as path from 'path';
import { packageJsonPath, workspace } from './config';
import { BrickingOptions } from './typing';

const absolutely = (p: string|undefined, def: string) => {
  if (!p) {
    return path.resolve(process.cwd(), def);
  }
  if (path.isAbsolute(p)) {
    return p;
  }
  return path.resolve(process.cwd(), p);
};

export function defineBricking(options: BrickingOptions): Required<BrickingOptions> {
  options.output = absolutely(options.output, 'dist');
  options.minimize = options.minimize ?? (process.env.NODE_ENV !== 'development');
  options.style = {
    filename: 'bundle-[hash].css',
    sourceMap: true,
    ...options.style,
    postcss: {
      minify: options.style?.postcss?.minify ?? true,
      module: options.style?.postcss?.module ?? 'auto',
      moduleOptions: options.style?.postcss?.moduleOptions ?? {},
      plugins: [
        ...(options.style?.postcss?.plugins || []),
      ],
    },
  };
  if (!options.html) {
    options.html = {
      path: path.resolve(workspace, './index.html'),
    };
  }
  if (!options.mode) {
    options.mode = 'app';
  }
  if (!options.externals) {
    options.externals = [];
  }
  // 支持 --no-base 参数进行全量编译
  if (!options.basePackage || process.argv.some((item) => /--no-base/.test(item))) {
    options.basePackage = 'use-local-runtime';
  }
  if (options.doPack === true) {
    try {
      const { name } = require(packageJsonPath);
      options.doPack = name || 'bricking';
    } catch (error) {
      options.doPack = 'bricking';
    }
  }
  options.assets = {
    limit: 1024 * 8,
    filename: '[hash][extname]',
    loadPaths: options.assets?.loadPaths ?? [],
    ...options.assets,
  };
  options.devServe = {
    port: 3000,
    host: 'localhost',
    open: '/',
    ...options.devServe,
  };
  options.plugins = options.plugins ?? [];
  if (!options.bootstrap && (process.env.NODE_ENV === 'development')) {
    throw new Error('options.bootstrap is require~');
  }
  return options as any;
}
