const { spawnSync } = require('child_process');

const options = { stdio: 'inherit' };
/**
 * 更新版本
 */
// npx changeset version
const { stdout } = spawnSync('pnpm', ['changeset', 'version'], {encoding: 'utf-8'});
console.log(stdout);
if (stdout.indexOf('No unreleased changesets found, exiting') < 0) {
  // commit
  spawnSync('git', ['add', '.'], options);
  spawnSync('git', ['commit', '-m="update version [skip actions]"', '--no-verify'], options);
  // rebuild
  spawnSync('node', ['./scripts/build.js'], options);
  // reinstall
  spawnSync('pnpm', ['install'], options);
  // publish
  const { stdout } = spawnSync('pnpm', ['publish', '-r', '--access', 'public'], { encoding: 'utf-8' });
  if (/npm ERR/.test(stdout)) {
    console.log(stdout);
    throw new Error('发布报错～');
  } else {
    console.log(stdout);
  }
  // tag
  spawnSync('npx', ['changeset', 'tag'], options);
  // push
  spawnSync('git', ['push', '--follow-tags', '--no-verify'], options);
}