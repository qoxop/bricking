const urlPattern = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;
const hashes = {};

// 合并插入
let cssStringArr:string[] = [];
let promise:Promise<any>|null = null;

const reset = () => {
    promise = null;
    cssStringArr = [];
}
export default function(
    cssString: string,
    options: {
        relative: string;
        hash: string;
        scriptUrl: string;
    }
) {

    let { relative, hash, scriptUrl } = options;

    if (hashes[hash]) return true;

    if (relative && !/\//.test(relative)) relative += '/';

    // @ts-ignore
    const baseUrl = new URL(relative, scriptUrl).href;
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