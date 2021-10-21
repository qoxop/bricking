/// <reference types="node" />
export declare function unzip(zipPath: string, to: string): Promise<void>;
export declare const copy: (from: string, to: string) => Promise<void>;
export declare const clear: (dirs: string | string[]) => Promise<string[]>;
export declare const bufferString: (transform: (name: string, data: string) => string) => (name: string, data: Buffer) => Buffer;
/**
 * 文件传输转化
 * @param from
 * @param to
 * @param transform
 * @returns
 */
export declare const fileTransfer: (from: string, to: string, transform: (name: string, data: Buffer) => Buffer | Promise<Buffer>) => Promise<any>;
