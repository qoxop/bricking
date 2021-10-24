import { LessLoader } from './less-loader';
import { PostcssLoader, PostcssLoaderOptions } from './postcss-loader';
import { Chunk, Loader, LoaderContext } from './types'

export type LoadersConfig =
  { name: 'less', options?: Less.Options } |
  { name: 'postcss', options?: PostcssLoaderOptions } |
  { name: string, options?: PostcssLoaderOptions } |
  { loader: typeof Loader, options?: any }

export default class Loaders {
  loaders: Loader[] = [];
  constructor(loaders: LoadersConfig[]) {
    const LoaderMap: {[key: string]: any} = {
      'less': LessLoader,
      'postcss': PostcssLoader,
    };
    this.loaders = loaders.map(item => {
      const My_Loader = ('name' in item) ? LoaderMap[item.name] : item.loader;
      return new My_Loader(item.options) as Loader;
    });
  }
  getLoader = (name: string) => this.loaders.find((loader) => loader.name === name);
  isSupported = (filepath: string) => this.loaders.some((loader) => loader.test(filepath));
  removeLoader = (name: string) => (this.loaders = this.loaders.filter((loader) => loader.name !== name));
  add(at: 'before'|'after', name: string|null, newLoader: Loader) {
    if (this.getLoader(newLoader.name)) {
      this.removeLoader(newLoader.name)
    }
    if (name !== null) {
      const loaders = [];
      this.loaders.forEach((loader) => {
        if (at === 'before') loaders.push(newLoader);
        loaders.push(loader);
        if (at === 'after') loaders.push(newLoader);
      });
      this.loaders = loaders
    } else {
      this.loaders.push(newLoader);
    }
  }
  addBefore(name: string|null, newLoader: Loader) {
    this.add('before', name, newLoader);
  }
  addAfter(name: string|null, newLoader: Loader) {
    this.add('after', name, newLoader);
  }
  async process(chunk: Chunk, context: LoaderContext): Promise<Chunk> {
    let nextChunk:Chunk = chunk
    for await (const loader of this.loaders) {
      if (loader.test(context.id) || loader.alwaysProcess) {
        nextChunk = await loader.process(nextChunk, context);
      }
    }
    return nextChunk;
  }
}
