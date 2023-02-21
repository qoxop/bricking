/**
 * 扩展 Systemjs
 */
import 'systemjs/dist/s.min.js';

const isAsyncFlag = 'Symbol' in self ? Symbol('$async') : '$\0_is_async__';

/** 拓展 systemjs 的 import-maps */
const IMPORT_MAPS:TImportMaps = {};

/** 自定义模块配置 */
const CUSTOM_MODULE_MAPS:TCustomModuleMaps = {};

/** 元数据暂存对象 */
const META_DATA_MAPS:TMetaDataMaps = {};

const SystemPrototype = System.constructor.prototype;
/** 原始的模块ID处理函数 */
const ORIGIN_RESOLVE = SystemPrototype.resolve;

/** 原始的模块安装器 */
const ORIGIN_INSTANTIATE = SystemPrototype.instantiate;

/** 原始的模块元数据生产函数 */
const ORIGIN_CREATE_CONTEXT = SystemPrototype.createContext;

function getVarRegister(m: unknown) {
  return [[], (_export: Function) => ({ setters: [], execute: () => { _export(m); } })];
}

// 自定义元数据创建钩子
SystemPrototype.createContext = function (parentId: string) {
  const meta = ORIGIN_CREATE_CONTEXT.call(this, parentId) || {};
  if (META_DATA_MAPS[parentId]) {
    meta.data = META_DATA_MAPS[parentId];
    delete META_DATA_MAPS[parentId];
  }
  return meta;
};

// 自定义 模块 id 处理钩子
SystemPrototype.resolve = function (id: string, parentURL?: string) {
  if (CUSTOM_MODULE_MAPS[id]) return id;
  // 调用原始方法处理URL
  const finalUrl = IMPORT_MAPS[id] ? ORIGIN_RESOLVE.call(this, IMPORT_MAPS[id], parentURL) : ORIGIN_RESOLVE.call(this, id, parentURL);
  // 更新 metadata
  if (META_DATA_MAPS[id] && id !== finalUrl) {
    META_DATA_MAPS[finalUrl] = META_DATA_MAPS[id];
    delete META_DATA_MAPS[id];
  }
  return finalUrl;
};
// 自定义模块安装钩子
SystemPrototype.instantiate = function (url: string, firstParentUrl?: string) {
  // 处理自定义模块
  if (CUSTOM_MODULE_MAPS && CUSTOM_MODULE_MAPS[url]) {
    return new Promise((resolve, reject) => {
      if (CUSTOM_MODULE_MAPS[url][isAsyncFlag]) { // 异步模块
        CUSTOM_MODULE_MAPS[url]().then((m: any) => resolve(getVarRegister(m))).catch(reject);
      } else { // 同步模块
        resolve(getVarRegister(CUSTOM_MODULE_MAPS[url]));
      }
    });
  }
  // 处理 css 模块
  if (/(\.|\|)css$/.test(url)) { // 兼容非 .css 后缀的 css 文件
    return new Promise((resolve) => {
      const cssUrl = url.replace(/\|css$/, '');
      // 处理绝对路径和相对路径
      const cssHref = /^https?:\/\//.test(cssUrl) ? cssUrl : new URL(cssUrl, firstParentUrl).href;
      // 插入 link 元素
      if (!document.querySelector(`link[href="${cssHref}"]`)) {
        const linkEl = document.createElement('link');
        linkEl.href = cssHref;
        linkEl.type = 'text/css';
        linkEl.rel = 'stylesheet';
        linkEl.onload = () => {
          resolve(getVarRegister({ url: cssHref }));
        };
        linkEl.onerror = () => {
          console.error(new Error(`${cssHref} load failed ~`));
          resolve(getVarRegister({ url: cssHref }));
        };
        document.head.append(linkEl);
      } else {
        resolve(getVarRegister({ url: cssHref }));
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
          if (typeof module === 'object' && !('default' in module) && !Object.isFrozen(module)) {
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
    }
  },
};

const $bricking = Object.freeze({
  ...register,
  mm: register,
});

Object.defineProperty(self, '$bricking', {
  get() {
    return $bricking;
  },
});

export default $bricking;
