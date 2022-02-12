const urlPattern = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;
const hashes = {};

// 合并插入
let cssStringArr:string[] = [];
let promise:Promise<any>|null = null;

const reset = () => {
    promise = null;
    cssStringArr = [];
}
// TODO 滤镜路径替换
// const alphaPattern = /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g

/**
 * 运行时插入 css 代码
 * @param cssString - Css 代码字符串
 * @param options.relative - 资源文件与 js 文件的相对路径
 * @param options.relative - 样式代码 hash 值
 * @returns 
 */
export default function(cssString: string, options: { relative: string, hash: string }) {

    let { relative, hash } = options;

    if (hashes[hash]) return true;

    if (relative && !/\//.test(relative)) relative += '/';

    // @ts-ignore
    const baseUrl = new URL(relative, import.meta.url).href;
    // replace url 
    cssString = cssString.replace(urlPattern, function (_, quotes, relUrl1, relUrl2) {
        // @ts-ignore
        return 'url(' + (quotes||'') + new URL(relUrl1 || relUrl2, baseUrl) + (quotes||'') + ')';
    });
    cssStringArr.push(cssString);
    hashes[hash] = true;

    if (!promise) {
        promise = Promise.resolve().then(() => {
            const styleEl = document.createElement('style');
            styleEl.append(document.createTextNode(cssStringArr.join('\n')));
            styleEl.id = hash;
            document.head.appendChild(styleEl);
            reset();
        });
    }
}