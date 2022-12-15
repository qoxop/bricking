import * as path from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import * as rollup from 'rollup';
import alias from '@rollup/plugin-alias';
import jsonPlugin from '@rollup/plugin-json';
import { rollupStylePlugin } from '@bricking/plugin-style';
import rollupResolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import builtins from 'rollup-plugin-node-builtins';
import esbuild from 'rollup-plugin-esbuild';
import { btkDom, btkFile, btkType, fsExtra } from '@bricking/toolkit';
import config, { packageJson, tsConfig, tsConfigPath, workspace, sourceBase, outputPackPath } from './config';
import { openBrowser, startServe } from './server';
import rollupUrl from './plugins/rollup-url';
import rollupLog from './plugins/rollup-log';
import * as logs from './utils/log';
import { getBaseLibInfo } from './install';
import { BrickingJson } from './typing';

const cleanPath = async (output: string) => {
  await fsExtra.emptyDir(output);
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

const customResolver = rollupResolve({
  extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.sass', '.scss', '.less'],
}) as any;

/**
 * 获取外部依赖列表
 * @returns
 */
const getExternals = async () => {
  let { peerDependencies, name } = getBaseLibInfo();
  peerDependencies = Object.keys(peerDependencies).reduce((prev, cur) => {
    prev[cur.replace(/^@types\//, '')] = true;
    return prev;
  }, {});
  return [
    ...Object.keys(peerDependencies),
    ...Object.keys(config.html.importMaps || {}),
    '___INJECT_STYLE_LINK___',
    new RegExp(`^${name}`),
  ];
};

/**
 * 获取通用插件列表
 * @returns
 */
const commonPlugin = ({
  useEsbuild = false,
  target = 'es2017',
  mode = 'app',
}: { useEsbuild?: boolean; target?: string; mode?: 'app'|'lib'}) => ([
  rollupResolve({ browser: true, extensions: ['.mjs', '.js', '.jsx', '.tsx', '.ts'] }),
  require('@rollup/plugin-commonjs')(),
  builtins({ crypto: true }),
  alias({ entries: getAliasEntries(), customResolver }),
  jsonPlugin(),
  // 打包样式文件
  rollupStylePlugin({ ...config.style, useCssLinkPlugin: mode === 'app' }),
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
      ...config.replacement,
    },
    preventAssignment: true,
  }),
  // 编译 ts
  useEsbuild
    ? esbuild({
      include: /\.[jt]sx?$/,
      minify: process.env.NODE_ENV === 'production',
      target: process.env.NODE_ENV === 'production' ? (target || 'es2017') : 'esnext',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      tsconfig: tsConfigPath,
      loaders: {
        '.json': 'json',
      },
    })
    : require('@rollup/plugin-typescript')({
      tsconfig: tsConfigPath,
      sourceMap: true,
      inlineSources: true,
    }),
]);

const generateTypes = () => {
  try {
    btkType.createTypeDefines({
      base: sourceBase,
      record: typeof config.entry === 'string' ? { index: config.entry } : config.entry,
      output: outputPackPath,
      cwd: workspace,
    });
  } catch (error) {
    console.error(error);
  }
};

/**
 * 构建任务
 * @param entry
 * @param output
 * @param importMaps
 */
const build = async (
  entry: string | Record<string, string>,
  output: string,
  importMaps: Record<string, string> = {},
  mode: 'app'|'lib'|'app|lib' = 'app',
) => {
  let useEsbuild = false;
  const target = (tsConfig?.compilerOptions?.target || '').toLowerCase();
  if (target && !['es3', 'es5'].includes(target)) {
    useEsbuild = true;
  }
  let ret = {} as { bundle?: rollup.RollupBuild, rollupOutput?: rollup.RollupOutput };
  // 输出运行时代码
  if (/app/.test(mode)) {
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
        ...commonPlugin({ useEsbuild, target, mode: 'app' }),
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
    ret = { bundle, rollupOutput };
  }
  // 输出源代码
  if (/lib/.test(mode)) {
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
        ...commonPlugin({ useEsbuild, target, mode: 'lib' }),
        // 自定义插件
        ...(config.plugins || []),
        // 压缩
        require('rollup-plugin-terser').terser({ format: { comments: false } }),
      ],
    });
    await bundle.write({
      dir: outputPackPath,
      format: 'esm',
      entryFileNames: '[name].js',
      sourcemap: true,
    });
  }
  return { ...ret };
};

