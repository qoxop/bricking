#!/usr/bin/env node

require('yargs')
  .scriptName('bricking')
  .command(
    'dev',
    '启动开发服务器',
    () => void 0,
    () => {
      process.env.NODE_ENV = 'development';
      const { initBaseLibInfo } = require('../dist/install');
      const { runStart } = require('../dist/build');
      initBaseLibInfo().then(runStart);
    },
  ).command(
    'build',
    '构建项目',
    () => void 0,
    (argv) => {
      // pnpm 的一个 bug, monorepo项目结构中 production 模式下子项目安装依赖会失败
      const { initBaseLibInfo } = require('../dist/install');
      try {
        initBaseLibInfo().then(async () => {
          process.env.NODE_ENV = 'production';
          try {
            await require('../dist/build').runBuild(!!argv.dev);
          } catch (err) {
            console.error(err)
            process.exit(-1);
          }
        });
      } catch (error) {
        console.error(err)
        process.exit(-1);
      }
    },
  )
  .command(
    'serve',
    '启动静态服务',
    () => void 0,
    () => {
      process.env.NODE_ENV = 'production';
      require('../dist/build').runServe();
    },
  )
  .command(
    'install',
    '安装基座包的对等依赖(以供开发时的类型提醒)',
    () => void 0,
    (args) => {
      require('../dist/install').install((args._ || []).slice(1));
    },
  )
  .command(
    'create [type]',
    '创建模版项目',
    (yargs) => {
      yargs.positional('type', {
        describe: '指定模版类型',
        type: 'string',
      });
      return yargs.option('name', {
        alias: 'n',
        describe: '项目名称',
        type: 'string',
      }).option('template', {
        alias: 't',
        describe: '指定一个模版',
        type: 'string',
      }).option('cwd', {
        alias: 'c',
        describe: '指定工作目录',
        type: 'string',
        default: './',
      });
    },
    (args) => {
      const { type, name, template, cwd } = args;
      require('../dist/create').create({ type, name, template, cwd });
    },
  )
  .help()
  .argv;
