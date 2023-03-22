# Bricking

Bricking 是一个基于 Rollup 的运行时模块开发和构建工具。运行时模块风格采用的是 [`Systemjs`](https://github.com/systemjs/systemjs)。借助 Systemjs 运行时模块方案，可以方便地将应用拆分成多个运行时模块的动态组合，从而实现多模块的独立开发、构建与部署。

为了简化运行时模块的依赖关系，减少冗余，以及更好地利用网络缓存，bricking 还提供了公共基础依赖库的预编译工具，可以对基础依赖库进行预编译，生成预编译包，各个模块项目可以基于预编译包进行开发。

当然，Bricking 也支持构建出一个完整的应用！

## 运行时模块的优缺点

### 优点

- 因为复用基础依赖以及模块分离，开发、构建和发布更快。
- 只要遵循模块接口，应用业务模块能动态替换，更多的个性化模块也不会使得主应用变得臃肿。
- 网络资源缓存的缓存、预加载更加可控，缓存效果利用率更佳

### 缺点

- 多模块模块组合调试不方便
- 项目管理复杂，模块接口定义、限制等要求更严格。
- 因为模块分离构建，没有办法做整体的代码分析，不支持自动 tree-shake


## 核心库

### [@bricking/runtime](./packages/runtime/README.md)

对 [`Systemjs`](https://github.com/systemjs/systemjs) 进行封装改造，提供了模块的动态注入功能，以及自定义了 Css 样式模块的加载逻辑。

### [@bricking/base-builder](./packages/base-builder/README.md)

公共基础依赖库的预编译工具

### [bricking](./packages/bricking/README.md)

用于开发和构建运行时模块，以及模板项目生成

## 安装与使用

```sh
npm install bricking -g
```

### 1、开发基座包

通过脚手架命令创建一个基座包模版项目

```sh
bricking create base
```

根据实际需要模块开发和配置修改。

### 2、开发微模块

通过脚手架命令创建一个微模块模版项目

```sh
bricking create module
```

### 3、开发应用入口模块

略，方式与微模块相同

## 命令行工具

通过执行 `bricking --help` 或者 `bricking [command] --help` 查看使用说明

```
#bricking --help
bricking [命令]

命令：
  bricking dev            启动开发服务器
  bricking build          构建项目
  bricking serve          启动静态服务
  bricking install        安装基座包的对等依赖(以供开发时的类型提醒)
  bricking create [type]  创建模版项目

选项：
  --version  显示版本号                                   [布尔]
  --help     显示帮助信息                                 [布尔]
```

```
# bricking create --help
bricking create [type]

创建模版项目

位置
  type  指定模版类型                                      [字符串]

选项：
      --version   显示版本号                               [布尔]
      --help      显示帮助信息                              [布尔]
      -n, --name      项目名称                           [字符串]
      -t, --template  指定一个模版                        [字符串]
      -c, --cwd       指定工作目录          [字符串] [默认值: "./"]
```
