import path from 'path'
import importCwd from 'import-cwd'
import postcss from 'postcss'
import findPostcssConfig from 'postcss-load-config'
import { identifier } from 'safe-identifier'
import humanlizePath from './utils/humanlize-path'
import normalizePath from './utils/normalize-path'
import { getSafeId } from './utils/safe-id'


function loadConfig(id, { ctx: configOptions, path: configPath }) {
  const handleError = err => {
    if (!err.message.includes('No PostCSS Config found')) {
      throw err
    }

    // Return empty options for PostCSS
    return {}
  }

  configPath = configPath ? path.resolve(configPath) : path.dirname(id)
  const ctx: any = {
    file: {
      extname: path.extname(id),
      dirname: path.dirname(id),
      basename: path.basename(id)
    },
    options: configOptions || {}
  }

  return findPostcssConfig(ctx, configPath).catch(handleError)
}

function escapeClassNameDashes(string) {
  return string.replace(/-+/g, match => {
    return `$${match.replace(/-/g, '_')}$`
  })
}

function ensureClassName(name) {
  name = escapeClassNameDashes(name)
  return identifier(name, false)
}

function ensurePostCSSOption(option) {
  return typeof option === 'string' ? importCwd(option) : option
}

function isModuleFile(file) {
  return /\.module\.[a-z]{2,6}$/.test(file)
}

/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */
export default {
  name: 'postcss',
  alwaysProcess: true,
  async process({ code, map }) {
    const { options, id } = this;
    const { inject, relativeBase, combineExtract } = options;
    const config = options.config ? await loadConfig(id, options.config) : {} as any;

    const plugins = [ ...(options.postcss.plugins || []), ...(config.plugins || [])];

    const injectLink = options.inject.type === 'link';
    const injectInline = options.inject.type === 'inline';

    // css 模块化对象
    const modulesExported = {};
    
    const shouldModules = (options.autoModules !== false && isModuleFile(this.id)) || options.modules;
    
    // 如果开启需要开启 css modules，将插件放到列表头部
    if (shouldModules) {
      plugins.unshift(
        require('postcss-modules')({
          generateScopedName: process.env.ROLLUP_POSTCSS_TEST ? '[name]_[local]' : '[name]_[local]__[hash:base64:5]',
          ...options.modules,
          getJSON(filepath, json, outpath) {
            modulesExported[filepath] = json
            if (
              typeof options.modules === 'object' &&
              typeof options.modules.getJSON === 'function'
            ) {
              return options.modules.getJSON(filepath, json, outpath)
            }
          }
        })
      )
    }
    // 初始化 postcss 配置
    const postcssOptions = {
      ...this.options.postcss,
      ...config.options,
      to: options.output ? path.resolve(options.output, path.parse(this.id).base) : this.id,
      from: this.id,
      map: (!!this.sourceMap) && (injectLink ? { inline: false, annotation: false, sourcesContent: true } : { inline: true, annotation: false, sourcesContent: true })
    }
    delete postcssOptions.plugins;

    postcssOptions.parser = ensurePostCSSOption(postcssOptions.parser)
    postcssOptions.syntax = ensurePostCSSOption(postcssOptions.syntax)
    postcssOptions.stringifier = ensurePostCSSOption(postcssOptions.stringifier)

    if (map && postcssOptions.map) {
      postcssOptions.map.prev = typeof map === 'string' ? JSON.parse(map) : map
    }

    if (plugins.length === 0) {
      const noopPlugin = () => ({ postcssPlugin: 'postcss-noop-plugin', Once() { } })
      plugins.push(noopPlugin());
    }

    const result = await postcss(plugins).process(code, postcssOptions)

    // 添加依赖文件
    for (const message of result.messages) {
      if (message.type === 'dependency') {
        this.dependencies.add(message.file)
      }
    }
    // 添加警告信息
    for (const warning of result.warnings()) {
      // @ts-ignore
      if (!warning.message) {
        // @ts-ignore
        warning.message = warning.text
      }
      this.warn(warning)
    }
    // 处理 sourceMap
    const outputMap = result.map && JSON.parse(result.map.toString())
    if (outputMap && outputMap.sources) {
      outputMap.sources = outputMap.sources.map(v => normalizePath(v))
    }

    let output = ''
    let extracted

    // 自定义命名导出
    if (options.namedExports) {
      const json = modulesExported[this.id]
      const getClassName =
        typeof options.namedExports === 'function' ?
          options.namedExports :
          ensureClassName
      for (const name in json) {
        const newName = getClassName(name)
        if (name !== newName && typeof options.namedExports !== 'function') {
          this.warn(
            `Exported "${name}" as "${newName}" in ${humanlizePath(this.id)}`
          )
        }
        if (!json[newName]) {
          json[newName] = json[name]
        }
        output += `export var ${newName} = ${JSON.stringify(json[name])};\n`
      }
    }

    const cssVariableName = identifier('css', true);
    const chunkName = `${relativeBase}${getSafeId(result.css, path.parse(this.id).name)}.css`;
    if (injectLink) {
      if (!combineExtract) {
        // 使用相对路径插入 css link
        output += inject.injectCode({relativeUrl: chunkName, id: chunkName, type: 'link' });
      }
      // 默认导出模块化对象，不管有没有使用 css 模块
      output += `export default ${JSON.stringify(modulesExported[this.id])};`;
      // 定义导出的css文件信息
      extracted = { id: this.id, code: result.css, map: outputMap, chunkName }
    } else if (injectInline) {
      // 如果开启模块化，默认导出模块化对象，否则导出css变量
      const module = shouldModules ? JSON.stringify(modulesExported[this.id]) : cssVariableName;
      // 定义css变量 (css 实际内容的字符串)  
      output += `var ${cssVariableName} = ${JSON.stringify(result.css)};\n`;
      // 将css内容通过内联方式插入文档
      output += inject.injectCode({ cssVariableName, id: chunkName, type: 'inline' });
      // 定义默认导出
      output += `export default ${module};\n`;
      output += `export var stylesheet=${JSON.stringify(result.css)};\n`
    }

    return {
      code: output,
      map: outputMap,
      extracted
    }
  }
}
