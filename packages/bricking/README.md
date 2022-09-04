# bricking

一个基于 rollup 的 微模块打包工具。

开发微模块时需要指定一个基座包，开发和构建打包过程中，`bricking` 会将基座包内置的模块排除在外，能较大地提升开发和构建效率。

构建产物严格遵循模块化，模块使用者只需要知道模块入口文件即可对其进行引用，无效关心样式、图片资源等的依赖关系。


## 使用

### 安装
```
npm install bricking -g
```

### 初始化

通过 `create` 命令创建一个微模块模版项目

```sh
bricking create module
```

### 开发命令

```sh
npm run dev
```

### 构建命令

```sh
npm run build
```




## 配置

`bricking` 微模块项目推荐使用 TS 进行开发。项目必须存在 `tsconfig.json` 文件，`bricking` 除了会读取本身的配置文件外，也根据 `tsconfig.json` 中的编译信息进行编译构建，如`target` 和 `paths` 等。

### 配置文件模版

```ts
// bricking.ts 配置文件模板
import { defineBricking } from 'bricking';

const { version, name } = require('./package.json');
const isProdMode = process.env.NODE_ENV === 'production';


export default defineBricking({
    entry: {
        "counter": './src/counter/index.tsx'
    },
    output: "./dist",
    browseEntry: 'src/bootstrap.tsx',
    style: {
        less: true,
    },
    assets: {
        include: [/\.png$/, /\.svg$/],
        exclude: [],
        limit: 10,
        filename: 'imgs/[hash][extname]'
    },
    basePackage: 'https://files.qoxop.run/packages/react-base/1.0.0/package.json'
})
```

### 配置说明

#### 配置模块入口
一个微模块项目是支持导出多个微模块的，新增导出模块，就需要多配置一份模块入口。具体步骤:

1. 到 `bricking.ts` 新增一个 `entry` 字段，字段名是模块名，字段值指向模块文件
2. 到 `tsconfig.json` 新增一个 `paths` 别名, 内容要与 `bricking.ts`文件中的 `entry` 保持一致
3. 确保项目中对该模块的引用均都是用别名引入。

#### Css 预编译器

bricking 支持 less、sass 等预编译器，但需要手动开启和安装依赖。可以到 `bricking.ts` 的 `style` 配置项中开启。

```ts
export default defineBricking({
    style: {
        // 传入 true 开启
        // 也可以传入一个配置对象覆盖默认配置
        less: true,
    }
})
```
对于以 `*.module.(css|less|scss|sass)` 格式命名的样式文件，默认开启 `css module` 功能，可以通过 `style.postcss` 配置修改默认行为。

#### 配置基座包
是通过 `basePackage` 字段进行配置的，它是一个 json 文件链接，json 文件内容记录了有关基座包的所有信息。其结构类型如下：

```ts
type PackageJson { 
    name: string;
    version: string;
    /** 内置的模块 */
    peerDependencies: Record<string, string>;
    /** 运行时入口地址 */
    remoteEntry: string;
    /** 文档地址 */
    document?: string;
}
```

#### 配置文件类型说明

```ts
export type BrickingOptions = {
  //模块入口文件配置
  entry?: {
    [name: string]: string;
  };
  // 输出目录
  output?: string;
  // 浏览器入口模块
  browseEntry: string;
  // 基座包
  basePackage: string ｜ {
    name: string;
    version: string;
  };
  // 是否开启压缩, 默认 mode === 'production'
  minimize?: boolean;
  // 是否进行打包(zip), 如果需要自定义压缩包名称，传入字符串
  doPack?: string|true;
  // 样式配置
  style?: StyleOptions,
  // 静态资源配置
  assets?: {
    include?: string | RegExp | readonly(string | RegExp)[];
    exclude?: string | RegExp | readonly(string | RegExp)[];
    // 文件大小小于 limit 值时，转化为 base64
    limit?: number;
    /**
     * 文件命名规则，eg: `'base-dir/[name]-[hash][extname]'`
     * - `[hash]` - 文件 hash
     * - `[name]` - 文件名
     * - `[extname]` - 扩展名
     * @default '[hash][extname]'
     */
    filename?: string;
    // 配置文件路径查找规则
    loadPaths?: string[];
  },
  // 开发服务器配置
  devServe?: Partial<DevServe> ;
  // 生产环境访问路径
  publicPath?: string;
  // 自定义 Rollup plugin
  plugins?: (false | Plugin)[];
}
```