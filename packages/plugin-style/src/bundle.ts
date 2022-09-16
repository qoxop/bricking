import path from "path";
import { fsExtra, btkHash, btkFunc } from "@bricking/toolkit";
import transformLess, { LessOption } from "./transform/transform-less";
import transformSass, { SassOptions } from "./transform/transform-sass";
import transformCss, { PostCSSOptions } from "./transform/transform-css";
import { relativeUrl } from './plugins/postcss-relative-url'



type AssetsOptions = {
  /**
   * 文件大小限制，大小小于该限制的文件会转化成 base64URL
   */
  limit?: number;
  /**
   * 文件名格式，默认 "assets/[hash].[extname]"
   */
  filename?: string;
  /**
   * 用于查找文件的特定目录
   */
  loadPaths?: string[];
}

/**
 * 打包参数类型
 */
type BundleProps<Extra> = {
  /**
   * 输入文件(绝对路径)
   */
  input: `${string}.less`;
  /**
   * 输出目录(绝对路径)
   */
  output: string;
  /**
   * 文件名格式, 默认 "style.[hash].css"
   * - 注意不能输入目录前缀，比如 "dir/style.css"
   */
  filename?: string;
  /**
   * 是否开启 sourceMap
   */
  sourceMap?: boolean;
  /**
   * Less 与编译器选项
   */
  lessOptions?: LessOption;
  /**
   * 静态文件配置
   */
  assetsOptions?: AssetsOptions;
  /**
   * postcss 配置
   */
  postCssOptions?: PostCSSOptions
} & Extra;

/**
 * Less 打包参数类型
 */
type BundleLessProps = BundleProps<{
  /**
   * Less 预编译器选项
   */
  lessOptions?: LessOption;
}>

type BundleSassProps = BundleProps<{
  /**
   * Sass 预编译器选项
   */
  sassOptions?: SassOptions
}>

/**
 * 批量复制
 * @param map 文件映射
 * @param outputDir 输出目录
 */
async function batchCopy(map: Map<string, string>, outputDir: string) {
  if (!map.size) return;
  await Promise.all(
    Array.from(map.entries()).map(async ([id, filename]) => {
      // 拷贝文件
      await fsExtra.copyFile(id, path.join(outputDir, filename))
    }),
  );
}

/**
 * 输出并返回结果
 */
async function generate({
  input,
  output,
  result,
  context,
  sourceMap,
  postCssOptions,
  assetsOptions,
  filename
}) {
  // 文件映射
  const AssetsMap = new Map<string, string>();
  // css 编译
  const cssResult = await transformCss({
    content: result.css,
    filepath: input,
    context,
    sourceMap,
    preSourceMap: result.map,
    options: {
      ...postCssOptions,
      plugins: [
        ...(postCssOptions?.plugins || []),
        relativeUrl({
          AssetsMap,
          getDataUrl: btkFunc.getDataUrl,
          cssOutput: output,
          baseOutput: output,
          ...Object.assign({
            limit: 1024 * 4,
            filename: 'assets/[hash].[extname]',
            loadPaths: [],
          }, assetsOptions),
        })
      ]
    },
  });
  // 计算 hash
  const hash = btkHash.getHash(cssResult.css);
  // 文件名替换
  const localFilename = filename.replace('[hash]', hash);
  // 输出路径
  const filepath = path.resolve(output, localFilename);
  await fsExtra.writeFile(filepath, cssResult.css);
  if (sourceMap) {
    await fsExtra.writeFile(`${filepath}.map`, cssResult.map);
  }
  await batchCopy(AssetsMap, output);
  return {
    hash,
    cssFilepath: filepath,
    mapFilepath: `${filepath}.map`,
    ...cssResult
  }
}

/**
 * 打包 less 文件
 * @param props 
 * @returns 
 */
export async function bundleLess(props: BundleLessProps) {
  const {
    input,
    sourceMap,
    output,
    filename = 'style.[hash].css',
    lessOptions = {},
    assetsOptions = {},
    postCssOptions = {}
  } = props;
  const content = await fsExtra.readFile(input, { encoding: 'utf-8' });
  const context = {
    dependencies: new Set<string>(),
  };
  // less 编译
  const lessResult = await transformLess({
    content,
    filepath: input,
    context,
    sourceMap,
    options: lessOptions,
  });
  return await generate({
    result: lessResult,
    input,
    output,
    context,
    filename,
    sourceMap,
    assetsOptions,
    postCssOptions,
  });
}

/**
 * 打包 sass 文件
 * @param params 
 */
export async function bundleSass(props: BundleSassProps) {
  const {
    input,
    sourceMap,
    output,
    filename = 'style.[hash].css',
    sassOptions = {},
    assetsOptions = {},
    postCssOptions = {}
  } = props;
  const content = await fsExtra.readFile(input, { encoding: 'utf-8' });
  const context = {
    dependencies: new Set<string>(),
  };
  // less 编译
  const sassResult = await transformSass({
    content,
    filepath: input,
    context,
    sourceMap,
    options: sassOptions,
  });
  return await generate({
    result: sassResult,
    input,
    output,
    context,
    filename,
    sourceMap,
    assetsOptions,
    postCssOptions,
  });
}