/**
 * 检测变化实时构建
 * @param entry
 * @param output
 * @param importMaps
 * @returns
 */
const watch = async (
  entry: string | Record<string, string>,
  output: string,
  importMaps: Record<string, string> = {},
  mode: 'app'|'lib'|'app|lib' = 'app',
) => {
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
      ...commonPlugin({ useEsbuild: true }),
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
      format: 'system',
      entryFileNames: '[name].js',
      sourcemap: true,
    },
    watch: {
      buildDelay: 300,
      exclude: ['node_modules/**'],
    },
  });
  if (/lib/.test(mode)) {
    let time: NodeJS.Timeout;
    watcher.on('change', () => {
      clearTimeout(time);
      time = setTimeout(() => generateTypes(), 2000);
    });
  }
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

/**
 * 设置 html 文件
 * @param importMaps
 * @param browseEntry
 */
async function setHtml(importMaps: Record<string, string>, browseEntry: string) {
  const { remoteEntry } = getBaseLibInfo();
  btkDom.injectScripts(btkDom.getHtmlDom(config.html.path), [
    {
      url: remoteEntry,
    },
    {
      content: JSON.stringify({ imports: {
        ...(importMaps || ''),
        ...(config.html.importMaps || {}),
      } }),
      type: 'systemjs-importmap',
    },
    {
      url: browseEntry,
      type: 'systemjs-module',
    },
  ], config.html.replacement || {}, config.output);
}

async function setBrickingJson(
  importMaps: Record<string, any>,
  imports: string[],
) {
  const { publicPath, output } = config;
  const { version, name } = packageJson;
  const requires = imports.filter(
    (item) => !/^___INJECT_STYLE_LINK___/.test(item),
  );
  const { peerDependencies } = getBaseLibInfo();
  const json: BrickingJson = {
    name,
    version,
    entry: importMaps,
    dependence: {
      requires,
    },
    peerDependencies,
    updateTime: Date.now(),
    publicPath,
  };
  const documentPath = path.join(workspace, './README.md');
  if (existsSync(documentPath)) {
    await fsExtra.copy(documentPath, path.join(output, './README.md'));
    const documentUrl = publicPath ? `${publicPath}README.md` : './README.md';
    json.document = documentUrl as any;
  }
  const { document } = getBaseLibInfo();
  if (document) {
    json.dependence.document = document as any;
  }
  writeFileSync(
    path.resolve(output, 'package.json'),
    JSON.stringify(json, null, '\t'),
  );
  writeFileSync(
    path.resolve(outputPackPath, 'package.json'),
    JSON.stringify(json, null, '\t'),
  );
}

/**
 * 执行构建任务
 */
