/**
 * 扩展 Systemjs
 */
import 'systemjs/dist/s.min.js';

type TPromiseFn<MT = any> = () => Promise<MT>;
type TImportMaps = Record<string, string>;
type TCustomModuleMaps = Record<string, any>;
type TDynamicModuleMaps = Record<string, TPromiseFn>;
type TMetaDataMaps = Record<string, any>;

const isAsyncFlag = 'Symbol' in window ? Symbol('$async') : '$\0_is_async__';

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

// TODO 移除兼容旧版本的代码
/** Link 模式引入的 css 模块正则  */
const CSS_LINK_MODULE_PATTERN = /^___INJECT_STYLE_LINK___\?link=/;
/** Link 模式引入的 css 模块标识 */
const CSS_LINK_MODULE_STRING = '___INJECT_STYLE_LINK___';

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
  // TODO 移除兼容旧版本的代码
  if (CUSTOM_MODULE_MAPS[id] || CSS_LINK_MODULE_PATTERN.test(id) || CSS_LINK_MODULE_STRING === id) return id;
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
      // TODO 移除兼容旧版本的代码
      const cssUrl = CSS_LINK_MODULE_PATTERN.test(url) ? url.split('?link=')[1].replace(/\|css$/, '') : url.replace(/\|css$/, '');
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
  // TODO 移除兼容旧版本的代码
  if (CSS_LINK_MODULE_STRING === url) {
    return new Promise((resolve) => {
      resolve(getVarRegister({ }));
    });
  }
  return ORIGIN_INSTANTIATE.call(this, url, firstParentUrl);
};

// TODO 移除兼容旧版本的代码
const mm = {
  /**
   * 注入自定义模块
   */
  set(maps:TCustomModuleMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !CUSTOM_MODULE_MAPS[name]) {
        if (maps[name]) {
          CUSTOM_MODULE_MAPS[name] = maps[name];
        }
      }
    });
  },
  /**
   * 查询单个自定义模块
   */
  get(name: string) {
    return CUSTOM_MODULE_MAPS[name] || IMPORT_MAPS[name];
  },
  /**
   * 获取当前的模块映射
   */
  getAll: () => ({ CUSTOM_MODULE_MAPS, IMPORT_MAPS, META_DATA_MAPS }),
  /**
   * 注入动态模块
   */
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
  /**
   * 拓展 systemjs 的 importmap
   */
  extendImportMaps(maps:TImportMaps, force = true) {
    Object.keys(maps).forEach((name) => {
      if (force || !IMPORT_MAPS[name]) {
        IMPORT_MAPS[name] = maps[name];
      }
    });
  },
  /**
   * 加载模块前为该模块设置 meta 数据
   */
  setMetadata(id: string, data:Record<string, any>) {
    if (typeof id === 'string' && typeof data === 'object') {
      META_DATA_MAPS[id] = data;
    }
  },
  /**
   * 提供给 webpack 模块联邦调用的方法
   * - https://webpack.js.org/concepts/module-federation/#promise-based-dynamic-remotes
   */
  createFederationModule(key) {
    return new Promise<any>((resolve) => {
      System.import(key).then((m) => {
        resolve({
          get(k) {
            if (k === '.') return () => m;
            // 全路径尝试
            const sub = `${key}${k.replace('.', '')}`;
            if (CUSTOM_MODULE_MAPS[sub]) return System.import(sub).then((subM) => () => subM);
            // 二层路径尝试
            const sSubArr = sub.split('/');
            if (sSubArr.length > 2) {
              const sSub = sSubArr.slice(0, 2).join('/');
              if (CUSTOM_MODULE_MAPS[sSub]) return System.import(sSub).then((subM) => () => subM[sSubArr.slice(2).join('/')]);
            }
            // 尝试从子字段中尝试
            return () => m[k.replace('./', '')];
          },
          init() {
            return m;
          },
        });
      });
    });
  },
  /** 加载 css 文件 */
  addCssLink(links: string[], parentUrl?: string) {
    return Promise.all(
      links
        .map((item) => (/^https?:/.test(item) || !parentUrl ? item : new URL(item, parentUrl).href))
        .map((item) => (new Promise<void>((resolve) => {
          const el = document.createElement('link');
          el.rel = 'stylesheet';
          el.href = item;
          el.onload = () => resolve();
          el.onerror = () => resolve();
          document.head.append(el);
        }))),
    );
  },
};

const bricking = Object.freeze({
  mm,
  ...mm,
});
if (!(window as any).$bricking) {
  Object.defineProperty(window, '$bricking', {
    get() {
      return bricking;
    },
  });
}
export type TBricking = typeof bricking;
export default bricking;
