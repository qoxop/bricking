const { spawnSync } = require('child_process');
const fs = require('fs');
const got = require('got');
const path = require("path");
const { getPkgGraph } = require('./utils');

const LocalNpmRegistry = 'https://npm.qoxop.run/'
const PKG_DEBUG_PATH = path.resolve(__dirname, '../_bricking');

const npmrc = `
link-workspace-packages=true
shared-workspace-lockfile=true
save-workspace-protocol=true
git-checks=false
registry=${LocalNpmRegistry}
`

// 写入 npmrc
fs.writeFileSync(path.resolve(PKG_DEBUG_PATH, './.npmrc'), npmrc);


const graph = getPkgGraph(['_bricking/packages'], []);


(async () => {
  const { latest } = await got(`${LocalNpmRegistry}-/verdaccio/data/sidebar/bricking`).json();
  const newVersion = latest.version
    .split('.')
    .map((v, index) => (index === 2 ? +v+1 : v))
    .join('.');
  // 更新依赖 verion 
  Object.entries(graph).forEach(([_, { deps, path: p_path }]) => {
    const jsonPath = path.resolve(p_path, 'package.json');
    const json = require(jsonPath);
    json.publishConfig = {
      registry: LocalNpmRegistry
    }
    json.version = newVersion;
    if (deps && deps.length) {
      deps.forEach(d_key => {
        if (json.devDependencies[d_key]) {
          json.devDependencies[d_key] = newVersion
        } else if (json.dependencies[d_key]) {
          json.dependencies[d_key] = newVersion;
        } else if (json.peerDependencies[d_key]) {
          json.peerDependencies[d_key] = newVersion;
        }
      });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, '\t'));
    fs.writeFileSync(path.resolve(p_path, '.npmrc'), `registry=${LocalNpmRegistry}`);
  });
  // 发布包
  Object.entries(graph).forEach(([_, { path: p_path }]) => {
    spawnSync('npm', ['publish', `--registry=${LocalNpmRegistry}`], { stdio: 'inherit', cwd: p_path });
  })
})();

