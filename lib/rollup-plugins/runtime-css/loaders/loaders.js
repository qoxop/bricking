"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const less_loader_1 = require("./less-loader");
const postcss_loader_1 = require("./postcss-loader");
class Loaders {
    constructor(loaders) {
        this.loaders = [];
        this.getLoader = (name) => this.loaders.find((loader) => loader.name === name);
        this.isSupported = (filepath) => this.loaders.some((loader) => loader.test(filepath));
        this.removeLoader = (name) => (this.loaders = this.loaders.filter((loader) => loader.name !== name));
        const LoaderMap = {
            'less': less_loader_1.LessLoader,
            'postcss': postcss_loader_1.PostcssLoader,
        };
        this.loaders = loaders.map(item => {
            const My_Loader = ('name' in item) ? LoaderMap[item.name] : item.loader;
            return new My_Loader(item.options);
        });
    }
    add(at, name, newLoader) {
        if (this.getLoader(newLoader.name)) {
            this.removeLoader(newLoader.name);
        }
        if (name !== null) {
            const loaders = [];
            this.loaders.forEach((loader) => {
                if (at === 'before')
                    loaders.push(newLoader);
                loaders.push(loader);
                if (at === 'after')
                    loaders.push(newLoader);
            });
            this.loaders = loaders;
        }
        else {
            this.loaders.push(newLoader);
        }
    }
    addBefore(name, newLoader) {
        this.add('before', name, newLoader);
    }
    addAfter(name, newLoader) {
        this.add('after', name, newLoader);
    }
    async process(chunk, context) {
        let nextChunk = chunk;
        for await (const loader of this.loaders) {
            if (loader.test(context.id) || loader.alwaysProcess) {
                nextChunk = await loader.process(nextChunk, context);
            }
        }
        return nextChunk;
    }
}
exports.default = Loaders;
