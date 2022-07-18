import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration } from 'webpack-dev-server';

type PartialAll<T> = {
    [P in keyof T]?: T[P] extends {} ? Partial<T[P]> : T[P];
};

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

const defaultOption = () => ({
  output: 'dist',
  publicPath: '/',
  compile: {
    useSourceMap: false as boolean,
    imageInlineSizeLimit: 8000,
    alias: {} as Record<string, string>,
    definitions: {} as Record<string, string | string[]>,
    defineMapping: {} as Record<string, string>,
    htmlOptions: {} as HtmlWebpackPlugin.Options | undefined
  },
  react: {
    useReactRefresh: true,
    useSvgr: true,
  },
  vue: { // TODO 支持 vue.js

  },
  devServer: {
    port: '8080',
    hostname: 'localhost',
    protocol: 'http' as ('http'|'https'),
    proxy: {} as Configuration['proxy'],
  },
  bundle: {
    /** 自定义的 webpack 配置路径 */
    webpack: '',
    /** 是否打包构建产物 */
    pack: false,
    entry: '' as (string | undefined),
    devEntry: '' as (string | undefined),
    packageName: '',
    /** 不注入运行时代码 */
    excludeRuntime: false,
    /** 依赖配置 */
    dependencies: {
      /** 是否将依赖自动注入运行时 */
      autoInject: true,
      /** 标识哪些依赖是不需要打入运行时的 */
      exclude: [],
    } as ({ autoInject: true, exclude?: string[] } | {autoInject: false, include?: string[]}),
    /** 自定义模块配置 */
    moduleDefines: {
      /** 是否自动注入自定义的模块，否则需要自行在入口文件处进行导入 */
      autoInject: true,
      /** 自定义模块的模块名与路径映射 */
      defines: {} as Record<string, string>,
      output: './types',
    },
  },
});

const { getUserOptions, updateOptions } = (() => {
  let userOptions = defaultOption();
  return {
    getUserOptions: () => userOptions,
    updateOptions: (options: PartialAll<typeof userOptions>) => {
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

export type TUserOptions = ReturnType<typeof getUserOptions>;
