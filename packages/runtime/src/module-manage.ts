/* eslint-disable func-names */
/* eslint-disable no-undef */
/// <reference types="systemjs" />
import 'systemjs/dist/system.js';

const isAsyncFlag = 'Symbol' in window ? Symbol('is_async_flag') : '$__is_async_flag__';

/** 拓展 systemjs 的 import-maps */
const IMPORT_MAPS:TImportMaps = {};

/** 自定义模块配置 */
const CUSTOM_MODULE_MAPS:TCustomModuleMaps = {};

/** 元数据暂存对象 */
const META_DATA_MAPS:TMetaDataMaps = {};

/** 原始的模块ID处理函数 */
const ORIGIN_RESOLVE = System.constructor.prototype.resolve;

/** 原始的模块安装器 */
const ORIGIN_INSTANTIATE = System.constructor.prototype.instantiate;

/** 原始的模块元数据生产函数 */
const ORIGIN_CREATE_CONTEXT = System.constructor.prototype.createContext;

/** Link 模式引入的 css 模块正则  */
const CSS_LINK_MODULE_PATTERN = /^___INJECT_STYLE_LINK___/;

/** Link 模式引入的 css 模块标识 */
const CSS_LINK_MODULE_STRING = '___INJECT_STYLE_LINK___';

function getVarRegister(m: unknown) {
  return [[], (_export: Function) => ({ setters: [], execute: () => { _export(m); } })];
}

if (!System) {
  throw new Error('System 对象不存在，请提前引入 systemjs～');
}

// 自定义元数据创建钩子
System.constructor.prototype.createContext = function (parentId: string) {
  const meta = ORIGIN_CREATE_CONTEXT.call(this, parentId) || {};
  if (META_DATA_MAPS[parentId]) {
    meta.data = META_DATA_MAPS[parentId];
    delete META_DATA_MAPS[parentId];
  }
  return meta;
};

// 自定义 模块 id 处理钩子
System.constructor.prototype.resolve = function (id: string, parentURL?: string) {
  let finalUrl = '';
  if (IMPORT_MAPS[id]) {
    finalUrl = ORIGIN_RESOLVE.call(this, IMPORT_MAPS[id], parentURL);
  } else if (CUSTOM_MODULE_MAPS[id] || CSS_LINK_MODULE_PATTERN.test(id)) {
    return id;
  } else {
    finalUrl = ORIGIN_RESOLVE.call(this, id, parentURL);
  }
  if (META_DATA_MAPS[id] && id !== finalUrl) {
    META_DATA_MAPS[finalUrl] = META_DATA_MAPS[id];
    delete META_DATA_MAPS[id];
  }
  return finalUrl;
};
// 自定义模块安装钩子
System.constructor.prototype.instantiate = function (url: string, firstParentUrl?: string) {
  if (CUSTOM_MODULE_MAPS && CUSTOM_MODULE_MAPS[url]) {
    return new Promise((resolve, reject) => {
      if (CUSTOM_MODULE_MAPS[url][isAsyncFlag]) { // 异步模块
        CUSTOM_MODULE_MAPS[url]().then((m: any) => resolve(getVarRegister(m))).catch(reject);
      } else { // 同步模块
        resolve(getVarRegister(CUSTOM_MODULE_MAPS[url]));
      }
    });
  }
  if (CSS_LINK_MODULE_PATTERN.test(url)) {
    return new Promise((resolve) => {
      const splits = url.split('?link=');
      if (splits[1]) {
        const { href } = new URL(splits[1], firstParentUrl);
        if (!document.querySelector(`link[href="${href}"]`)) {
          const linkEl = document.createElement('link');
          linkEl.href = href;
          linkEl.type = 'text/css';
          linkEl.rel = 'stylesheet';
          document.head.append(linkEl);
          linkEl.onload = () => {
            resolve(getVarRegister({}));
          };
          linkEl.onerror = () => {
            console.error(new Error(`${href} 加载失败～`));
            resolve(getVarRegister({ url: href }));
          };
        }
      } else {
        resolve(getVarRegister({ url }));
      }
    });
  }
  return ORIGIN_INSTANTIATE.call(this, url, firstParentUrl);
};

const register = {
  /** 注入自定义模块 */
  set(maps:TCustomModuleMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !CUSTOM_MODULE_MAPS[name]) {
        const module = maps[name];
        if (module) {
          if (typeof module === 'object' && !('default' in module)) {
            module.default = { ...module };
          }
          CUSTOM_MODULE_MAPS[name] = module;
        }
      }
    });
  },
  setDynamic(maps: TDynamicModuleMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !CUSTOM_MODULE_MAPS[name]) {
        const module = maps[name];
        if (module) {
          module[isAsyncFlag] = true;
          CUSTOM_MODULE_MAPS[name] = module;
        }
      }
    });
  },
  /** 拓展 systemjs 的 import map  */
  extendImportMaps(maps:TImportMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !IMPORT_MAPS[name]) {
        IMPORT_MAPS[name] = maps[name];
      }
    });
  },
  /** 加载模块前为该模块设置 meta 数据 */
  setMetadata(id: string, data:Record<string, any>) {
    if (typeof id === 'string' && typeof data === 'object') {
      META_DATA_MAPS[id] = data;
    } else {
      console.warn('setMeta error~');
    }
  },
};

export default Object.freeze({
  ...register,
  CSS_LINK_MODULE_PATTERN,
  CSS_LINK_MODULE_STRING,
});
