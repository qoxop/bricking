import * as less from 'less';

type Props = {
    filepath: string;
    content: string;
}
export async function load(props: Props) {
  const { filepath, content } = props;
  console.log(filepath, content);
  const { css, map, imports } = await less.render(content, {
    filename: filepath,
    sourceMap: { outputSourceFiles: true },
    ...{ rewriteUrls: 'local' },
  });
  console.log(css, imports, map);
}
