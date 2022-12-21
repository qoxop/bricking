import livereload from 'rollup-plugin-livereload';

type Options = Parameters<typeof livereload>[0] & { scriptId?: string }

export default function myLivereload(options: Options) {
  const plugin = livereload(options);
  const originBanner = plugin.banner as any;
  plugin.banner = async () => {
    if (typeof originBanner === 'function') {
      const bannerCode = await originBanner();
      if (options.scriptId) {
        return bannerCode.replace(/livereloadscript/g, options.scriptId);
      }
      return bannerCode;
    }
    return null;
  };
  return plugin;
}
