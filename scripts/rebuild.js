const clc = require("cli-color");;
const { spawnSync } = require('child_process');
const { getPkgGraph } = require('./utils');

const exclude = [];
const roots = ['packages'];


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

const pkgGraph = getPkgGraph(roots, exclude)

graphBuild(pkgGraph);
