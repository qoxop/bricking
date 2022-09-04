# @bricking/base-builder

Systemjs 模块基座打包器。

## 功能

- 将依赖模块自动注入 Systemjs 模块系统。
- 生成基座包信息文件。
- 打包基座包类型文件，生成 npm 压缩包。


## 使用

### 初始化

通过 `create` 生产基座包模版项目

```
bricking create base
```

初始化后项目的目录结构如下
```sh
.
├── README.md
├── index.html
├── .brickingrc.ts
├── package.json
├── src
│   ├── dev.tsx
│   └── storage.ts
└── tsconfig.json
```
其中 `.brickingrc.ts` 是主要的配置文件，用于配置模块的导出规则、编译选项、类型文件生成、模块信息生成等。

### 安装依赖

在项目目录下执行:
```
npm install
```

### 开发&构建

- 开发命令: `npm run dev`
- 构建命令: `npm run build`

### 自定义模块

自定义模块可以使用配置文件注入，也可以通过源码手动注入(不推荐，因为，为了生成类型文件，仍然需要进行路径配置)，模块路径名必须以当前项目名作为前缀。

```ts
// .brickingrc.ts
export default updateOptions({
  bundle: {
    entry: './src/index.ts',
    moduleDefines: {
      autoInject: false, // 如果为 true，下面的配置会被自动注入到模块系统中。
      defines: {
        // 模块映射配置，最终模块名称为当前包名 + 字段名
        'tasks': './src/libs/tasks.ts'
      },
    }
  }
})

// ./src/index.ts

// 如果配置文件中 autoInject 为true，则不需要以下代码
import * as tasks from './libs/tasks.ts';
window.$bricking.mm.set({
  'base-react-template/tasks': tasks,
})
```

最终生成的包目录结构如下，
```sh
.
├── package.json
└── tasks.d.ts
```
其他微模块使用该基座包时就可以通过 `import { execTasks } from "base-react-template/tasks"` 进行模块引用。

## 配置

### 配置文件模板
```ts
// .brickingrc.ts
import { updateOptions } from '@bricking/base-builder';

const { version, name } = require('./package.json');
const isProdMode = process.env.NODE_ENV === 'production';
const publicPath = isProdMode ? `https://xxcdn.com/packages/${name}/${version}/` : '/';

export default updateOptions({
  publicPath,
  output: 'dist',
  compile: {
    useSourceMap: true,
    hooks: {
      async afterEmit() {
        // if (isProdMode) upload 
      }
    }
  },
  bundle: {
    pack: true,
    devEntry: './src/dev.tsx',
    dependencies: {
      autoInject: true,
      exclude: ['lodash'],
    },
    moduleDefines: {
      autoInject: true,
      defines: {},
    }
  }
});
```

### 配置文类型说明

```ts
type Config = {
  /**
   * 输出目录，可以是相对路径或绝对路径
   * 默认 `dist`
  */
  output: string;
  /**
   * 线上静态资源根路径, 默认 `/`
   * eg: http://xxxcdn.com/myapp
  */
  publicPath: string; 
  /*
   * 开发服务配置
  */
  devServer?: {
    port?: number; // 默认 8080
    hostname?: string; // 默认 'localhost'
    protocol?: 'http'|'https'; // 默认'http'
    /**
     * 接口代理配置
     * import { Configuration } from 'webpack-dev-server';
     */
    proxy: Configuration['proxy'];
  },
  /**
   * 模块打包配置
   */
  bundle: {
    /**
     * 自定义的 webpack 配置路径
     * 导出内容为
     * - Function, 通过 `(oldConfig) => newConfig` 方式修改 webpack 配置
     * - Object, 使用 webpackMerge 合并配置
     */
    webpack?: string;
    /**
     * 是否将构建产物打成一个 zip 包
     */
    pack?: boolean;
    /**
     * 自定义入口文件
     * 可选，如果不提供，会自动生成
     */
    entry?: string;
    devEntry: string;
    /**
     * 当前包的名称
     * 默认采用 package.json 中的 name
     */
    packageName?: string;
    /**
     * 不自动注入 `@bricking/runtime` 这个依赖库
     * 默认为 false，自动注入
     */
    excludeRuntime?: boolean;
    /**
     * 依赖配置
     */
    dependencies: {
      /**
       * 将 package.json 中的依赖进行自动注入
       */
      autoInject: true;
      /**
       * 标识哪些依赖是不需要打入运行时的
       */
      exclude: string[];
    } | {
      /**
       * 手动注入依赖
       */
      autoInject: false;
      /**
       * 告诉打包工具那些依赖被手动注入了
       * 用于生产基座包的依赖信息
       */
      include: string[]
    }),
    /** 自定义模块配置 */
    moduleDefines: {
      /** 是否自动注入自定义的模块，否则需要自行在入口文件处进行导入 */
      autoInject: true,
      /** 自定义模块的模块名与路径映射 */
      defines: {} as Record<string, string>,
    },
  },
  /** 与 webpack 编译相关的参数, 全部配置均为可选 */
  compile: {
    useSourceMap?: boolean; // 是否开启 SourceMap，默认 false
    imageInlineSizeLimit?: number; // 图标大小小于多少时，使用 Base64 Url 内联
    alias?: Record<string, string>; // 别名配置
    /**
     * 参考 ProvidePlugin 插件配置
     * https://webpack.js.org/plugins/provide-plugin/
     */
    definitions?: Record<string, string | string[]>;
    /**
     * 参考 DefinePlugin 插件配置
     * https://webpack.js.org/plugins/define-plugin/
     */
    defineMapping?: Record<string, string>;
    /**
     * 参考 HtmlWebpackPlugin 插件配置
     * https://webpack.js.org/plugins/html-webpack-plugin/
     */
    htmlOptions?: HtmlWebpackPlugin.Options,
    /**
     * 参考 webpack 插件钩子文档
     * https://webpack.js.org/api/compiler-hooks/#hooks
     */
    hooks: {} as Partial<Hooks>,
  },
  /**
   * React 编译相关配置
   */
  react: {
    useReactRefresh: boolean;
    useSvgr: boolean;
  },
  // TODO 支持 vue.js
  vue: {},
}
```
