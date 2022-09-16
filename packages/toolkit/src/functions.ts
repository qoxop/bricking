/* eslint-disable no-unused-vars */
/**
 * 限制目标函数只执行一次
 * @param func 目标函数
 * @returns
 */
export function once<Args extends unknown[] = unknown[], Rt = any>(func: (...args: Args) => Rt) {
  const runed = false;
  let returned:Rt;
  return (...args: Args) => {
    if (!runed) {
      returned = func(...args);
    }
    return returned;
  };
}

// https://github.com/filamentgroup/directory-encoder/blob/master/lib/svg-uri-encoder.js
export function encodeSVG(buffer:Buffer) {
  return (
    encodeURIComponent(
      buffer
        .toString('utf-8')
        // strip newlines and tabs
        .replace(/[\n\r]/gim, '')
        .replace(/\t/gim, ' ')
        // strip comments
        .replace(/<!--(.*(?=-->))-->/gim, '')
        // replace
        .replace(/'/gim, '\\i'),
    )
      // encode brackets
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
  );
}

export const getDataUrl = (id: string, buffer: Buffer) => {
  // @ts-ignore
  const mimetype = mime.getType(id);
  const isSVG = mimetype === 'image/svg+xml';
  const data = isSVG ? encodeSVG(buffer) : buffer.toString('base64');
  const encoding = isSVG ? '' : ';base64';
  return `data:${mimetype}${encoding},${data}`;
};