/**
 * 入口代码生成
 */
import { getPackageJson, reloadOptions } from '../paths';
import { excludePackages } from './constants';

module.exports = (source) => {
  const { bundle } = reloadOptions();
  // @ts-ignore
  const depsExclude = (bundle?.dependencies?.exclude || [])?.concat(excludePackages);
  const autoInjectDependencies = bundle?.dependencies?.autoInject;
  const defines = bundle?.moduleDefines?.defines || {};
  const autoInjectDefines = bundle?.moduleDefines?.autoInject || {};

  if (!autoInjectDefines && !bundle.entry) {
    throw new Error('需要指定入口文件 ～');
  }
  source = 'import "@bricking/runtime";\n';

  const { dependencies, name: baseName } = getPackageJson();
  const pkgName = bundle.packageName || baseName;

  let indexInjected = false;
  if (bundle.entry) {
    if (bundle.entry === defines.index) { // TODO 处理后缀
      source += `import * as baseEntry from "${bundle.entry}";\n`;
      source += `\nwindow.$bricking.mm.set({ "${pkgName}": baseEntry })\n`;
      indexInjected = true;
    } else {
      source += `import "${bundle.entry}";\n`;
    }
  }
  if (defines.index && !indexInjected) {
    source += `\nwindow.$bricking.mm.set({ "${pkgName}": require("${defines.index}") })\n`;
  }

  if (autoInjectDefines) {
    const definesImports = Object.entries(defines)
      .filter(([key]) => key !== 'index')
      .map(([key, value]) => (`\t"${pkgName}/${key}": () => import("${value}"),`))
      .join('\n');
    source += `\nwindow.$bricking.mm.setDynamic({\n${definesImports}\n});`;
  }
  if (autoInjectDependencies) {
    const depsImports = Object.keys(dependencies)
      .filter((key) => (!/^@types\//.test(key) && !depsExclude.includes(key)))
      .map((key) => `\t"${key}": () => import("${key}"),`)
      .join('\n');
    source += `\nwindow.$bricking.mm.setDynamic({\n${depsImports}\n});`;
  }
  return source;
};
