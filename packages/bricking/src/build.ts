import * as path from 'path';
import { spawn } from 'child_process';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import * as rollup from 'rollup';
import alias from '@rollup/plugin-alias';
import esbuild from 'rollup-plugin-esbuild';
import jsonPlugin from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollupStylePlugin } from '@bricking/plugin-style';
import { livereloadServer, openBrowser } from '@bricking/plugin-server';
import { btkDom, btkFile, btkType, fsExtra } from '@bricking/toolkit';
import config, { packageJson, tsConfig, tsConfigPath, workspace, sourceBase, outputPackPath, configPath } from './config';
import rollupBundle from './plugins/rollup-bundle';
import rollupUrl from './plugins/rollup-url';
import rollupLog from './plugins/rollup-log';
import { getBaseLibInfo } from './install';
import { BrickingJson } from './typing';
import * as logs from './utils/log';

const cleanPath = async (output: string) => {
  await fsExtra.emptyDir(output);
  mkdirSync(output, { recursive: true });
};

const getModuleAliasFromTsConfig = () => {
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
 */
const getExternals = async () => {
  let { peerDependencies, name } = getBaseLibInfo() || {};
  if (peerDependencies) {
    peerDependencies = Object.keys(peerDependencies).reduce((prev, cur) => {
      prev[cur.replace(/^@types\//, '')] = true;
      return prev;
    }, {});
  }
  return [
    ...Object.keys(peerDependencies || {}),
    ...Object.keys(config.html.importMaps || {}),
    ...(config.externals || []),
    '___INJECT_STYLE_LINK___',
    ...(name ? [new RegExp(`^${name}`)] : []),
  ];
};

/**
 * 获取通用插件列表
 */
const getCommonPlugin = ({
  output,
  target = 'es2017',
  useEsbuild = false,
}: { useEsbuild?: boolean; target?: string; output?: string}) => ([
  nodeResolve({ browser: true, extensions: ['.mjs', '.js', '.jsx', '.tsx', '.ts'] }),
  commonjs(),
  builtins({ crypto: true }),
  alias({
    entries: getModuleAliasFromTsConfig(),
    customResolver: nodeResolve({
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.sass', '.scss', '.less'],
    }) as any,
  }),
  jsonPlugin(),
  // 打包样式文件
  rollupStylePlugin({ ...config.style }),
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
      compilerOptions: {
        ...(output ? { outDir: output } : {}),
      },
    }),
]);

/**
 * 获取公共配置
 */
const getCommonOptions = async (
  params: {
    mode: string;
    entry?: rollup.InputOption | undefined;
    importMaps?: Record<string, string>;
  },
  callback?: ((opt: rollup.RollupOptions) => rollup.RollupOptions),
) => {
  let useEsbuild = false;
  const target = (tsConfig?.compilerOptions?.target || '').toLowerCase();
  if (target && !['es3', 'es5'].includes(target)) {
    useEsbuild = true;
  }
  const options: rollup.RollupOptions = {
    preserveEntrySignatures: 'exports-only',
    context: 'window',
    input: params.entry,
    external: [
      ...Object.keys(params.importMaps || {}),
      ...(await getExternals()),
    ],
    plugins: [
      // 通用插件
      ...getCommonPlugin({ useEsbuild, target, output: /lib/.test(params.mode) ? outputPackPath : undefined }),
      // 自定义插件
      ...(config.plugins || []),
      // 压缩
      require('rollup-plugin-terser').terser({ format: { comments: false } }),
    ],
  };
  return callback ? (callback(options) || options) : options;
};

/**
 * 输出类型文件
 */
const generateTypes = (useChildProcess?: boolean) => {
  if (!config.modules) return;
  if (useChildProcess) {
    return spawn('node', [path.resolve(__dirname, './generate-type.js')], { stdio: 'inherit' });
  }
  try {
    btkType.createTypeDefines({
      base: sourceBase,
      record: typeof config.modules === 'string' ? { index: config.modules } : config.modules,
      output: outputPackPath,
      cwd: workspace,
    });
  } catch (error) {
    console.error(error);
  }
};

/**
 * 构建任务
 */
const build = async (
  entry: string | Record<string, string>,
  output: string,
  importMaps: Record<string, string> = {},
  mode: 'app'|'lib'|'app|lib' = 'app',
) => {
  const ret = {} as { bundle?: rollup.RollupBuild, rollupOutput?: rollup.RollupOutput, libBundleName?: string};
  // 如果输入为空，则什么都不做
  if (!entry) return ret;

  // 正常编译，每个模块分别作为一个入口 chunk
  const bundle = await rollup.rollup(await getCommonOptions({ mode, entry, importMaps }));
  // 输出 systemjs 代码
  if (/app/.test(mode)) {
    const rollupOutput = await bundle.write({
      dir: output,
      format: 'systemjs',
      entryFileNames: '[name]-[hash].js',
      sourcemap: true,
    });
    ret.bundle = bundle;
    ret.rollupOutput = rollupOutput;
  }
  // 输出 ESM 代码
  if (/lib/.test(mode)) {
    const rollupOutput = await bundle.write({
      dir: outputPackPath,
      format: 'esm',
      entryFileNames: '[name].js',
      sourcemap: true,
    });
    if (!ret.bundle) ret.bundle = bundle;
    if (!ret.rollupOutput) ret.rollupOutput = rollupOutput;
  }

  // 捆绑编译, 将多个入口模块打包到一个文件中去, 方便开发调试
  if (mode === 'lib') {
    const combineBundle = await rollup.rollup(await getCommonOptions({ mode: 'app', importMaps }, (opt) => {
      // 插入捆绑插件
      opt.plugins?.unshift(rollupBundle({
        configPath,
        realEntry: entry,
        pkgName: packageJson.name,
      }));
      return opt;
    }));
    const combineRollupOutput = await combineBundle.write({
      dir: output,
      format: 'systemjs',
      entryFileNames: `${packageJson.name}-[hash].js`,
      sourcemap: true,
    });
    const entryChunk = combineRollupOutput.output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry) as rollup.OutputChunk;
    ret.libBundleName = entryChunk?.fileName;
  }
  return ret;
};

