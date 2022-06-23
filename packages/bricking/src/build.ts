import rollup from 'rollup';
import * as path from 'path';
import alias from '@rollup/plugin-alias';
import bundleStyle from '@bricking/plugin-style';
import { btkDom, btkPath } from '@bricking/toolkit';
import livereload from 'rollup-plugin-livereload';
import { relativeUrl } from './plugins/postcss-relative-url';
import rollupUrl from './plugins/rollup-url';
import config, { tsConfig, workspace } from './config';
import { openBrowser, startServe } from './server';

// 添加 postcss-relative-url 插件
// @ts-ignore
config.style.postcss.plugins.push(relativeUrl({
    // @ts-ignore
    cssOutput: path.dirname(path.resolve(config.output, config.style.filename)),
    assetsOutput: config.assets.output,
    limit: config.assets.limit,
    filename: config.assets.filename,
    loadPaths: config.assets.loadPaths
}));

const getBasePackageJson = () => {
    const modulePath = btkPath.findModulePath(config.basePackage.name);
    return require(`${modulePath}${path.sep}package.json`);
}

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
}

/**
 * 获取外部依赖列表
 * @returns
 */
const getExternals = () => {
    const basePackageJson = getBasePackageJson();
    const peerDependencies = Object.keys(basePackageJson.peerDependencies).reduce((prev, cur) => {
        prev[cur.replace(/^@types\//, '')] = true;
        return prev;
    }, {});
    return Object.keys(peerDependencies);
}

/**
 * 获取通用插件列表
 * @returns
 */
const commonPlugin = () => ([
    require('@rollup/plugin-node-resolve').default(),
    require('@rollup/plugin-commonjs')(),
    alias({ entries: getAliasEntries() }),
    // 打包样式文件
    bundleStyle(config.style),
    // 处理文件
    rollupUrl({
        limit: config.assets.limit,
        destDir: config.assets.output,
        include: config.assets.include,
        exclude: config.assets.exclude,
        fileName: config.assets.filename,
        emitFiles: true,
    }),
    // 字符串模板替换
    require('@rollup/plugin-replace')({
        values: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        },
        preventAssignment: true,
    }),
    // 编译 ts
    require('@rollup/plugin-typescript')({
        tsconfig: tsConfig,
    }),
]);

/**
 * 构建任务
 * @param entry
 * @param output 
 * @param importMaps 
 */
const build = async (entry: string | Record<string, string>, output: string,  importMaps?: Record<string, string>) => {
    const bundle = await rollup.rollup({
        preserveEntrySignatures: "exports-only",
        context: 'window',
        input: entry,
        external: [
            ...Object.keys(importMaps || {}),
            ...getExternals(),
        ],
        plugins: [
            // 通用插件
            ...commonPlugin(),
            // 自定义插件
            ...(config.plugins || []),
            // 压缩
            require('rollup-plugin-terser').terser({ format: {comments: false }}),
        ],
    });
    const rollupOutput = await bundle.generate({
        dir: output,
        format: 'systemjs',
        entryFileNames: '[name]-[hash].js',
        sourcemap: true,
    })
    return {
        bundle,
        rollupOutput
    }
}

/**
 * 检测变化实时构建
 * @param entry
 * @param output 
 * @param importMaps 
 * @returns 
 */
const watch =  (entry: string | Record<string, string>, output: string, importMaps?: Record<string, string>) => {
    const watcher = rollup.watch({
        preserveEntrySignatures: "exports-only",
        context: 'window',
        input: entry,
        external: [
            ...Object.keys(importMaps || {}),
            ...getExternals(),
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
            })
        ],
        output: {
            dir: output,
            format: 'systemjs',
            entryFileNames: '[name].js',
            sourcemap: true,
        },
        watch: {
            buildDelay: 300,
            exclude: ['node_modules/**']
        },
    });
    return new Promise<void>((resolve) => {
        watcher.on('event', (event) => {
            if (event.code === 'BUNDLE_END') {
                event.result.close();
            }
            if (event.code === 'END') {
                resolve();
            }
        });
    })
}

export async function runBuild() {
    const { rollupOutput } = await build(config.entry, config.output);
    const entryChunks = rollupOutput.output.filter(chunk => chunk.type =='chunk' && chunk.isEntry);
    const importMaps = entryChunks.reduce((prev, cur) => {
        prev[`@module/${cur.name}`] = `./${cur.fileName}`;
        return prev;
    }, {});
    const { rollupOutput: debugRollupOut } = await build(config.debugEntry, config.output, importMaps);
    const debugEntryChunk = debugRollupOut.output.find(chunk => chunk.type === 'chunk' && chunk.isEntry);
    const { remoteEntry } = getBasePackageJson();
    /**
     * 输出 html 文件
     */
    btkDom.injectScripts(btkDom.getIndexDom(), [
        {
            url: remoteEntry,
            type: 'javascript'
        },
        {
            content: JSON.stringify({ imports: importMaps }),
            type: 'systemjs-importmap',
        },
        {
            // @ts-ignore
            url: config.publicPath ? new URL(debugEntryChunk.fileName, config.publicPath).href : `./${debugEntryChunk.fileName}`,
            type: 'systemjs-module'
        }
    ], config.output);
}
export async function runServe() {
    await startServe(config.devServe as any, config.output);
    openBrowser(`http://${config.devServe.host}:${config.devServe.port}${config.devServe.open}`);
}
export async function runStart() {
    await watch(config.entry, config.output);
    const importMaps = Object.keys(config.entry).reduce((prev, cur) => ({ ...prev, [`@module/${cur}}`]: `${cur}.js`}), {});
    await watch({ 'debug-entry': config.debugEntry }, config.output, importMaps);
    const { remoteEntry } = getBasePackageJson();
    btkDom.injectScripts(btkDom.getIndexDom(), [
        {
            url: remoteEntry,
            type: 'javascript'
        },
        {
            content: JSON.stringify({ imports: importMaps }),
            type: 'systemjs-importmap',
        },
        {
            url: `./debug-entry.js`,
            type: 'systemjs-module'
        }
    ], config.output);
    await runServe()
}

