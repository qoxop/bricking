declare const _default: (options?: any) => {
    name: string;
    resolveId(source: any): any;
    load(id: any): Promise<string>;
    transform(code: any, id: any): Promise<string | {
        code: any;
        map: any;
    }>;
    augmentChunkHash(): string;
    generateBundle(writeOptions: any, bundle: any): Promise<void>;
};
export default _default;
