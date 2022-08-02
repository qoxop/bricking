import * as path from 'path';
import { mkdirSync } from 'fs';
import * as rollup from 'rollup';
import alias from '@rollup/plugin-alias';
import jsonPlugin from '@rollup/plugin-json';
import bundleStyle from '@bricking/plugin-style';
import livereload from 'rollup-plugin-livereload';
import builtins from 'rollup-plugin-node-builtins';
import { btkDom, btkFile } from '@bricking/toolkit';
import config, { tsConfig, tsConfigPath, workspace } from './config';
import { relativeUrl } from './plugins/postcss-relative-url';
import { openBrowser, startServe } from './server';
import rollupUrl from './plugins/rollup-url';
import rollupLog from './plugins/rollup-log';
import * as logs from './utils/log';
import { getBaseLibInfo } from './install';

// 添加 postcss-relative-url 插件
// @ts-ignore
config.style.postcss.plugins.push(relativeUrl({
  cssOutput: path.dirname(path.resolve(config.output, config.style.filename as string)),
  baseOutput: config.output,
  limit: config.assets.limit,
  filename: config.assets.filename,
  loadPaths: config.assets.loadPaths,
}));

const cleanPath = async (output: string) => {
  await btkFile.del(output);
  mkdirSync(output, { recursive: true });
};

/**
 * 获取别名配置
 * @returns
 */
const getAliasEntries = () => {
  const entries = {};
  Object.entries(tsConfig?.compilerOptions?.paths || {}).forEach(([key, value]) => {
    // @ts-ignore
    let relativePath = value[0];
    if (/\/\*$/.test(key)) {
      key = key.replace(/\/\*$/, '');
    }
    if (/\/\*$/.test(relativePath)) {
      relativePath = relativePath.replace(/\/\*$/, '');
    }
    if (!entries[key]) {
      entries[key] = path.join(workspace, relativePath);
    }
  });
  return entries;
};

/**
 * 获取外部依赖列表
 * @returns
 */
const getExternals = async () => {
  let { peerDependencies } = await getBaseLibInfo();
  peerDependencies = Object.keys(peerDependencies).reduce((prev, cur) => {
    prev[cur.replace(/^@types\//, '')] = true;
    return prev;
  }, {});
  return Object.keys(peerDependencies).concat(['___INJECT_STYLE_LINK___']);
};

/**
 * 获取通用插件列表
 * @returns
 */
const commonPlugin = () => ([
  require('@rollup/plugin-node-resolve').default({ browser: true }),
  require('@rollup/plugin-commonjs')(),
  builtins({ crypto: true }),
  alias({ entries: getAliasEntries() }),
  jsonPlugin(),
  // 打包样式文件
  bundleStyle(config.style),
  // 处理文件
  rollupUrl({
    limit: config.assets.limit,
    include: config.assets.include,
    exclude: config.assets.exclude || [],
    fileName: config.assets.filename,
  }),
  // 日志插件
  rollupLog({ workspace }),
  // 字符串模板替换
  require('@rollup/plugin-replace')({
    values: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    preventAssignment: true,
  }),
  // 编译 ts
  require('@rollup/plugin-typescript')({
    tsconfig: tsConfigPath,
    sourceMap: true,
    inlineSources: true,
  }),
]);

/**
 * 构建任务
 * @param entry
 * @param output
 * @param importMaps
 */
const build = async (entry: string | Record<string, string>, output: string, importMaps?: Record<string, string>) => {
  const bundle = await rollup.rollup({
    preserveEntrySignatures: 'exports-only',
    context: 'window',
    input: entry,
    external: [
      ...Object.keys(importMaps || {}),
      ...(await getExternals()),
    ],
    plugins: [
      // 通用插件
      ...commonPlugin(),
      // 自定义插件
      ...(config.plugins || []),
      // 压缩
      require('rollup-plugin-terser').terser({ format: { comments: false } }),
    ],
  });
  const rollupOutput = await bundle.write({
    dir: output,
    format: 'systemjs',
    entryFileNames: '[name]-[hash].js',
    sourcemap: true,
  });
  return {
    bundle,
    rollupOutput,
  };
};

/**
 * 检测变化实时构建
 * @param entry
 * @param output
 * @param importMaps
 * @returns
 */
const watch = async (entry: string | Record<string, string>, output: string, importMaps?: Record<string, string>) => {
  const watcher = rollup.watch({
    preserveEntrySignatures: 'exports-only',
    context: 'window',
    input: entry,
    onwarn: (warn) => {
      console.error(`💥 Error: ${warn.message}`);
      if (warn.loc) {
        const { file, line, column } = warn.loc;
        console.error(`     └─ position: ${file}:${line}:${column}\n`);
      }
    },
    external: [
      ...Object.keys(importMaps || {}),
      ...(await getExternals()),
    ],
    plugins: [
      // 通用插件
      ...commonPlugin(),
      // 自定义插件
      ...(config.plugins || []),
      livereload({
        watch: config.output,
        verbose: false,
        delay: 300,
      }),
    ],
    output: {
      dir: output,
      format: 'systemjs',
      entryFileNames: '[name].js',
      sourcemap: true,
    },
    watch: {
      buildDelay: 300,
      exclude: ['node_modules/**'],
    },
  });

  await new Promise<void>((resolve) => {
    watcher.on('event', (event) => {
      if (event.code === 'BUNDLE_END') {
        event.result.close();
      }
      if (event.code === 'END') {
        resolve();
      }
    });
  });
};

export async function runBuild() {
  cleanPath(config.output);
  const { rollupOutput } = await build(config.entry, config.output);
  const entryChunks = rollupOutput.output.filter((chunk) => chunk.type === 'chunk' && chunk.isEntry);
  const importMaps = entryChunks.reduce((prev, cur) => {
    prev[`@module/${cur.name}`] = `./${cur.fileName}`;
    return prev;
  }, {});
  const { rollupOutput: debugRollupOut } = await build(config.browseEntry, config.output, importMaps);
  const browseEntryChunk = debugRollupOut.output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
  const { remoteEntry } = await getBaseLibInfo();
  /**
     * 输出 html 文件
     */
  btkDom.injectScripts(btkDom.getIndexDom(), [
    {
      url: remoteEntry,
    },
    {
      content: JSON.stringify({ imports: importMaps }),
      type: 'systemjs-importmap',
    },
    {
      // @ts-ignore
      url: config.publicPath ? new URL(browseEntryChunk.fileName, config.publicPath).href : `./${browseEntryChunk.fileName}`,
      type: 'systemjs-module',
    },
  ], config.output);
}
export async function runServe() {
  await startServe(config.devServe as any, config.output);
  openBrowser(`http://${config.devServe.host}:${config.devServe.port}${config.devServe.open}`);
}
export async function runStart() {
  cleanPath(config.output);
  const start = Date.now();
  await watch(config.entry, config.output);
  const importMaps = Object.keys(config.entry).reduce((prev, cur) => ({ ...prev, [`@module/${cur}`]: `./${cur}.js` }), {});
  await watch({ 'browse-entry': config.browseEntry }, config.output, importMaps);
  const { remoteEntry } = await getBaseLibInfo();
  btkDom.injectScripts(btkDom.getIndexDom(), [
    {
      url: remoteEntry,
    },
    {
      content: JSON.stringify({ imports: importMaps }),
      type: 'systemjs-importmap',
    },
    {
      url: './browse-entry.js',
      type: 'systemjs-module',
    },
  ], config.output);
  const now = Date.now();
  logs.keepLog(`[⌛️speed]: ${((now - start) / 1000).toFixed(2)}s`);
  await runServe();
}
