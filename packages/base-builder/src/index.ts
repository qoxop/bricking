import path from 'path';
import { UserOptions } from './types';

const PkgJson = require(path.resolve(process.cwd(), './package.json'));

const absolutely = (p: string|undefined, def: string) => {
  if (!p) {
    return path.resolve(process.cwd(), def);
  }
  if (path.isAbsolute(p)) {
    return p;
  }
  return path.resolve(process.cwd(), p);
};

function updateOptions(options: UserOptions) {
  options.output = absolutely(options.output, 'dist');
  if (!options.publicPath) {
    options.publicPath = `https://unpkg.com/${PkgJson.name}@${PkgJson.version}/`;
  }
  options.compile = {
    useSourceMap: true,
    imageInlineSizeLimit: 4000,
    alias: {},
    definitions: {},
    defineMapping: {},
    htmlOptions: {
      template: 'index.html',
      inject: 'body',
      scriptLoading: 'blocking',
    },
    loaderModify: {
      appScript: (loader: any) => (loader),
    },
    hooks: {},
    ...(options.compile || {}),
  };
  options.react = {
    useReactRefresh: true,
    useSvgr: true,
    ...(options.react || {}),
  };
  options.devServer = {
    port: '8080',
    hostname: 'localhost',
    ...(options.devServer || {}),
  };
  options.bundle = {
    webpack: '',
    entry: '',
    devEntry: '',
    expose: [],
    exposeAll: true,
    ...(options.bundle || {}),
    exposeExclude: [/^@babel\//, /^@types\//, '@bricking/runtime', 'core-js', 'tslib'].concat(options.bundle?.exposeExclude || [] as any[]),
  };
  return { ...options };
}

export {
  updateOptions,
  UserOptions,
};
