(function (g) {
    var import_maps = {}, dynamic_module_maps = {}, meta_data_maps = {}, orgResolve = System.constructor.prototype.resolve, orgInstantiate = System.constructor.prototype.instantiate, orgCreateContext = System.constructor.prototype.createContext, cssLinkModulePattern = /^___INJECT_STYLE_LINK___/;
    function getVarRegister(m) {
        return [[], (_export) => ({ setters: [], execute: () => { _export(m); } })];
    }
    ;
    System.constructor.prototype.createContext = function (parentId) {
        var meta = orgCreateContext.call(this, parentId) || {};
        if (meta_data_maps[parentId]) {
            meta.data = meta_data_maps[parentId];
            delete meta_data_maps[parentId];
        }
        return meta;
    };
    System.constructor.prototype.resolve = function (id, parentURL) {
        var finalUrl = null;
        if (import_maps[id]) {
            finalUrl = orgResolve.call(this, import_maps[id], parentURL);
        }
        else if (dynamic_module_maps[id] || cssLinkModulePattern.test(id)) {
            return id;
        }
        else {
            finalUrl = orgResolve.call(this, id, parentURL);
        }
        if (meta_data_maps[id] && id !== finalUrl) {
            meta_data_maps[finalUrl] = meta_data_maps[id];
            delete meta_data_maps[id];
        }
        return finalUrl;
    };
    System.constructor.prototype.instantiate = function (url, firstParentUrl) {
        if (dynamic_module_maps && dynamic_module_maps[url]) {
            return new Promise(function (resolve, reject) {
                if (typeof dynamic_module_maps[url] === 'function') { // 异步模块
                    dynamic_module_maps[url]().then((m) => resolve(getVarRegister(m))).catch(reject);
                }
                else { // 同步模块
                    resolve(getVarRegister(dynamic_module_maps[url]));
                }
            });
        }
        if (cssLinkModulePattern.test(url)) {
            return new Promise(function (resolve) {
                var splits = url.split('?link=');
                if (splits[1]) {
                    var href = new URL(splits[1], firstParentUrl).href;
                    if (!document.querySelector(`link[href="${href}"]`)) {
                        var linkEl = document.createElement('link');
                        linkEl.href = href;
                        linkEl.type = "text/css";
                        linkEl.rel = "stylesheet";
                        document.head.append(linkEl);
                        linkEl.onload = function () {
                            resolve(getVarRegister({}));
                        };
                        linkEl.onerror = function () {
                            console.error(new Error(`${href} 加载失败～`));
                            resolve(getVarRegister({ url: href }));
                        };
                    }
                }
                else {
                    resolve(getVarRegister({ url }));
                }
            });
        }
        return orgInstantiate.call(this, url, firstParentUrl);
    };
    g['$_systemjs_tools_'] = {
        obj(maps = {}, force = true) {
            Object.keys(maps).forEach(name => {
                if (force || !dynamic_module_maps[name]) {
                    var module = maps[name];
                    if (module) {
                        if (typeof module === 'object' && !('default' in module)) {
                            module.default = Object.assign({}, module);
                        }
                        dynamic_module_maps[name] = module;
                    }
                }
            });
        },
        url(maps = {}, force = true) {
            Object.keys(maps).forEach(name => {
                if (force || !import_maps[name]) {
                    import_maps[name] = maps[name];
                }
            });
        },
        setMeta(id, data) {
            if (typeof id === 'string' && typeof data === 'object') {
                meta_data_maps[id] = data;
            }
            else {
                console.warn("setMeta error~");
            }
        }
    };
})(window);
