
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

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

module.exports.getJson = (jsonUrl) => {
  // 本地 JSON
  if (!/^http/.test(jsonUrl)) {
    try {
      return Promise.resolve(require(jsonUrl));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  const url = new URL(jsonUrl);
  const client = /https/.test(url.protocol) ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(url, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e.message);
        }
      });
    });
    req.end();
  });
}