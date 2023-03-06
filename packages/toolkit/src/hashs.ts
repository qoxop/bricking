/**
 * hash 生成工具
 */
import MD5 from 'md5';
import { createHash } from 'crypto';
import { makeLegalIdentifier } from '@rollup/pluginutils';
import { fileIterator } from './files';

/**
 * 获取数据的 hash 值
 * @param data 数据
 * @param other 其他
 * @returns
 */
const getHash = (data: unknown, ...other:unknown[]) => createHash('sha256').update([data, 'yt7RWop1a', ...other].join(':')).digest('hex').slice(0, 8);

/**
 * 安全地获取 ID 字符串
 * @param data 数据
 * @param id id字符串
 * @returns
 */
const getSafeId = (data: unknown, id: string) => makeLegalIdentifier(`${id}_${getHash(data, id)}`);

/**
 * 获取整个目录的 MD5 值
 * @param dir 目录路径
 * @returns
 */
const getDirMd5 = (dir: string) => {
  let contentChunk = '';
  let pathChunk = '';
  fileIterator(dir, '', (paths, buff) => {
    contentChunk += MD5(buff);
    pathChunk = MD5(paths.relative);
  });
  return MD5(pathChunk + contentChunk);
};

export {
  getHash,
  getSafeId,
  getDirMd5,
};
