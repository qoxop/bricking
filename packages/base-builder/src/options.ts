import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Compiler } from 'webpack';
import { Configuration } from 'webpack-dev-server';

type PartialAll<T> = {
  [P in keyof T]?: T[P] extends {} ? Partial<T[P]> : T[P];
};

type Hooks = {
  // eslint-disable-next-line no-unused-vars
  [key in keyof InstanceType<typeof Compiler>['hooks']]: (...args: any[]) => any;
}

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
    htmlOptions: {} as HtmlWebpackPlugin.Options | undefined,
    /**
     * 参考 webpack 插件钩子文档
     * https://webpack.js.org/api/compiler-hooks/#hooks
     */
    hooks: {} as Partial<Hooks>,
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
  } as Configuration & { hostname: string },
  bundle: {
    /**
     * 自定义的 webpack 配置路径，导出内容可以是
     * - Function -> 通过 `(oldConfig) => newConfig` 方式修改 webpack 配置
     * - Object -> 使用 webpackMerge 合并配置
     */
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
      /** 标识哪些依赖是被重写过的 */
      rewrites: [],
    } as ({ autoInject: true, exclude?: string[], rewrites?: string[] } | {autoInject: false, include?: string[]}),
    /** 自定义模块配置 */
    moduleDefines: {
      /** 是否自动注入自定义的模块，否则需要自行在入口文件处进行导入 */
      autoInject: true,
      /** 类型文件的基础路径, 默认 './src' */
      baseDir: './src',
      /** 自定义模块的模块名与路径映射 */
      defines: {} as { index: string, [key: string]: string },
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
