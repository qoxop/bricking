import fs from "fs";
import path from "path";
import { btkType, btkFile } from "@bricking/toolkit/dist";

import { excludePackages } from "./constants";
import { getUserOptions } from "../options";
import { getPackageJson, paths } from "../paths";



export default () => {
    const { bundle } = getUserOptions();
    let hasIndex = false;
    let { 
        defines = {},
        output = './types'
    } = bundle.moduleDefines;

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

    const dependencies = packageObj.dependencies || {};

    Object.keys(dependencies).forEach(key => {
        if (dependencies[`@types/${key}`]) {
            delete dependencies[key];
        }
    })
    excludePackages
        .filter(name => name !== '@bricking/runtime')
        .forEach(name => dependencies[name] && (delete dependencies[name]));

    packageObj.peerDependencies = dependencies;
    delete packageObj.dependencies;

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