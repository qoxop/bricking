import { Plugin } from 'rollup';
import { RollupStylePluginOptions as StyleOptions } from '@bricking/plugin-style';
import { DevServe } from './server';

export type BrickingAsset = {
  modules: {
    [name: string]: string
  },
  version: string;
  publicPath: string;
  updateTime: string;
}

export type BrickingOptions = {
  /**
   * 模块入口文件配置
   */
  entry?: {
    [name: string]: string;
  };
  /**
   * 输出目录
   */
  output?: string;
  /**
   * 浏览器入口
   */
  browseEntry: string;
  html?: {
    path: string;
    importMaps?: Record<string, string>;
    replacement?: Record<string, string>;
  },
  /**
   * 公共基座包
   */
  basePackage: {
    name: string;
    version: string;
  } | string;
  /**
   * 是否压缩
   */
  minimize?: boolean;
  /**
   * 是否进行打包, 如果需要自定义压缩包名称，传入字符串
   */
  doPack?: string|true;
  /**
   * 样式配置
   */
  style?: StyleOptions,
  /**
   * 静态资源配置
   */
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
  devServe?: Partial<DevServe> ;
  publicPath?: string;
  replacement?: Record<string, string>;
  plugins?: (false | Plugin)[];
}

export type BrickingJson = {
  entry: Record<string, `${'http'|'https'}://${string}.js`>;
  document?: `${'http'|'https'}://${string}.md`;
  dependence: {
    document?: `${'http'|'https'}://${string}.md`;
    requires: string[];
  };
  name: string;
  version: `${number}.${number}.${number}`;
  updateTime: number;
  publicPath: string;
}
