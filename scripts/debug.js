const fs = require('fs');
const path = require("path");
const { spawnSync } = require('child_process');
const { getPkgGraph, getJson } = require('./utils');

const LocalNpmRegistry = 'http://my-npm.com/'
const PKG_DEBUG_PATH = path.resolve(__dirname, '../_bricking');

const npmrc = `
link-workspace-packages=true
shared-workspace-lockfile=true
save-workspace-protocol=true
git-checks=false
registry=${LocalNpmRegistry}
`

fs.cpSync(
  path.resolve(process.cwd(), 'packages/'),
  path.resolve(process.cwd(),  '_bricking/'),
  {
    recursive: true,
    filter: (source) => !(/_/.test(source) || /node_modules/.test(source))
  }
);

// 写入 npmrc
fs.writeFileSync(path.resolve(PKG_DEBUG_PATH, './.npmrc'), npmrc);

(async () => {
  const graph = getPkgGraph(['_bricking'], []);
  const { latest } = await getJson(`${LocalNpmRegistry}-/verdaccio/data/sidebar/bricking`)
  const newVersion = latest.version
    .split('.')
    .map((v, index) => (index === 2 ? +v+1 : v))
    .join('.');
  // 更新依赖 version 
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
