import urlJoin from 'url-join';

const urlPattern = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;
const hashes = {};
// TODO 滤镜路径替换
// const alphaPattern = /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g
export default function(cssString: string, options: { stylesRelative: string, hash: string }) {
    if (hashes[options.hash]) {
        return true;
    }
    // @ts-ignore
    const baseUrl = new urlJoin(import.meta.url, options.stylesRelative);
    // replace url 
    cssString = cssString.replace(urlPattern, function (match, quotes, relUrl1, relUrl2) {
        // @ts-ignore
        return 'url(' + (quotes||'') + urlJoin(import.meta.url, relUrl1 || relUrl2) + (quotes||'') + ')';
    });
    const styleEl = document.createElement('style');
    styleEl.innerText = cssString;
    styleEl.id = options.hash;
    document.head.appendChild(styleEl);
    hashes[options.hash] = true;
}