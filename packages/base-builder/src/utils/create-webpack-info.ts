import path from 'path';
import * as fs from 'fs';
import { getUserOptions } from '../options';
import { paths } from '../paths';

/**
 * 创建 webpack 模块共享信息
 */
export function createWebpackInfo() {
  const { dependencies, name } = require(paths.packageJson);
  const { output, bundle: { expose, exposeAll, exposeExclude } } = getUserOptions();
  const remotes = {};

  if (exposeAll) {
    Object.keys(dependencies).forEach((key) => {
      if (!exposeExclude.some((item) => (typeof item === 'string' ? item === key : item.test(key)))) {
        remotes[key] = `promise window.$bricking.createFederationModule('${key}');`;
      }
    });
  }
  expose.forEach((item) => {
    if (typeof item === 'string') {
      if (dependencies[item] && !remotes[item]) {
        remotes[item] = `promise window.$bricking.createFederationModule('${item}');`;
      }
    } else {
      // 自定义导出模块添加前缀
      let moduleName = (dependencies[item.name] || item.name.indexOf(`${name}/`) === 0 || item.subPath) ? item.name : `${name}/${item.name}`;
      if (moduleName === `${name}/index`) {
        moduleName = name;
      }
      remotes[moduleName] = `promise window.$bricking.createFederationModule('${moduleName}');`;
    }
  });
  const webpackOutput = path.resolve(output, './webpack');
  const remotesJSPath = path.resolve(webpackOutput, './remotes.js');
  const remotesJsCode = `module.exports = ${JSON.stringify(remotes, null, '\t')}`;
  if (!fs.existsSync(webpackOutput)) {
    fs.mkdirSync(webpackOutput, { recursive: true });
  }
  fs.writeFileSync(remotesJSPath, remotesJsCode);
}
