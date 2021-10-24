import { TransformPluginContext } from 'rollup';
export declare type LoaderContext = {
    id: string;
    sourceMap: string | Object | boolean;
    dependencies: Set<string>;
    warn: Function;
    rollupPlugin: TransformPluginContext;
};
export declare type ExtractedInfo = {
    id: string;
    code: string;
    map?: any;
    hash: string;
};
export declare type Chunk = {
    code: string;
    map?: any;
    extracted?: ExtractedInfo;
};
export declare abstract class Loader<T = any> {
    options: T;
    abstract name: string;
    abstract alwaysProcess: boolean;
    abstract extensions: string[];
    constructor(options: T);
    test(filepath: string): boolean;
    abstract process(chunk: Chunk, context: LoaderContext): Promise<Chunk>;
}
