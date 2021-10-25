"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const urlPattern = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;
const hashes = {};
// TODO 滤镜路径替换
// const alphaPattern = /(AlphaImageLoader\(\s*src=['"]?)([^"')]+)(["'])/g
function default_1(cssString, options) {
    let { stylesRelative, hash } = options;
    if (hashes[hash])
        return true;
    if (stylesRelative && !/\//.test(stylesRelative))
        stylesRelative += '/';
    // @ts-ignore
    const baseUrl = new URL(stylesRelative, import.meta.url).href;
    // replace url 
    cssString = cssString.replace(urlPattern, function (_, quotes, relUrl1, relUrl2) {
        // @ts-ignore
        return 'url(' + (quotes || '') + new URL(relUrl1 || relUrl2, baseUrl) + (quotes || '') + ')';
    });
    const styleEl = document.createElement('style');
    styleEl.append(document.createTextNode(cssString));
    styleEl.id = hash;
    document.head.appendChild(styleEl);
    hashes[hash] = true;
}
exports.default = default_1;
