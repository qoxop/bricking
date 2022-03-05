import { Chunk, Loader, LoaderContext } from './types';
import { humanlizePath } from '../../../utils/paths';

export class LessLoader extends Loader<Less.Options> {
  name = 'less';

  alwaysProcess = false;

  extensions: string[] = ['.less'];

  async process(chunk: Chunk, context: LoaderContext):Promise<Chunk> {
    const { id, sourceMap } = context;
    const less = require('less');
    const { css, map, imports } = await less.render(chunk.code, {
      ...this.options,
      // @ts-ignore
      rewriteUrls: 'all',
      javascriptEnabled: true,
      filename: id,
      sourceMap: sourceMap ? { sourceMapFileInline: sourceMap === 'inline' } : undefined,
    });
    // 添加依赖关系
    for (const dep of imports) context.dependencies.add(dep);
    let newMap:any = null;
    if (map) {
      newMap = JSON.parse(map);
      newMap.sources = newMap.sources.map((source) => humanlizePath(source));
    }
    return {
      code: css,
      map: newMap,
    };
  }
}
