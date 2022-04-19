import postcss from 'postcss';
import { btkFunc } from '@bricking/toolkit/dist';

const getProcessor = btkFunc.once(() => postcss([]));

type Props<T, O = {}> = {
  content: string;
  filepath: string;
  sourceMap: boolean;
  context: {
    dependencies: Set<string>;
  };
  options: T;
} & O;

type LessOption = {
  paths?: string[];
  rootpath?: string;
  rewriteUrls?: 'local'|'all'|'off';
  math: any;
  strictUnits: boolean;
  ieCompat: boolean;
  javascriptEnabled: boolean;
  globalVars: Record<string, string>;
  modifyVars: Record<string, string>;
  insecure: boolean;
  plugins: any[];
}
export const lessTransform = async (props: Props<LessOption>) => {
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
  return { css, map: JSON.parse(map) };
};

type PostCSSProps = {
  module?: boolean;
  esModule?: boolean;
}
type PostCSSOptions = {
  preSourceMap: any;
}

export const postcssTransform = async (props: Props<PostCSSProps, PostCSSOptions>) => {
  const { content, filepath, preSourceMap, context } = props;
  const processor = getProcessor();
  const { css, map, messages, warnings } = await processor.process(content, {
    to: filepath,
    from: filepath,
    map: {
      inline: false,
      annotation: false,
      prev: preSourceMap,
    },
  });
  messages.forEach((message) => {
    if (message.type === 'dependency') {
      context.dependencies.add(message.file);
    }
  });
  warnings().forEach((warn) => console.warn(warn.toString()));
  return { css, map: map.toJSON() };
};
