/**
 * 处理 js 模块中的静态资源引用
 */
import url from '@rollup/plugin-url';
export default function (options: Parameters<typeof url>[0]): import("rollup").Plugin;
