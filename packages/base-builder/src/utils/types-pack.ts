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
    .filter((key) => !peerDependencies[`@types/${key}`])
    .forEach((key) => {
      newPeerDependencies[key] = peerDependencies[key];
    });
  return {
    ...other,
    peerDependencies: newPeerDependencies,
  };
};

export default (remoteEntry: string) => {
  const { bundle, output } = getUserOptions();
  let typeOutput = path.join(output, './types');
  let { defines = {} as any, baseDir, addSource } = bundle.moduleDefines;

  const hasIndex = !!defines.index || !!bundle.entry;

  if (!path.isAbsolute(baseDir)) {
    baseDir = path.resolve(paths.workspace, baseDir);
  }

  if (hasIndex && !defines.index) {
    const indexPath = path.isAbsolute(bundle.entry as string)
      ? bundle.entry as string
      : path.resolve(paths.workspace, bundle.entry as string);
    defines.index = path.relative(baseDir, indexPath);
  }

  if (!path.isAbsolute(typeOutput)) {
    typeOutput = path.resolve(paths.workspace, typeOutput);
  }
  // 开发时避免重复清空类型文件, 影响开发体验
  if (process.env.NODE_ENV === 'production') {
    fsExtra.emptyDirSync(typeOutput);
  }

  btkType.createTypeDefines({
    base: baseDir,
    record: defines,
    output: typeOutput,
    cwd: paths.workspace,
  });
  if (addSource && process.env.NODE_ENV === 'production') {
    fsExtra.copySync(
      baseDir,
      path.join(typeOutput, path.relative(paths.workspace, baseDir)),
    );
    Object.keys(defines).forEach((key) => {
      fsExtra.writeFileSync(
        path.join(typeOutput, `./${key}.ts`),
        `export * from "${defines[key].replace(/\/index\.tsx?$/, '').replace(/\.tsx?$/, '')}"`,
      );
    });
  }
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
