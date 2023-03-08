import HtmlWebpackPlugin from "html-webpack-plugin";

type BaseOptions = {
  /**
   * 输出目录
   * - 默认: 'dist;
   */
  output?: string;
  /**
   * 发布路径
   * - 默认: '/'
   */
  publicPath?: string,
  /**
   * 编译信息
   */
  compile?: {
    /**
     * 是否开启 SourceMap
     */
    useSourceMap?: boolean;
    /**
     * 图标最小尺寸，小于该尺寸会转化为 base64
     */
    imageInlineSizeLimit?: boolean;
    /**
     * 别名配置
     */
    alias?: Record<string, string>;
    /**
     * ProvidePlugin
     * https://webpack.js.org/plugins/provide-plugin/
     */
    definitions?: Record<string, string|string[]>;
    /**
     * DefinePlugin
     * 模版字符串替换
     */
    defineMapping?: Record<string, string>;
    htmlOptions: HtmlWebpackPlugin.Options;
    loaderModify: {
      appScript: <T>(loader: T) => T;
    }
  }
};
