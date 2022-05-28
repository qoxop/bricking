import postcss, { Plugin } from 'postcss';
import PostcssModulesPlugin from 'postcss-modules';
import { btkPath } from '@bricking/toolkit';

import { CssLoaderProps } from './types';

export type PostCSSOptions = {
  minify?: boolean;
  module?: boolean | 'auto';
  moduleOptions?: Omit<Parameters<PostcssModulesPlugin>[0], 'getJSON'>,
  plugins?: Plugin[];
}

export type CSSProps = {
  preSourceMap: any;
}

export default async (props: CssLoaderProps<PostCSSOptions, CSSProps>) => {
  const { content, filepath, sourceMap, preSourceMap, context, options } = props;
  const { module, minify, plugins = [], moduleOptions = {} } = options;
  const useModule = module === true || (module === 'auto' && /\.module\.\w+$/.test(filepath));
  const innerPlugin = [
    minify && require('cssnano')({ preset: 'default' }),
    useModule && require('postcss-modules')({
      generateScopedName: '[name]-[local]-[hash:base64:6]',
      ...moduleOptions,
      // eslint-disable-next-line no-unused-vars
      getJSON(_: string, records: Record<string, any>) {
        context.modules = records;
      },
    }),
  ].filter(Boolean);
  const processor = postcss(innerPlugin.concat(plugins));
  const result = await processor.process(content, {
    to: btkPath.replaceExt(filepath, '.css'),
    from: filepath,
    map: sourceMap ? {
      inline: false,
      annotation: false,
      prev: preSourceMap,
    } : undefined,
  });
  const { css, map, messages } = result;
  messages.forEach((message) => {
    if (message?.type === 'dependency') {
      context.dependencies.add(message.file);
    }
  });
  result.warnings().forEach((warn) => console.warn(warn.toString()));
  return { css, map: map.toJSON() };
};
