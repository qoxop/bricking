
const fs = require('fs');
const path = require('path');

module.exports.getPkgGraph = (roots = [], exclude = []) => {
  return roots
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
      const { devDependencies = {}, dependencies = {}, name, version } = require(packageJson);
      !pre[name] && (pre[name] = {});
      const deps = Object.entries({...devDependencies, ...dependencies})
        .filter(([_, value]) => /^workspace/.test(value))
        .map(([key]) => key);
      pre[name] = { deps, path: pkgPath, version };
      return pre;
    }, {});
}