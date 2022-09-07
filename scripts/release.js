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
  // rebuild
  spawnSync('node', ['./scripts/build.js'], options);
  // publish
  const { stdout, stderr } = spawnSync('pnpm', ['publish', '-r', '--access', 'public'], { encoding: 'utf-8' });
  if (/npm ERR\!/.test(stdout) || stderr) {
    console.log('发布报错～')
    console.log(stdout);
    console.log(stderr);
    process.exit(1);
  } else {
    console.log(stdout);
  }
  // tag
  spawnSync('npx', ['changeset', 'tag'], options);
  // push
  spawnSync('git', ['push', '--follow-tags', '--no-verify'], options);
}