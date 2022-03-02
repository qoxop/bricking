import fs from "fs";
import path from "path";
import { btkType, btkFile } from "@bricking/toolkit/dist";

import { excludePackages } from "./constants";
import { getUserOptions } from "../options";
import { getPackageJson, paths } from "../paths";



export default () => {

    let hasIndex = false;

    const { bundle } = getUserOptions();

    let { defines = {}, output = './types' } = bundle.moduleDefines;

    if (!path.isAbsolute(output)) {
        output = path.resolve(paths.workspace, output);
    }
    btkFile.del.sync(output);

    Object.entries(defines).forEach(([key, value]) => {
        hasIndex = key === 'index';
        btkType.createTypeDefine({
            input: path.isAbsolute(value) ? value : path.resolve(paths.workspace, value),
            output: path.resolve(output, `${key}.d.ts`),
            cwd: paths.workspace,
        })
    });
    
    const packageObj = getPackageJson();
    delete packageObj.scripts;
    delete packageObj.publishConfig;
    delete packageObj.devDependencies;
    delete packageObj.main;

    const peerDependencies = packageObj.dependencies || {};

    // 保留 @types 包
    Object.keys(peerDependencies).forEach(key => peerDependencies[`@types/${key}`] && (delete peerDependencies[key]));
    // 移除内置包依赖
    excludePackages.forEach(name => peerDependencies[name] && (delete peerDependencies[name]));

    const { exclude = [] } = bundle.dependencies;
    const innerDependencies = exclude.reduce((innerDeps, cur) => {
        if (peerDependencies[`@types/${cur}`]) {
            // 存在 @types 包，就只保留 @types 包
            innerDeps[`@types/${cur}`] = peerDependencies[`@types/${cur}`];
            delete peerDependencies[`@types/${cur}`];
            delete peerDependencies[cur];
        } else if (peerDependencies[cur]) {
            // 不存在 @types 包
            innerDeps[cur] = peerDependencies[cur];
            delete peerDependencies[cur];
        }
        return innerDeps;
    }, {});
    // 对等依赖
    packageObj.peerDependencies = peerDependencies;
    // 内部依赖
    packageObj.dependencies = innerDependencies;

    if (hasIndex) {
        packageObj.types = 'index.d.ts';
    }

    if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
    }
    fs.writeFileSync(
        path.resolve(output, './package.json'),
        JSON.stringify(packageObj, null, '\t'),
    );
    return output;
}