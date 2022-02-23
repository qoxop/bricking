/// <reference types="@types/systemjs" />

declare type TPromiseFn<MT = any> = () => Promise<MT>;
declare type TImportMaps = Record<string, string>;
declare type TCustomModuleMaps = Record<string, any>;
declare type TDynamicModuleMaps = Record<string, TPromiseFn>;
declare type TMetaDataMaps = Record<string, any>;

/**
 * 模块管理对象
 */
declare type IModuleManager = {
    set(maps: TCustomModuleMaps, force?: boolean): void;
    setDynamic(maps: TDynamicModuleMaps, force?: boolean): void;
    extendImportMaps(maps: TImportMaps, force?: boolean): void;
    setMetadata(id: string, data: Record<string, any>): void;
    CSS_LINK_MODULE_PATTERN: RegExp;
    CSS_LINK_MODULE_STRING: string;
}

declare const $bricking: {
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
};