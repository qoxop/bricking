import { Plugin } from 'rollup';
import { LoadersConfig } from './loaders/loaders';
declare type HandleMode = {
    inject: {
        type: 'style' | 'link';
        options?: any;
    };
} | {
    extracted: true;
};
declare type Options = HandleMode & {
    output: string;
    stylesRelative?: string;
    assetsRelative?: string;
    include?: any[];
    exclude?: any[];
    sourceMap?: boolean | "inline";
    useLoaders?: LoadersConfig[];
    postcss?: {
        syntax?: any;
        parser?: any;
        stringifier?: any;
        plugins?: any[];
        map?: any;
    };
    modules?: {
        auto: boolean;
        force: boolean;
        namedExports: boolean | Function;
        [key: string]: any;
    };
};
declare const _default: (options: Options) => Plugin;
export default _default;
