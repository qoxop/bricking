import path from 'path';
import { TransformPluginContext } from 'rollup';

export type LoaderContext = {
    id: string;
    sourceMap: string | Object | boolean;
    dependencies: Set<string>;
    warn: Function;
    rollupPlugin: TransformPluginContext
}
export type ExtractedInfo = {
    id: string;
    code: string;
    map?: any;
    hash: string
}
export type Chunk = {
    code: string;
    map?: any;
    extracted?: ExtractedInfo;
}

export abstract class Loader<T = any> {
    options: T;
    abstract name: string;
    abstract alwaysProcess: boolean;
    abstract extensions: string[];
    constructor(options: T) {
        this.options = options;
    }
    test(filepath: string): boolean {
        return this.extensions.includes(path.extname(filepath))
    }
    abstract process(chunk: Chunk, context: LoaderContext):Promise<Chunk>;
}
