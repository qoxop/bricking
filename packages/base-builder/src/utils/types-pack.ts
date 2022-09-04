import fs from 'fs';
import path from 'path';
import { btkType, fsExtra } from '@bricking/toolkit';
import { getUserOptions } from '../options';
import { getPackageJson, paths } from '../paths';

/**
 * 更新 `package.json`。
 * 如果一个依赖存在 `@types` 包，则只保留 `@types` 包
 */
export const updatePkgJson = (json: any) => {
  const { peerDependencies, ...other } = json;
  const newPeerDependencies = {};
  Object.keys(peerDependencies)
    .filter(key => !peerDependencies[`@types/${key}`])
    .forEach(key => {
      newPeerDependencies[key] = peerDependencies[key]
    })
  return {
    ...other,
    peerDependencies: newPeerDependencies,
  }
  
}

export default (remoteEntry: string) => {
  let hasIndex = false;

  const { bundle, output } = getUserOptions();
  let typeOutput = path.join(output, './types');
  let { defines = {} } = bundle.moduleDefines;

  if (!path.isAbsolute(typeOutput)) {
    typeOutput = path.resolve(paths.workspace, typeOutput);
  }
  fsExtra.emptyDirSync(typeOutput);

  Object.entries(defines).forEach(([key, value]) => {
    hasIndex = key === 'index';
    btkType.createTypeDefine({
      input: path.isAbsolute(value) ? value : path.resolve(paths.workspace, value),
      output: path.resolve(typeOutput, `${key}.d.ts`),
      cwd: paths.workspace,
    });
  });

  const packageObj = getPackageJson() as any;
  packageObj.remoteEntry = remoteEntry;
  if (hasIndex) packageObj.types = 'index.d.ts';

  if (!fs.existsSync(typeOutput)) {
    fs.mkdirSync(typeOutput, { recursive: true });
  }
  fs.writeFileSync(
    path.resolve(typeOutput, './package.json'),
    JSON.stringify(updatePkgJson(packageObj), null, '\t'),
  );
  return typeOutput;
};
