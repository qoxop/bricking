import path from 'path';
import { btkType } from '@bricking/toolkit';
import { paths } from '../paths';
import { getUserOptions } from '../options';

/**
 * 更新 `package.json`。
 * 如果一个依赖存在 `@types` 包，则只保留 `@types` 包
 */
export const updatePkgJson = (json: any) => {
  const { peerDependencies, ...other } = json;
  const newPeerDependencies = {};
  Object.keys(peerDependencies)
    .filter((key) => !peerDependencies[`@types/${key}`])
    .forEach((key) => {
      newPeerDependencies[key] = peerDependencies[key];
    });
  return {
    ...other,
    peerDependencies: newPeerDependencies,
  };
};

/**
 * 创建类型声明文件
 */
export async function createTypes() {
  const { dependencies, name } = require(paths.packageJson);
  const { bundle, output } = getUserOptions();
  if (!bundle.expose.length) return;
  const types:Record<string, btkType.TypesData['list'][0]> = {};
  bundle.expose.forEach((item) => {
    // 自定义模块需要生成类型
    if (typeof item !== 'string' && !dependencies[item.name] && item.path && !item.subPath) {
      // 移除可能存在的前缀
      const moduleName = item.name.indexOf(`${name}/`) === 0 ? item.name.replace(`${name}/`, '') : item.name;
      types[moduleName] = {
        input: path.resolve(paths.workspace, item.path),
        output: path.resolve(output, `./${moduleName}.d.ts`),
        cwd: paths.workspace,
      };
    }
  });
  const worker = btkType.runTypesWorker(Object.values(types));
  await worker?.generated;
  await worker?.terminate();
}
