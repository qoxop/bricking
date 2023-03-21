import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { compileToEs5 } from './compiles';

/**
 * 获取 html 文档对象
 * @param htmlPath - html 文档路径
 * @returns
 */
const getHtmlDom = (htmlPath: string) => new JSDOM(fs.readFileSync(htmlPath, 'utf8'));

type ContentScript = {
  content: string,
  type?: string,
  props?: Record<string, string>
}
type UrlScript = {
  url?: string,
  type?: string,
  props?: Record<string, string>
}
type Script = ContentScript | UrlScript;

/**
 * 在文档对象上插入脚本标签
 * @param dom - jsdom 对象
 * @param scripts - 脚本信息
 * @param replacement 替换对象
 * @param output - 输出路径
 * @returns
 */
async function injectScripts(dom: any, scripts: Script[], replacement:Record<string, string>, output?: string) {
  const { window: { document } } = dom;
  const otherScripts = scripts.filter((item) => item.type !== 'systemjs-module');
  otherScripts.forEach((item) => {
    const script = document.createElement('script');
    script.crossorigin = 'anonymous';
    if (item.type) {
      script.type = item.type;
    }
    if ('url' in item && item.url) {
      script.src = item.url;
    } else if ('content' in item && item.content) {
      script.innerHTML = item.content;
    }
    if (item.props) {
      Object.keys(item.props).forEach((key) => script.setAttribute(key, (item.props as any)[key]));
    }
    document.body.append(script);
  });
  // 保障systemjs脚本的执行顺序
  const systemScripts = scripts.filter((item) => item.type === 'systemjs-module') as UrlScript[];
  const importCode = systemScripts.map((item) => (`  await System.import("${item.url}");`)).join('\n');
  const execCode = `(async () => {
    ${importCode}
  })()\n;`;
  if (systemScripts.length) {
    const script = document.createElement('script');
    script.crossorigin = 'anonymous';
    script.innerHTML = await compileToEs5(execCode);
    document.body.append(script);
  }
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
