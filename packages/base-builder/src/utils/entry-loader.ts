/**
 * 入口代码生成
 */
import { ModuleInfo } from '../types';
import { getUserOptions } from '../options';
import { paths } from '../paths';

const getDynamicImportStr = (name:string) => `() => import("${name}").then((mod) => {
  if (mod?.default) {
    if (typeof mod.default === 'object') {
      return { ...mod.default, ...mod }
    }
    return mod.default
  }
  if (typeof mod === 'object') {
    return { ...mod, default: mod }
  }
  return mod
})`;

module.exports = () => {
  const { dependencies, name } = require(paths.packageJson);
  const { bundle: { entry, expose, exposeAll, exposeExclude } } = getUserOptions(true);

  const moduleRecord: Record<string, ModuleInfo> = {};

  if (exposeAll) {
    Object.keys(dependencies).forEach((key) => {
      if (!exposeExclude.some((item) => (typeof item === 'string' ? item === key : item.test(key)))) {
        moduleRecord[key] = {
          name: key,
          sync: false,
        };
      }
    });
  }
  expose.forEach((item) => {
    if (typeof item === 'string') {
      if (!moduleRecord[item] && dependencies[item]) {
        moduleRecord[item] = {
          name: item,
          sync: false,
        };
      }
    } else if (dependencies[item.name]) {
      moduleRecord[item.name] = { sync: false, ...item };
    } else if (item.path) {
      // 自定义模块
      const moduleName = (item.name.indexOf(`${name}/`) === 0 || item.isSubLib) ? item.name : `${name}/${item.name}`;
      moduleRecord[moduleName] = {
        sync: true,
        ...item,
        name: moduleName === `${name}/index` ? name : moduleName,
      };
    }
  });
  const modules = Object.values(moduleRecord);
  let source = 'import "@bricking/runtime";\n';

  const syncModules = modules.filter((item) => item.sync).map((item, index) => ({
    importCode: `import * as _var_${index}_ from "${item.path || item.name}";`,
    varCode: `_var_${index}_`,
    name: item.name,
  }));
  const asyncModules = modules.filter((item) => !item.sync).map((item) => ({
    importCode: getDynamicImportStr(item.path || item.name),
    name: item.name,
  }));

  // 添加同步导入
  source += syncModules.map((item) => item.importCode).join('\n');
  if (entry) {
    source += `import "${entry}"\n`;
  }
  // 添加同步注入
  source += `\nwindow.$bricking.set({\n${syncModules.map((item) => (`\t"${item.name}": ${item.varCode},`)).join('\n')}\n});\n`;
  // 添加异步注入
  source += `\nwindow.$bricking.setDynamic({\n${asyncModules.map((item) => (`\t"${item.name}": ${item.importCode},`)).join('\n')}\n});\n`;
  return source;
};
