/**
 * 处理 js 模块中的静态资源引用
 */
import url from '@rollup/plugin-url';

export default function(options: Parameters<typeof url>[0]) {
    const plg = url(options);
    const originLoad = plg.load.bind(plg);
    plg.load = async function(id) {
        const codeStr = await originLoad(id);
        if (!codeStr || /^export default \"data:/.test(codeStr)) {
            return codeStr
        }
        const matched = codeStr.match(/^export default \"(.*)\"$/);
        if (matched[1]) {
            return `export default new URL("${matched[1]}", import.meta.url).href`;
        }
        return codeStr
    }
    return plg;
}