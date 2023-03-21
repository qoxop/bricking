import HtmlWebpackPlugin from 'html-webpack-plugin';
import { Configuration as DevServerConfig } from 'webpack-dev-server';
import { Compiler } from 'webpack';

export type Hooks = {
  // eslint-disable-next-line no-unused-vars
  [key in keyof InstanceType<typeof Compiler>['hooks']]: (...args: any[]) => any;
}
export type ModuleInfo = {
  /**
   * 模块名称
   */
  name: string;
  /**
   * 模块路径
   */
  path?: string;
  /**
   * 是否同步注入，默认否
   */
  sync?: boolean;
  subPath?: boolean;
};
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
     * 共享模块导出定义
     */
    expose: (string|ModuleInfo)[];
    /**
     * 是否共享 package.json 中定义的所有依赖
     */
    exposeAll?: boolean;
    /**
     * 定义哪些依赖排除在外
     */
    exposeExclude?: (string|RegExp)[];
  }
}

export type Options = {
  output: string;
  publicPath: string;
  compile: {
    useSourceMap: boolean;
    imageInlineSizeLimit: number;
    alias: Record<string, string>;
    definitions: Record<string, string | string[]>;
    defineMapping: Record<string, string>;
    htmlOptions: HtmlWebpackPlugin.Options;
    loaderModify: {
      appScript: <T>(loader: T) => T;
    }
    hooks: Partial<Hooks>;
  },
  react: {
    useReactRefresh: boolean;
    useSvgr: boolean;
  };
  vue: any;
  devServer: DevServerConfig & { hostname: string };
  bundle: {
    webpack: string;
    entry: string;
    devEntry: string;
    expose: (string|ModuleInfo)[];
    exposeAll: boolean;
    exposeExclude: (string|RegExp)[];
  }
};
