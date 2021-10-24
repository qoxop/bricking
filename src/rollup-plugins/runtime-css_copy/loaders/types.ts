import path from 'path';
import { TransformPluginContext } from 'rollup';

export type LoaderContext = {
    id: string;
    sourceMap: string | Object | boolean;
    dependencies: Set<string>;
    assets: Map<string, any>;
    warn: Function;
    rollupPlugin: TransformPluginContext
}
export type ExtractedInfo = {
    id: string;
    code: string;
    map?: any;
    chunkName: string
}
export type Chunk = {
    code: string;
    map?: any;
    extracted?: ExtractedInfo;
}

export class Loader<T = any> {
    name: string;
    options: T;
    alwaysProcess: boolean;
    extensions: string[];
    constructor(options: T) {
        this.options = options;
    }
    test(filepath: string): boolean {
        return this.extensions.includes(path.extname(filepath))
    }
    process(chunk: Chunk, context: LoaderContext):Promise<Chunk> {
        return Promise.resolve(chunk);
    };
}