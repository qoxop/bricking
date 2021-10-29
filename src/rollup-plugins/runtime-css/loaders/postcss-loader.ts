import fs from 'fs';
import path from 'path';
import importCwd from 'import-cwd';
import findPostcssConfig from 'postcss-load-config';
import { identifier } from 'safe-identifier';
import postcss, { AcceptedPlugin,SourceMapOptions } from 'postcss';
import { Chunk, ExtractedInfo, Loader, LoaderContext } from './types';
import { getHash } from '../../../utils/hash';

export type PostcssLoaderOptions = {
    output:string;
    stylesRelative?: string;
    assetsRelative?: string;
    injectStyle?: boolean | Object;
    plugins?: AcceptedPlugin[];
    syntax?: any;
    parser?: any;
    stringifier?: any;
    map?: boolean | SourceMapOptions;
    config?: false | string;
    modules?: {
        auto?: boolean;
        force?: boolean;
        namedExports?: boolean | Function;
        [key: string]: any;
    }
}

const ensurePostCSSOption = (option: any) => typeof option === 'string' ? importCwd(option) : option;

const isModuleFile = (file: string) => (/\.module\.[a-z]{2,6}$/.test(file));

function escapeClassNameDashes(string) {
    return string.replace(/-+/g, match => {
        return `$${match.replace(/-/g, '_')}$`
    })
}

function ensureClassName(name) {
    name = escapeClassNameDashes(name)
    return identifier(name, false)
}

function loadConfig(config: PostcssLoaderOptions['config']) {
    if (config) {
        if (!fs.existsSync(config)) {
            config = path.join(process.cwd(), config);
        }
        return findPostcssConfig({}, config).catch((err) => {
            if (!err.message.includes('No PostCSS Config found')) {
                throw err
            }
            return {} as any
        })
    }
    return Promise.resolve({} as any);
}

export class PostcssLoader extends Loader<PostcssLoaderOptions> {
    name: string = 'postcss';
    alwaysProcess: boolean = true;
    extensions: string[] = ['.less', '.css'];
    async process(chunk: Chunk, context: LoaderContext):Promise<Chunk> {
        // 参数初始化
        const {
            output,
            stylesRelative = '',
            assetsRelative = '',
            plugins = [],
            config: configPath,
            injectStyle = false,
            modules = { force: false, auto: true, namedExports: true },
            ...othersOptions
        } = this.options;
        const config = await loadConfig(configPath);
        const { force, auto, namedExports, ...modulesOptions } = modules;
        const useModules = force || (auto && isModuleFile(context.id))
        const modulesExported = {}; // css 模块化对象

        // 处理插件列表
        const usePlugins = [
            ...plugins,
            ...(config.plugins || []),
            // 处理 url
            require('postcss-url')({ url: 'copy', assetsPath: path.join(output, assetsRelative), useHash: true })
        ];
        if (useModules) {
            // css module
            usePlugins.unshift(require('postcss-modules')({
                generateScopedName: '[name]_[local]__[hash:base64:5]',
                ...modulesOptions,
                getJSON(filepath: string, json: any, outpath: string) {
                    modulesExported[filepath] = json;
                    if (typeof modulesOptions?.getJSON === 'function') {
                        modulesOptions.getJSON(filepath, json, outpath)
                    }
                }
            }))
        }
        // 处理配置对象
        const postcssOptions = {
            ...othersOptions,
            ...(config.options || {}),
            to: path.join(output, path.parse(context.id).base),
            from: context.id,
        }
        postcssOptions.parser = ensurePostCSSOption(postcssOptions.parser);
        postcssOptions.syntax = ensurePostCSSOption(postcssOptions.syntax);
        postcssOptions.stringifier = ensurePostCSSOption(postcssOptions.stringifier);

        // 设置 prev sourceMap
        if (chunk.map && postcssOptions.map) {
            postcssOptions.map.prev = typeof chunk.map === 'string' ? JSON.parse(chunk.map) : chunk.map
        }

        const result = await postcss(usePlugins).process(chunk.code, postcssOptions)
        // 添加依赖文件
        for (const message of result.messages) {
            if (message.type === 'dependency') context.dependencies.add(message.file);
        }
        // 添加警告信息
        for (const warning of result.warnings()) {
            if (!('message' in warning)) {
                (warning as any).message = warning.text
            }
            context.warn(warning);
        }
        // 处理 sourceMap
        const outputMap = result.map && JSON.parse(result.map.toString())
        // if (outputMap && outputMap.sources) {
        //     outputMap.sources = outputMap.sources.map(v => normalizePath(v))
        // }
        let code = '';
        const extracted: ExtractedInfo = {
            id: context.id,
            code: result.css,
            map: outputMap,
            hash: `${getHash(result.css, context.id)}`
        }
        if (namedExports) {
            const json = modulesExported[context.id];
            const getClassName = typeof namedExports === 'function' ? namedExports : ensureClassName
            for (const name in json) {
                const newName = getClassName(name)
                if (!json[newName]) {
                    json[newName] = json[name];
                }
                code += `export var ${newName} = ${JSON.stringify(json[name])};\n`
            }
        }
        
        if (!injectStyle) {
            return {
                code: code + `export default ${JSON.stringify(modulesExported[context.id])};`,
                extracted,
                map: outputMap,
            }
        }
        const injectOptions = typeof injectStyle === 'object' ? { ...injectStyle, stylesRelative, hash: extracted.hash } : { stylesRelative, hash: extracted.hash };
        const cssVariableName = identifier('css', true);
        const module = useModules ? JSON.stringify(modulesExported[context.id]) : cssVariableName;
        code = `import $__inject_styles from "bricking/lib/runtimes/inject-style";\n` + code;
        code += `var ${cssVariableName} = ${JSON.stringify(result.css)};\n`;
        code += `$__inject_styles(${cssVariableName}, ${JSON.stringify(injectOptions)});\n`;
        code += `export default ${module};\n`;
        return {
            code,
            map: outputMap,
        }
    };
}