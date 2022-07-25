import { Plugin } from 'rollup';
// @ts-ignore
import  { Options as StyleOptions } from  '@bricking/plugin-style';
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
    basePackage: {
        name: string;
        version: string;
    } | string;
    /**
     * 是否压缩
     */
    minimize?: boolean;
    /**
     * 样式配置
     */
    style?: StyleOptions,
    /**
     * 静态资源配置
     */
    assets?: {
        /**
         * 静态资源输出目录(相对路径)
         */
        output?: string;
        /**
         * 包含哪些文件类型
         */
        include?: string | RegExp | readonly (string | RegExp)[];
        /**
         * 忽略那些文件类型
         */
        exclude?: string | RegExp | readonly (string | RegExp)[];
        /**
         * 文件大小小于 limit 值时，转化为 base64
         */
        limit?: number;
        /**
         * 文件命名规则
         * - `[hash]` - 文件 hash
         * - `[name]` - 文件名
         * - `[ext]` - 扩展名
         * @default '[hash].[ext]'
         */
        filename?: string;
        loadPaths?: string[];
    },
    devServe?: Partial<DevServe>;
    publicPath?: string;
    plugins?: (false | Plugin)[];
}