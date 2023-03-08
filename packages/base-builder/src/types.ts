import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration as DevServerConfig } from 'webpack-dev-server';
import { Compiler } from 'webpack';

export type Hooks = {
  // eslint-disable-next-line no-unused-vars
  [key in keyof InstanceType<typeof Compiler>['hooks']]: (...args: any[]) => any;
}

export type UserOptions = {
  /**
   * 输出目录
   */
  output?: string;
  /**
   * 发布路径
   */
  publicPath?: string;
  /**
   * 编译配置
   */
  compile?: {
    /**
     * 开启sourceMap
     */
    useSourceMap?: boolean;
    /**
     * 内联图片的最大大小
     */
    imageInlineSizeLimit?: number;
    /**
     * 模块别名配置
     */
    alias?: Record<string, string>;
    /**
     * https://www.webpackjs.com/plugins/provide-plugin/
     * 自动加载模块，而不必在任何地方导入或要求它们。
     */
    definitions?: Record<string, string | string[]>;
    /**
     * https://www.webpackjs.com/plugins/define-plugin/
     * DefinePlugin 配置
     */
    defineMapping?: Record<string, string>;
    /**
     * HtmlWebpackPlugin 配置
     */
    htmlOptions?: HtmlWebpackPlugin.Options;
    /**
     * loader 修改
     */
    loaderModify?: {
      /**
       * App 脚本 loader 修改
       */
      appScript?: <T>(loader: T) => T;
    }
    /**
     * 参考 webpack 插件钩子文档
     * https://webpack.js.org/api/compiler-hooks/#hooks
     */
    hooks?: Partial<Hooks>;
  };
  /**
   * React 相关配置
   */
  react?: {
    /**
     * 模块热重载
     */
    useReactRefresh?: boolean;
    useSvgr?: boolean;
  };
  /**
   * vue 相关配置，TODO
   */
  vue?: any;
  devServer?: DevServerConfig & { hostname?: string };
  bundle?: {
    /**
     * 自定义的 webpack 配置路径，导出内容可以是
     * - Function -> 通过 `(oldConfig) => newConfig` 方式修改 webpack 配置
     * - Object -> 使用 webpackMerge 合并配置
     */
    webpack?: string;
    /** 是否打包构建产物 */
    pack?: boolean;
    /**
     * 自定义入口文件
     */
    entry?: string;
    /**
     * 调试用的入口文件
     */
    devEntry?: string;
    /**
     * 最终导出的包名称
     */
    packageName?: string;
    /**
     * 不注入 Bricking 运行时
     */
    excludeRuntime?: false;
    /**
     * 依赖配置
     */
    dependencies?: {
      /** 将依赖自动注入运行时 */
      autoInject?: true;
      /** 标识哪些依赖是不需要打入运行时的 */
      exclude?: string[];
      /** 标识哪些依赖是被重写过的 */
      rewrites?: string[];
    } | {
      /** 不将依赖自动注入运行时 */
      autoInject?: false;
      /** 告诉打包器，哪些依赖被你手动注入了，用于生成对应的 peerDependencies */
      include?: string[];
    };
    /**
     * 自定义模块配置
     */
    moduleDefines?: {
      /** 是否自动注入自定义的模块，否则需要自行在入口文件处进行导入 */
      autoInject?: boolean;
      /**
       * 类型文件的基础路径, 默认 './src',
       * eg: src/a.ts  ->  [packageName]/a;
       */
      baseDir?: string;
      /**
       * 生成真正包含源码的入口文件, 用于打包成 npm 包
       */
      addSource?: boolean;
      /**
       * 自定义模块的模块名与路径映射
       */
      defines?: {
        // index: string;
        [key: string]: string;
      };
    }
  }
}

export type Options = {
  /**
   * 输出目录
   */
  output: string;
  /**
   * 发布路径
   */
  publicPath: string;
  /**
   * 编译配置
   */
  compile: {
    /**
     * 开启sourceMap
     */
    useSourceMap: boolean;
    /**
     * 内联图片的最大大小
     */
    imageInlineSizeLimit: number;
    /**
     * 模块别名配置
     */
    alias: Record<string, string>;
    /**
     * https://www.webpackjs.com/plugins/provide-plugin/
     * 自动加载模块，而不必在任何地方导入或要求它们。
     */
    definitions: Record<string, string | string[]>;
    /**
     * https://www.webpackjs.com/plugins/define-plugin/
     * DefinePlugin 配置
     */
    defineMapping: Record<string, string>;
    /**
     * HtmlWebpackPlugin 配置
     */
    htmlOptions: HtmlWebpackPlugin.Options;
    /**
     * loader 修改
     */
    loaderModify: {
      /**
       * App 脚本 loader 修改
       */
      appScript: <T>(loader: T) => T;
    }
    /**
     * 参考 webpack 插件钩子文档
     * https://webpack.js.org/api/compiler-hooks/#hooks
     */
    hooks: Partial<Hooks>;
  },
  /**
   * React 相关配置
   */
  react: {
    /**
     * 模块热重载
     */
    useReactRefresh: boolean;
    useSvgr: boolean;
  };
  /**
   * vue 相关配置，TODO
   */
  vue: any;
  devServer: DevServerConfig & { hostname: string };
  bundle: {
    /**
     * 自定义的 webpack 配置路径，导出内容可以是
     * - Function -> 通过 `(oldConfig) => newConfig` 方式修改 webpack 配置
     * - Object -> 使用 webpackMerge 合并配置
     */
    webpack: string;
    /** 是否打包构建产物 */
    pack: boolean;
    /**
     * 自定义入口文件
     */
    entry: string;
    /**
     * 调试用的入口文件
     */
    devEntry: string;
    /**
     * 最终导出的包名称
     */
    packageName: string;
    /**
     * 不注入 Bricking 运行时
     */
    excludeRuntime: false;
    /**
     * 依赖配置
     */
    dependencies: {
      /** 将依赖自动注入运行时 */
      autoInject: true;
      /** 标识哪些依赖是不需要打入运行时的 */
      exclude: string[];
      /** 标识哪些依赖是被重写过的 */
      rewrites: string[];
    } | {
      /** 不将依赖自动注入运行时 */
      autoInject: false;
      /** 告诉打包器，哪些依赖被你手动注入了，用于生成对应的 peerDependencies */
      include: string[];
    };
    /**
     * 自定义模块配置
     */
    moduleDefines: {
      /** 是否自动注入自定义的模块，否则需要自行在入口文件处进行导入 */
      autoInject: boolean;
      /**
       * 类型文件的基础路径, 默认 './src',
       * eg: src/a.ts  ->  [packageName]/a;
       */
      baseDir: string;
      /**
       * 生成真正包含源码的入口文件, 用于打包成 npm 包
       */
      addSource: boolean;
      /**
       * 自定义模块的模块名与路径映射
       */
      defines: {
        // index: string;
        [key: string]: string;
      };
    }
  }
};
