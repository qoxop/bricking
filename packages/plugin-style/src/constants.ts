/**
 * 运行时 Css 模块标识
 */
const STYLE_EXTERNALS_MODULE = '___INJECT_STYLE_LINK___';

/**
 * 插入远程样式文件的模块代码
 */
const INJECT_REMOTE_CSS_CODE = `
export default function(href) {
  var link = document.createElement('link');
  link.setAttribute('href', href);
  link.setAttribute('rel','stylesheet');
  document.head.appendChild(link);
}
`
/**
 * 插入远程样式文件的模块 ID
 */
 const INJECT_REMOTE_CSS_ID = '$__INJECT_REMOTE_CSS__'

/**
 * 远程样式文件 ID 前缀
 */
const REMOTE_CSS_PREFIX = '$__REMOTE_CSS__@';

export {
  STYLE_EXTERNALS_MODULE,
  INJECT_REMOTE_CSS_CODE,
  INJECT_REMOTE_CSS_ID,
  REMOTE_CSS_PREFIX,
};
