/// <reference types="less" />
import { Chunk, Loader, LoaderContext } from './types';
export declare class LessLoader extends Loader<Less.Options> {
    name: string;
    alwaysProcess: boolean;
    extensions: string[];
    process(chunk: Chunk, context: LoaderContext): Promise<Chunk>;
}
