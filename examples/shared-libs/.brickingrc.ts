import { updateOptions } from '@bricking/base-builder';

const isProdMode = process.env.NODE_ENV === 'production';

const { name } = require('./package.json');
const publicPath = isProdMode ? `https://vercel.bricking.dev/base/${name}/` : 'http://locahost:8080/';

export default updateOptions({
  publicPath,
  output: 'dist',
  /**
   * 编译选项配置
   */
  compile: {
    useSourceMap: true,
    htmlOptions: {
      template: 'index.html',
      inject: 'body',
      scriptLoading: 'blocking'
    },
    /**
     * webpack 插件的 compiler 钩子
     */
    hooks:  {
      async afterEmit() {
        if (isProdMode) {
          // 这里可以进行文件的上传
          // await upload('./dist/package', true);
        }
      }
    },
  },
  /**
   * 打包选项配置
   */
  bundle: {
    /**
     * 是否将输出文件进行打包 📦
     */
    pack: false,
    /**
     * 开发环境入口
     */
    devEntry: './src/dev.tsx',
    /**
     * 入口文件配置，可选
     */
    entry: './src/index.ts',
    /** 
     * 是否不自动引入 `@bricking/runtime`
     * 这里因为 `entry: './src/index.ts'` 中已经引入，所以设置为 true。
     */
    excludeRuntime: true,
    /**
     * 配置依赖引入逻辑
     */
    dependencies: {
      autoInject: true,
      rewrites: ['antd'],
    },
    /**
     * 配置自定义通用模块
     */
    moduleDefines: {
      autoInject: true,
      baseDir: './src',
      defines: {
        /**
         * 模版模块(不需要的则删除)
         * 最终模块名称为当前包名 + 字段名
         * eg: `import { execTasks } from "base-react-template/tasks"`
         */
        'tasks': './src/libs/tasks.ts',
        index: './index.ts'
      },
    }
  }
});