/**
 * 检测变化实时构建
 */
const watch = async (
  entry: string | Record<string, string>,
  output: string,
  importMaps: Record<string, string> = {},
  mode: 'app'|'lib'|'app|lib' = 'app',
) => {
  if (!entry) return;
  const libBundleName = `${packageJson.name}.js`;

  const watcher = rollup.watch(await getCommonOptions({ entry, mode: 'app', importMaps }, (opt) => {
    opt.onwarn = (warn) => {
      console.error(`💥 Error: ${warn.message}`);
      warn.loc && console.error(`     └─ position: ${warn.loc.file}:${warn.loc.line}:${warn.loc.column}\n`);
    };
    opt.output = {
      dir: output,
      format: 'system',
      entryFileNames: mode === 'lib' ? libBundleName : '[name].js',
      sourcemap: true,
    };
    opt.watch = { buildDelay: 300, exclude: ['node_modules/**'] };
    opt.plugins?.push(livereloadServer(config.devServe as any)); // 热重载
    mode === 'lib' && opt.plugins?.unshift(rollupBundle({ // 捆绑插件
      configPath,
      realEntry: entry,
      pkgName: packageJson.name,
    }));
    opt.plugins = opt.plugins?.filter((item) => item && item.name !== 'terser'); // 移除 terser 压缩插件
    return opt;
  }));
  // 如果是纯粹的 lib 模式，需要实时生成类型，以便于调试
  let time: NodeJS.Timeout;
  let childProcess: ReturnType<typeof spawn>|undefined;
  if (mode === 'lib') {
    watcher.on('change', () => {
      clearTimeout(time);
      time = setTimeout(() => {
        if (childProcess && !childProcess.killed) {
          try {
            childProcess.kill();
          } catch (error) {
            console.trace(error);
          }
        }
        childProcess = generateTypes(true);
      }, 1000);
    });
  }
  return new Promise<string>((resolve) => {
    watcher.on('event', (event) => {
      if (event.code === 'BUNDLE_END') {
        event.result.close();
      }
      if (event.code === 'END') {
        if (mode === 'lib') {
          time = setTimeout(() => {
            childProcess = generateTypes(true);
          }, 500);
        }
        resolve(libBundleName);
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
  const baseLibInfo = getBaseLibInfo();
  await btkDom.injectScripts(btkDom.getHtmlDom(config.html.path), [
    {
      url: baseLibInfo?.remoteEntry,
    },
    {
      content: JSON.stringify({ imports: {
        ...(importMaps || ''),
        ...(config.html.importMaps || {}),
      } }),
      type: 'systemjs-importmap',
    },
    ...(config.html.scripts || []),
    {
      url: browseEntry,
      type: 'systemjs-module',
    },
  ], config.html.replacement || {}, config.output);
}

async function setBrickingJson(
  importMaps: Record<string, any>,
  imports: string[],
  bundle?: string,
) {
  const { publicPath, output, modules } = config;
  const { version, name } = packageJson;
  const requires = imports.filter(
    (item) => !/^___INJECT_STYLE_LINK___/.test(item),
  );
  const baseLibInfo = getBaseLibInfo();
  const json: BrickingJson = {
    name,
    version,
    bundle,
    entry: importMaps,
    dependence: {
      requires,
    },
    externals: Object.keys(modules).map((k) => (`${name}/${k}`)),
    updateTime: Date.now(),
    publicPath,
  };
  if (baseLibInfo && baseLibInfo.peerDependencies) {
    json.peerDependencies = baseLibInfo.peerDependencies;
  }
  if (baseLibInfo && baseLibInfo.document) {
    json.dependence.document = baseLibInfo.document as any;
  }
  const documentPath = path.join(workspace, './README.md');
  if (existsSync(documentPath)) {
    await fsExtra.copy(documentPath, path.join(output, './README.md'));
    const documentUrl = publicPath ? `${publicPath}README.md` : './README.md';
    json.document = documentUrl as any;
  }
  writeFileSync(
    path.resolve(output, 'package.json'),
    JSON.stringify(json, null, '\t'),
  );
  if (!existsSync(outputPackPath)) mkdirSync(outputPackPath, { recursive: true });
  writeFileSync(
    path.resolve(outputPackPath, 'package.json'),
    JSON.stringify(json, null, '\t'),
  );
}

/**
 * 执行构建任务
 */
export async function runBuild(devMode: boolean) {
  const start = Date.now();
  const { publicPath, mode } = config;
  await cleanPath(config.output);

  let imports: IterableIterator<string> = [] as any;
  let importMaps = {};

  // 模块构建
  const { rollupOutput, libBundleName } = await build(config.modules, config.output, {}, config.mode);
  // 获取捆绑文件路径
  const getBundlePath = () => {
    if (!libBundleName) return;
    return publicPath ? `${publicPath}${libBundleName}` : `/${libBundleName}`;
  };
  if (rollupOutput) {
    // 分析依赖模块
    imports = rollupOutput.output
      .map((item) => (item.type === 'chunk' ? item.imports : []))
      .reduce((prev, cur) => (cur.forEach((imp) => prev.add(imp)), prev), new Set<string>())
      .values();
    // 如果不是纯 lib 模式，则需要计算 import-maps
    if (mode !== 'lib') {
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

  // 应用构建(编译构建bootstrap)
  if (/app/.test(config.mode)) {
    const { rollupOutput: debugRollupOut } = await build(config.bootstrap, config.output, importMaps, 'app');
    const browseEntryChunk = (debugRollupOut as rollup.RollupOutput).output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry) as any;
    // 输出 html 文件
    await setHtml(
      importMaps,
      publicPath ? `${publicPath}${browseEntryChunk.fileName}` : `/${browseEntryChunk.fileName}`,
    );
  }

  // 生成 package.json
  await setBrickingJson(importMaps, Array.from(imports), getBundlePath());

  // 打包 npm 包
  if (config.modules) {
    // 同步地生成类型文件
    generateTypes();
    // 打包 tgz 文件
    const tgzBuff = await btkFile.Zipper.tarFolder(outputPackPath, []);
    await fsExtra.writeFile(`${outputPackPath.replace(/\/$/, '')}.tgz`, tgzBuff as Buffer);
    if (!devMode) {
      await fsExtra.remove(outputPackPath);
    }
    if (mode !== 'lib') {
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
  }

  // 打包
  if (config.doPack) {
    await btkFile.Zipper.doZip({
      dir: config.output,
      output: path.resolve(config.output, `./${config.doPack}.zip`),
      prefix: '',
      filter: (abs) => [/\.zip$/, /\.md$/, /\.tgz$/, /\.d\.ts$/, /\.map$/].every((item) => !item.test(abs)),
    });
  }

  const now = Date.now();
  logs.keepLog(`[⌛️speed]: ${((now - start) / 1000).toFixed(2)}s`);
}

/**
 * 执行开发任务
 */
export async function runStart() {
  await cleanPath(config.output);
  const start = Date.now();

  let importMaps = {};
  // 构建模块
  const libBundleName = await watch(config.modules, config.output, {}, config.mode);
  if (config.modules && config.mode !== 'lib') {
    importMaps = Object.keys(config.modules).reduce((prev, cur) => ({ ...prev, [`${cur}`]: `/${cur}.js` }), {});
  }
  const publicPath = `${'http'}://${config.devServe.host}:${config.devServe.port}`;
  await setBrickingJson(importMaps, [], `${publicPath}/${libBundleName}`);

  // 构建应用
  if (config.bootstrap && config.html) {
    await watch({ 'browse-entry': config.bootstrap }, config.output, importMaps, 'app');
    await setHtml(importMaps, '/browse-entry.js');
  }
  if (config.devServe.open) {
    const url = /^http/.test(config.devServe.open)
      ? config.devServe.open
      : `${'http'}://${config.devServe.host}:${config.devServe.port}/${config.devServe.open.replace(/^\//, '')}`;
    openBrowser(url);
  }
  const now = Date.now();
  logs.keepLog(`[⌛️speed]: ${((now - start) / 1000).toFixed(2)}s`);
}
