import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Options, UserOptions } from './types';

const deepMerge = (origin, target, deep = 1) => {
  if (origin) {
    Object.keys(target).forEach((key) => {
      if (deep < 2 || !origin[key] || typeof origin[key] !== 'object') {
        origin[key] = target[key];
      } else if (typeof origin[key] === 'object') {
        deepMerge(origin[key], target[key], deep - 1);
      }
    });
  }
};

const defaultOption = (): Options => ({
  output: 'dist',
  publicPath: '/',
  compile: {
    useSourceMap: false as boolean,
    imageInlineSizeLimit: 8000,
    alias: {} as Record<string, string>,
    definitions: {} as Record<string, string | string[]>,
    defineMapping: {} as Record<string, string>,
    htmlOptions: {} as HtmlWebpackPlugin.Options,
    loaderModify: {
      appScript: (loader: any) => (loader),
    },
    hooks: {} as any,
  },
  react: {
    useReactRefresh: true,
    useSvgr: true,
  },
  vue: {},
  devServer: {
    port: '8080',
    hostname: 'localhost',
  },
  bundle: {
    webpack: '',
    pack: false,
    entry: '',
    devEntry: '',
    packageName: '',
    excludeRuntime: false,
    dependencies: {
      autoInject: true,
      exclude: [],
      rewrites: [],
    },
    moduleDefines: {
      autoInject: true,
      baseDir: './src',
      addSource: false,
      defines: {},
    },
  },
});

const { getUserOptions, updateOptions } = (() => {
  let userOptions = defaultOption();
  return {
    getUserOptions: () => userOptions,
    updateOptions: (options: UserOptions) => {
      const origin = defaultOption();
      deepMerge(origin, options, 4);
      userOptions = origin;
      return userOptions;
    },
  };
})();

export {
  getUserOptions,
  updateOptions,
};
