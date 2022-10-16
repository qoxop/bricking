import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * 获取 html 文档对象
 * @param htmlPath - html 文档路径
 * @returns
 */
const getHtmlDom = (htmlPath: string) => new JSDOM(fs.readFileSync(htmlPath, 'utf8'));

type Script = {
    url: string,
    type?: string,
    props?: Record<string, string>
} | {
    content: string,
    type?: string,
    props?: Record<string, string>
}
/**
 * 在文档对象上插入脚本标签
 * @param dom - jsdom 对象
 * @param scripts - 脚本信息
 * @param replacement 替换对象
 * @param output - 输出路径
 * @returns
 */
function injectScripts(dom: any, scripts: Script[], replacement:Record<string, string>, output?: string) {
  const { window: { document } } = dom;
  scripts.forEach((item) => {
    const script = document.createElement('script');
    if (item.type) {
      script.type = item.type;
    }
    if ('url' in item) {
      script.src = item.url;
    } else {
      script.innerHTML = item.content;
    }
    if (item.props) {
      Object.keys(item.props).forEach((key) => script.setAttribute(key, (item.props as any)[key]));
    }
    document.body.append(script);
  });
  if (output) {
    let htmlString = dom.serialize() as string;
    for (const [key, value] of Object.entries(replacement)) {
      htmlString = htmlString.split(key).join(value);
    }
    fs.writeFileSync(path.join(output, './index.html'), htmlString, { encoding: 'utf-8' });
  }
  return dom;
}
export {
  getHtmlDom,
  injectScripts,
};

export type {
  Script,
};
