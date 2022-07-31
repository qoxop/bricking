/**
 * 处理 js 模块中的静态资源引用, 使用相对路径引用
 */
import url from '@rollup/plugin-url';

export type UrlOptions = Parameters<typeof url>[0];
export default (options: UrlOptions) => {
  const plg = url(options);
  // @ts-ignore
  const originLoad = plg.load.bind(plg);
  plg.load = async (id) => {
    // @ts-ignore
    const codeStr = await originLoad(id);
    // @ts-ignore
    if (!codeStr || /^export default "data:/.test(codeStr) || options.publicPath) {
      return codeStr;
    }
    // @ts-ignore
    const matched = codeStr.match(/^export default "(.*)"$/);
    if (matched[1]) {
      return `export default new URL("${matched[1]}", import.meta.url).href`;
    }
    return codeStr;
  };
  return plg;
};
