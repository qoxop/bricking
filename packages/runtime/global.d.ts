/// <reference types="systemjs" />
declare global {
    export type TPromiseFn<MT = any> = () => Promise<MT>;
    export type TImportMaps = Record<string, string>;
    export type TCustomModuleMaps = Record<string, any>;
    export type TDynamicModuleMaps = Record<string, TPromiseFn>;
    export type TMetaDataMaps = Record<string, any>;
    /**
     * 模块管理对象
     */
     export type IModuleManager = {
        set(maps: TCustomModuleMaps, force?: boolean): void;
        setDynamic(maps: TDynamicModuleMaps, force?: boolean): void;
        extendImportMaps(maps: TImportMaps, force?: boolean): void;
        setMetadata(id: string, data: Record<string, any>): void;
        CSS_LINK_MODULE_PATTERN: RegExp;
        CSS_LINK_MODULE_STRING: string;
    }
    /**
     * Bricking 对象
     */
     export type TBricking = {
        /**
         * 运行时插入 css 代码
         * @param cssString - Css 代码字符串
         * @param options.relative - 资源文件与 js 文件的相对路径
         * @param options.relative - 样式代码 hash 值
         * @param options.scriptUrl - 当前脚本的 URL 值
         * @returns
         */
        readonly injectCss:(
            cssString: string,
            options: {
                relative: string;
                hash: string;
                scriptUrl: string;
            }
        ) => true | undefined;
        readonly mm: IModuleManager;
        readonly createStorage: (store: Storage, prefixKey: string) => {
            getItem(key: string): string | null;
            setItem(key: string, value: string): void;
            getObj<T extends Object>(key: string): T | null;
            setObj<T extends Object>(key: string, value: T): void;
            removeItem(key: string): void;
            clear(): void;
        }
    };
    export interface Window { $bricking: TBricking; }
}

declare const $bricking: Window['$bricking'];

export default $bricking;
