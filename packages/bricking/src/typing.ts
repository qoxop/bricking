import  { Options as StyleOptions } from  '@bricking/plugin-style';

export type BrickingOptions = {
    /**
     * 模块入口文件配置
     * @type { [name: string]: string; }
     */
    entry: {
        [name: string]: string;
    };
    /**
     * 输出目录
     */
    output?: string;
    /**
     * 调试入口
     */
    debugEntry: string;
    /**
     * 公共基础包
     */
    basePackage: string;
    /**
     * 是否压缩
     */
    minimize?: boolean;
    /**
     * 样式配置
     */
    style: StyleOptions,
    /**
     * 静态资源配置
     */
    assets: {}
}