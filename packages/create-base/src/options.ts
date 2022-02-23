import { Configuration } from "webpack-dev-server";

type PartialAll<T> = {
    [P in keyof T]?:  T[P] extends {} ? Partial<T[P]> : T[P];
};

const deepMerge = (origin, target, deep = 1) => {
    if (origin) {
        Object.keys(target).forEach(key => {
            if (deep < 2 || !origin[key] || typeof Object[key] !== 'object') {
                origin[key] = target[key];
            } else if (typeof origin[key] === 'object') {
                deepMerge(origin[key], target[key], deep - 1);
            }
        })
    }
}

const defaultOption = () => ({
    cwd: process.cwd(),
    output: 'dist' as string,
    compile: {
        useSourceMap: false as boolean,
        imageInlineSizeLimit: 8000,
        alias: {} as Record<string, string>,
        definitions: {} as  Record<string, string | string[]>,
        defineMapping: {} as Record<string, string>,
    },
    react: {
        useReactRefresh: true,
        useSvgr: true,
    },
    vue: {

    },
    devServer: {
        port: '8080',
        hostname: 'localhost',
        protocol: 'http' as ('http'|'https'),
        proxy: {} as Configuration['proxy'],
    },
    bundle: {
        webpack: '',
        autoCode: true,
        moduleRecord: {} as Record<string, string | {path: string, sync?: boolean}>,
        dependencies: {
            sync: [] as string[],
            exclude: [] as string [],
        }
    }
});

/**
 * 用户配置
 */
let userOptions = defaultOption();

export const getUserOptions = () => userOptions;

export const updateOptions = (options: PartialAll<typeof userOptions>) => {
    const origin = defaultOption();
    deepMerge(origin, options, 2);
    return userOptions = origin;
}

export type TUserOptions = typeof userOptions;

