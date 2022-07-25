import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

/**
 * 获取工作目录下的 index.html 文档对象
 * @param workspace - 工作空间
 * @returns
 */
const getIndexDom = (workspace?: string) => new JSDOM(fs.readFileSync(path.join(workspace || process.cwd(), 'index.html'), 'utf8'));

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
 * @param output - 输出路径
 * @returns
 */
function injectScripts(dom: any, scripts: Script[], output?: string) {
  const { window: { document} } = dom;
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
    fs.writeFileSync(path.join(output, './index.html'), dom.serialize(), { encoding: 'utf-8' });
  }
  return dom;
}
export {
  getIndexDom,
  injectScripts,
};

export type {
  Script,
};
