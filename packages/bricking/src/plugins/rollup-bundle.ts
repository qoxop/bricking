import { Plugin } from 'rollup';

const PLUGIN_NAME = 'bricking-rollup-bundle';

const bundleEntry = ({ configPath, realEntry, pkgName }):Plugin => {
  const mk = (key: string) => {
    if (key === 'index') return pkgName;
    return `${pkgName}/${key}`;
  };
  return {
    name: PLUGIN_NAME,
    options(inputOptions) {
      inputOptions.input = configPath;
    },
    load(id: string) {
      if (id === configPath) {
        let code = '';
        const keys = Object.keys(realEntry);
        // import module
        code += keys.map((k, i) => (`import * as m${i} from "${realEntry[k]}";`)).join('\n');
        // inject module
        const codePairs = keys.map((k, i) => (`\t"${mk(k)}": m${i},\n`)).join('');
        code += `\nself.$bricking.mm.set({\n${codePairs}})\n`;
        return { code, map: null };
      }
      return null;
    },
  };
};
export default bundleEntry;
