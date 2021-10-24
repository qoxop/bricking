import { AcceptedPlugin, SourceMapOptions } from 'postcss';
import { Chunk, Loader, LoaderContext } from './types';
export declare type PostcssLoaderOptions = {
    output: string;
    stylesRelative?: string;
    assetsRelative?: string;
    injectStyle?: boolean | Object;
    plugins?: AcceptedPlugin[];
    syntax?: any;
    parser?: any;
    stringifier?: any;
    map?: boolean | SourceMapOptions;
    config?: false | string;
    modules?: {
        auto?: boolean;
        force?: boolean;
        namedExports?: boolean | Function;
        [key: string]: any;
    };
};
export declare class PostcssLoader extends Loader<PostcssLoaderOptions> {
    name: string;
    alwaysProcess: boolean;
    extensions: string[];
    process(chunk: Chunk, context: LoaderContext): Promise<Chunk>;
}
