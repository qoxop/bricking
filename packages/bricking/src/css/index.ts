import * as fs from 'fs';
import * as path from 'path';
import transformCss from './transform-css';
import transformLess from './transform-less';

export const transformLessTest = async () => {
  const lessAbsPath = path.resolve(__dirname, './_test_/index.less');
  const lessPath = lessAbsPath.replace(`${process.cwd()}/`, '');
  const context = {
    dependencies: new Set<string>(),
    modules: {},
  };
  const lessResult = await transformLess({
    context,
    content: fs.readFileSync(lessAbsPath, 'utf8'),
    filepath: lessPath,
    sourceMap: true,
    options: {},
  });
  const cssResult = await transformCss({
    context,
    content: lessResult.css,
    filepath: lessPath,
    sourceMap: true,
    preSourceMap: lessResult.map,
    options: { module: true, minify: true },
  });
  console.log(lessPath);
  fs.writeFileSync(lessAbsPath.replace('.less', '.css'), `${cssResult.css}\n/*# sourceMappingURL=index.less.map */`);
  fs.writeFileSync(lessAbsPath.replace('.less', '.less.map'), JSON.stringify(cssResult.map));
  console.log(context.dependencies);
  console.log(context.modules);
};
