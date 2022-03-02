const fs = require('fs');
const path = require('path');
const clc = require("cli-color");;
const { spawnSync } = require('child_process');

const exclude = [];
const roots = ['packages', 'apps'];


function graphBuild(pkgGraph) {
    const buildedSet = new Set();
    console.table(pkgGraph, ['deps'])
    const build = (names = []) => {
        names.filter(name => !buildedSet.has(name)).forEach(name => {
            const pkg = pkgGraph[name];
            // 如果存在依赖，优先把依赖构建完
            if (pkg.deps?.length) build(pkg.deps);
            // 构建当前包
            
            buildedSet.add(name);
            console.log(clc.red(`> ${name}: pnpm install  🛰  🛰`));
            spawnSync('pnpm', ['install'], { cwd: pkg.path, stdio: 'inherit' });
            console.log(clc.yellow(`> ${name}: pnpm run build 🚀 🚀`));
            spawnSync('pnpm', [ 'run', 'build', ...process.argv.slice(2)], { cwd: pkg.path, stdio: 'inherit' });
            console.log(`======================== ${name} finish 🍺🍺  ======================== \n\n`)
        })
    };
    build(Object.keys(pkgGraph));
}

const pkgGraph = roots
    .map(root => (
        fs.readdirSync(path.resolve(__dirname, '../', root))
            .map((pkgDir) => path.resolve(root, pkgDir))
            .filter(pkgPath => {
                const packageJson = path.resolve(pkgPath, './package.json');
                if (!fs.existsSync(packageJson)) {
                    return false;
                }
                const { scripts, name } = require(packageJson)
                return scripts?.build && !exclude.includes(name);
            }
        )
    ))
    .reduce((pkgPaths, cur) => pkgPaths.concat(cur), [])
    .reduce((pre, pkgPath) => {
        const packageJson = path.resolve(pkgPath, './package.json');
        const { devDependencies = {}, dependencies = {}, name } = require(packageJson);
        !pre[name] && (pre[name] = {});
        const deps = Object.entries({...devDependencies, ...dependencies})
            .filter(([_, value]) => /^workspace/.test(value))
            .map(([key]) => key);
        pre[name] = { deps, path: pkgPath };
        return pre;
    }, {});

graphBuild(pkgGraph);
