import { Options, Result, SassError, SassRenderCallback } from 'node-sass';
import { CssLoaderProps } from './types';

/**
 * 渲染 sass 文件
 * @param options
 * @returns
 */
export const SassRender = (options: Options) => (
  new Promise<{error?: SassError, result?: Result}>((resolve) => {
    const sass = require('node-sass');
    const callback: SassRenderCallback = (error, result) => {
      if (error) return resolve({ error });
      resolve({ result });
    };
    sass.render(options, callback);
  }));

export type SassOptions = Partial<Pick<Options,
'importer'
|'functions'
|'includePaths'
|'indentedSyntax'
|'indentType'
|'indentWidth'
|'linefeed'
|'outFile'
|'outputStyle'
|'precision'
>>

export default async (props: CssLoaderProps<SassOptions>) => {
  const { content, filepath, context, sourceMap } = props;
  const { result, error } = await SassRender({
    ...props.options,
    sourceMap,
    data: content,
    file: filepath,
    sourceMapContents: true,
  });

  if (result) {
    result.stats.includedFiles.forEach((dep) => context.dependencies.add(dep));
    return { css: result.css.toString(), map: sourceMap ? JSON.parse(result.map.toString()) : null };
  }
  throw error;
};
