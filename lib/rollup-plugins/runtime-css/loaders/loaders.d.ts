/// <reference types="less" />
import { PostcssLoaderOptions } from './postcss-loader';
import { Chunk, Loader, LoaderContext } from './types';
export declare type LoadersConfig = {
    name: 'less';
    options?: Less.Options;
} | {
    name: 'postcss';
    options?: PostcssLoaderOptions;
} | {
    name: string;
    options?: PostcssLoaderOptions;
} | {
    loader: typeof Loader;
    options?: any;
};
export default class Loaders {
    loaders: Loader[];
    constructor(loaders: LoadersConfig[]);
    getLoader: (name: string) => Loader<any>;
    isSupported: (filepath: string) => boolean;
    removeLoader: (name: string) => Loader<any>[];
    add(at: 'before' | 'after', name: string | null, newLoader: Loader): void;
    addBefore(name: string | null, newLoader: Loader): void;
    addAfter(name: string | null, newLoader: Loader): void;
    process(chunk: Chunk, context: LoaderContext): Promise<Chunk>;
}
