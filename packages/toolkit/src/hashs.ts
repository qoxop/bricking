/**
 * hash 生成工具
 */
import MD5 from "md5";
import { createHash } from "crypto";
import { makeLegalIdentifier } from "@rollup/pluginutils";
import { fileIterator } from "./files"

/**
 * 获取数据的 hash 值
 * @param data
 * @param other 
 * @returns 
 */
const getHash = (data: any, ...other:any[]) => createHash("sha256").update([data, 'yt7RWop1a',...other].join(":")).digest("hex").slice(0, 8);

/**
 * 安全地获取 ID 字符串
 * @param data 
 * @param id 
 * @returns 
 */
const getSafeId = (data: any, id: string) => makeLegalIdentifier(`${id}_${getHash(data, id)}`);

/**
 * 获取整个目录的 MD5 值
 * @param dir
 * @returns
 */
const getDirMd5 = (dir: string) => {
    let contentChunk = '';
    let pathChunk = ''
    fileIterator(dir, '', (paths, buff) => {
        contentChunk += MD5(buff);
        pathChunk = MD5(paths.relative);
    });
    return MD5(pathChunk + contentChunk);
}

export {
    getHash,
    getSafeId,
    getDirMd5,
}