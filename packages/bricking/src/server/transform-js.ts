/**
 * 文件编译: 将
 */
import * as fs from 'fs';
import * as babel from '@babel/core';

const RS = require.resolve;

type Params = {
  urlPath: string;
  filePath: string;
  alias?: Record<string, string>;
}
const transform = (code: string, filename: string) => new Promise<babel.BabelFileResult>((resolve, reject) => {
  babel.transform(code, {
    filename,
    presets: [
      [RS('@babel/preset-react')],
      [RS('@babel/preset-typescript')],
    ],
    plugins: [
      RS('./babel-path-resolve.ts'),
      RS('@babel/plugin-proposal-dynamic-import'),
      RS('@babel/plugin-transform-modules-systemjs'),
    ],
  }, (err, result) => {
    if (err) {
      return reject(err);
    }
    if (result) {
      resolve(result);
    }
  });
});

export default async (params: Params) => {
  const esCode = await fs.promises.readFile(params.filePath, { encoding: 'utf8' });
  const { code: systemCode } = await transform(esCode, params.filePath);
  return systemCode;
};