export async function runBuild() {
  const start = Date.now();
  const { publicPath } = config;
  cleanPath(config.output);

  let imports: IterableIterator<string> = [] as any;
  let importMaps = {};
  // 如果配置了模块入口映射
  if (config.entry) {
    // 构建编译这些入口
    const { rollupOutput } = await build(config.entry, config.output, {}, config.mode);
    if (rollupOutput) {
      // 分析依赖模块
      imports = rollupOutput.output
        .map((item) => (item.type === 'chunk' ? item.imports : []))
        .reduce((prev, cur) => (cur.forEach((imp) => prev.add(imp)), prev), new Set<string>())
        .values();
      // 生成 import-maps
      const entryChunks = rollupOutput.output.filter((chunk) => chunk.type === 'chunk' && chunk.isEntry);
      importMaps = entryChunks.reduce((prev, cur) => {
        if (publicPath) {
          prev[`${cur.name}`] = `${publicPath}${cur.fileName}`;
        } else {
          prev[`${cur.name}`] = `/${cur.fileName}`;
        }
        return prev;
      }, {});
    }
  }

  // 生成入口html文件
  if (/app/.test(config.mode)) {
    const { rollupOutput: debugRollupOut } = await build(config.browseEntry, config.output, importMaps, 'app');
    const browseEntryChunk = (debugRollupOut as rollup.RollupOutput).output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry) as any;
    await setHtml(
      importMaps,
      publicPath ? `${publicPath}${browseEntryChunk.fileName}` : `/${browseEntryChunk.fileName}`,
    );
  }

  // 生成 package.json
  await setBrickingJson(importMaps, Array.from(imports));

  // 打包 npm 包
  if (config.entry) {
    // 生成类型文件
    generateTypes();
    // 打包 gtz 文件
    const tgzBuff = await btkFile.Zipper.tarFolder(outputPackPath, []);
    await fsExtra.writeFile(`${outputPackPath.replace(/\/$/, '')}.tgz`, tgzBuff as Buffer);
    // 清除目录
    await fsExtra.remove(outputPackPath);
    // 生成 import-maps 文件
    const newImportMaps = Object.keys(importMaps).reduce((prev, cur) => ({
      ...prev,
      [`${packageJson.name}/${cur}`]: importMaps[cur],
    }), {});
    const importMapsJson = JSON.stringify({
      imports: newImportMaps,
    });
    await fsExtra.writeFile(path.join(config.output, './import-maps.json'), importMapsJson);
  }

  // 打包
  if (config.doPack) {
    await btkFile.Zipper.doZip({
      dir: config.output,
      output: path.resolve(config.output, `./${config.doPack}.zip`),
      prefix: '',
      filter: (abs) => [/\.zip$/, /\.md$/, /\.tgz$/].every((item) => !item.test(abs)),
    });
  }

  const now = Date.now();
  logs.keepLog(`[⌛️speed]: ${((now - start) / 1000).toFixed(2)}s`);
}

/**
 * 启动服务器
 */
export async function runServe() {
  await startServe(config.devServe as any, config.output);
  openBrowser(`http://${config.devServe.host}:${config.devServe.port}${config.devServe.open}`);
}

/**
 * 执行开发任务
 */
export async function runStart() {
  cleanPath(config.output);
  const start = Date.now();

  let importMaps = {};
  // 兼容 entry 不存在的情况
  if (config.entry) {
    await watch(config.entry, config.output, {}, config.mode);
    importMaps = Object.keys(config.entry).reduce((prev, cur) => ({ ...prev, [`${cur}`]: `/${cur}.js` }), {});
  }
  await watch({ 'browse-entry': config.browseEntry }, config.output, importMaps, 'app');
  await setHtml(importMaps, '/browse-entry.js');

  // 库模块开发模式也需要生产 package.json 和 import-maps
  if (/lib/.test(config.mode)) {
    await setBrickingJson(importMaps, []);
    const publicPath = (config.publicPath || (`http://${config.devServe.host}:${config.devServe.port}`)).replace(/\/$/, '');
    const newImportMaps = Object.keys(importMaps).reduce((prev, cur) => ({
      ...prev,
      // 使用包名 + 路径作为模块名
      [`${packageJson.name}/${cur}`]: `${publicPath}${importMaps[cur]}`,
    }), {});
    const importMapsJson = JSON.stringify({
      imports: newImportMaps,
    });
    await fsExtra.writeFile(path.join(config.output, './import-maps.json'), importMapsJson);
  }

  const now = Date.now();
  logs.keepLog(`[⌛️speed]: ${((now - start) / 1000).toFixed(2)}s`);
  await runServe();
}
