import  * as path from "path";
import { BrickingOptions } from "./typing";

const absolutely = (p: string|undefined, def: string) => {
    if (!p) {
        return path.resolve(process.cwd(), def);
    }
    if (path.isAbsolute(p)) {
        return p;
    }
    return path.resolve(process.cwd(), p);
}

const isDev = process.env.NODE_ENV === 'DEV';

export function defineBricking(options: BrickingOptions): Required<BrickingOptions> {
    options.output = absolutely(options.output, 'dist');
    options.minimize = options.minimize ?? !isDev;
    options.style = {
        filename: 'bundle-[hash].css',
        sourceMap: true,
        ...options.style,
        postcss: {
            minify: options.style?.postcss?.minify ?? true,
            module: options.style?.postcss?.module ?? 'auto',
            moduleOptions: options.style?.postcss?.moduleOptions ?? {},
            plugins: [
                ...(options.style?.postcss?.plugins || []),
            ]
        },
    };
    options.assets = {
        limit: 1024 *  8,
        output: absolutely(options.output, 'dist/assets'),
        filename: `[hash][extname]`,
        loadPaths:  options.assets?.loadPaths ?? [],
        ...options.assets,
    };
    options.devServe = {
        port: 3000,
        host: 'localhost',
        open: '/',
        ...options.devServe,
    }
    options.plugins = options.plugins ?? [];
    if (!options.entry || !Object.keys(options.entry).length) {
        throw new Error('options.entry is require~');
    }
    if (!options.debugEntry && isDev) {
        throw new Error('options.debugEntry is require~');
    }
    if (!(
        (typeof options.basePackage === 'string'  && options.basePackage) ||
        // @ts-ignore
        (options.basePackage?.name && options.basePackage?.version)
    )) {
        throw new Error('options.basePackage is require~');
    }
    return options as any;
}