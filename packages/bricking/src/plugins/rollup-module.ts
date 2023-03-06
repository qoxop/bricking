import * as babelCore from '@babel/core';
import { OutputPlugin } from 'rollup';

/**
 * 修改输出模块风格为 ESM，如果原先的模块风格为 system，再在 renderChunk 中进行转化
 */
export default function RollupModule(polyfill?: boolean, options?: any): OutputPlugin {
  let originFormat = '';
  return {
    name: 'RollupModule',
    outputOptions(outputOptions) {
      if (!originFormat) {
        originFormat = outputOptions.format as string;
      }
      outputOptions.format = 'es';
    },
    async renderChunk(code) {
      if (['system', 'systemjs'].includes(originFormat as string)) {
        let result:any = null;
        if (polyfill) {
          result = await babelCore.transformSync(code, {
            presets: [
              [require.resolve('@babel/preset-env'), {
                useBuiltIns: 'entry',
                corejs: '3.28.0',
                targets: '> 0.25%, not dead, not ie <= 10',
                ...(options || {}),
                modules: 'systemjs',
              }],
            ],
          });
        } else {
          // 转化为 system 模块
          result = await babelCore.transformAsync(code, {
            plugins: [
              require.resolve('@babel/plugin-proposal-dynamic-import'),
              require.resolve('@babel/plugin-transform-modules-systemjs'),
            ],
          });
        }
        return result;
      }
      return null;
    },
  };
}
