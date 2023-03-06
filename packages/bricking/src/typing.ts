import { Plugin } from 'rollup';
import { RollupStylePluginOptions as StyleOptions } from '@bricking/plugin-style';
import { ServeConfig } from '@bricking/plugin-server';

export type BrickingOptions = {
  /** 打包模式 */
  mode?: 'app'|'lib'|'app|lib';
  /** 浏览器入口 */
  bootstrap: string;
  /** 模块入口文件配置 */
  modules?: Record<string, string>;
  /** 源码基础路径, 默认'./src' */
  sourceBase?: string;
  /** 输出目录 */
  output?: string;
  /** 第三方依赖库 */
  externals?: (string | RegExp)[];
  /** 入口 html 配置 */
  html?: {
    path: string;
    scripts?: {
      url: string;
      type?: string;
      props?: Record<string, string>;
    }[];
    importMaps?: Record<string, string>;
    replacement?: Record<string, string>;
  },
  /**
   * 共享的基础依赖包(内置模块映射)
   */
  basePackage?: ({ name: string; version: string; }) | 'use-local-runtime' | 'use-cdn-runtime' | string;
  /** 是否压缩 */
  minimize?: boolean;
  /** 是否进行打包, 如果需要自定义压缩包名称, 可传入字符串用于指定包名 */
  doPack?: string|true;
  /** 样式配置 */
  style?: StyleOptions,
  /**  静态资源配置 */
  assets?: {
    /**
     * 包含哪些文件类型
     */
    include?: string | RegExp | readonly(string | RegExp)[];
    /**
     * 忽略那些文件类型
     */
    exclude?: string | RegExp | readonly(string | RegExp)[];
    /**
     * 文件大小小于 limit 值时，转化为 base64
     */
    limit?: number;
    /**
     * 文件命名规则，eg: `'base-dir/[name]-[hash][extname]'`
     * - `[hash]` - 文件 hash
     * - `[name]` - 文件名
     * - `[extname]` - 扩展名
     * @default '[hash][extname]'
     */
    filename?: string;
    loadPaths?: string[];
  },
  /** rollup 插件 */
  plugins?: (false | Plugin)[];
  /** 开发服务器配置 */
  devServe?: Partial<ServeConfig>;
  /** 线上资源根路径 */
  publicPath?: string;
  /** 字符串模版替换映射 */
  replacement?: Record<string, string>;
  /**
   * @babel/preset-env 的配置信息，可选
   * https://babeljs.io/docs/babel-preset-env#options
   */
  babelOption?: any;
}

export type BrickingJson = {
  entry: Record<string, `${'http'|'https'}://${string}.js`>;
  bundle?: string;
  document?: `${'http'|'https'}://${string}.md`;
  dependence: {
    document?: `${'http'|'https'}://${string}.md`;
    requires: string[];
  };
  externals?: string[];
  peerDependencies?: Record<string, string>,
  name: string;
  version: `${number}.${number}.${number}`;
  updateTime: number;
  publicPath: string;
}
