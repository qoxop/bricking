import { CssLoaderProps } from './types';

export type LessOption = {
  paths?: string[];
  rootpath?: string;
  rewriteUrls?: 'local'|'all'|'off';
  math?: any;
  strictUnits?: boolean;
  ieCompat?: boolean;
  javascriptEnabled?: boolean;
  globalVars?: Record<string, string>;
  modifyVars?: Record<string, string>;
  insecure?: boolean;
  plugins?: any[];
}

/**
 * transform less
 */
export default async (props: CssLoaderProps<LessOption>) => {
  const less = require('less');
  const { options, filepath, content, context, sourceMap } = props;
  const { css, map, imports } = await less.render(content, {
    filename: filepath,
    rewriteUrls: 'local',
    javascriptEnabled: true,
    ...options,
    sourceMap: sourceMap ? { outputSourceFiles: true } : false,
  });
  imports.map((file: string) => context.dependencies.add(file));
  return { css, map: sourceMap ? JSON.parse(map) : null };
};
