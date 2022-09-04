const { spawnSync } = require('child_process');

const options = { stdio: 'inherit' };
/**
 * 更新版本
 */
// npx changeset version
spawnSync('pnpm', ['changeset', 'version'], options);
// check status
const { stdout } = spawnSync('git', ['status'], { encoding: 'utf-8' });

if (!/working tree clean/.test(stdout)) {
  // commit
  spawnSync('git', ['add', '.'], options);
  spawnSync('git', ['commit', '-m="update version [skip actions]"', '--no-verify'], options);
  // install 
  spawnSync('pnpm', ['install'], options);
  // rebuild
  spawnSync('node', ['./scripts/build.js'], options);
  // publish
  spawnSync('pnpm', ['publish', '-r'], options);
  // tag
  spawnSync('npx', ['changeset', 'tag'], options);
  // push
  spawnSync('git', ['push', '--follow-tags', '--no-verify'], options);
}