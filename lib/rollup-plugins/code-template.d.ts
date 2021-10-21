export declare const SYSTEM_JS_CODE: () => string;
export declare const REAL_TIME_CODE: (jsonUrl: string, appEntry: string) => string;
export declare const SDK_TPL_STRING: ({ dynamic_module_maps, import_maps, extra }?: {
    dynamic_module_maps?: string;
    import_maps?: string;
    extra?: string;
}) => string;
export declare const INJECT_IMPORT_MAPS: (import_maps: string) => string;
