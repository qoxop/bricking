# bricking

一个通用的 web module 构建工具，基于 rollup 进行封装，使用systemjs作为模块加载器。

- 运行时的模块复用
- 模块自身使用相对路径管理相关静态资源，无部署环境依赖
- 第三方依赖可独立构建部署，减少主应用构建时间
- 支持使用 css module
- 支持 less (后续开发 sass、stylus 等)
- 开发环境热重载 (暂不支持模块热替换)
