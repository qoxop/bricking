# Bricking

一个基于 Systemjs 模块风格的独立构建工具，核心思想在于将一个应用的各个部分进行独立构建部署，通过 systemjs 进行运行时组合。减少了冗余构建，增加了业务模块间的独立性。

- 将应用的第三方依赖、自定义的通用代码进行独立工具，打包成一个基于 Systemjs 的模块系统(可以理解为一个运行时的异步的node_module)
- 