/**
 * Css Loader 通用参数
 */
export type CssLoaderProps<T, O = {}> = {
  content: string;
  filepath: string;
  /** 是否开启 sourceMap */
  sourceMap?: boolean;
  /** 上下文对象 */
  context: {
    /** 依赖文件 */
    dependencies: Set<string>;
    /** 模块映射 */
    modules?: Record<string, string>
  };
  /** 对应 loader 的参数 */
  options: T;
} & O
