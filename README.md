# Bricking

Bricking 是一个基于 [`Systemjs`](https://github.com/systemjs/systemjs) 的运行时模块构建框架，用于实现与原生 ESM 类似的功能，同时又能满足项目工程化的要求。([为什么不直接使用原生 ESM ?](#为什么不直接使用原生-esm))


Bricking 将应用拆分成一个基座和多个微模块的组合。基座可以理解成原生 ESM 的 `importmap` 功能，用于提供基础模块的映射关系。而微模块是一个颗粒度较大、功能相对聚合的运行时模块，比如一个页面级模块。

## 运行时模块的好处

- 避免了传统前端项目“改一行代码需要构建整个项目”的尴尬，项目的各个子模块可以做到按需独立构建与发布。
- 只要遵循模块接口，应用的模块功能可以在运行时进行动态替换，更容易实现个性化功能。
- 基座、微模块可被多个应用在运行时进行共享复用，便捷开发的同时，提升了静态资源缓存的利用率

## 核心库

### [@bricking/runtime](./packages/runtime/README.md)

对 [`Systemjs`](https://github.com/systemjs/systemjs) 进行封装改造，提供了模块的动态注入功能，以及自定义了 Css 样式模块的加载逻辑。

### [@bricking/base-builder](./packages/base-builder/README.md)

用于开发和构建基座包的工具。

### [bricking](./packages/bricking/README.md)

用于开发和构建微模块，以及模板项目生成

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

```sh
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

```sh
# bricking create --help
bricking create [type]

创建模版项目

位置：
  type  指定模版类型                                      [字符串]

选项：
      --version   显示版本号                               [布尔]
      --help      显示帮助信息                              [布尔]
      -n, --name      项目名称                           [字符串]
      -t, --template  指定一个模版                        [字符串]
      -c, --cwd       指定工作目录          [字符串] [默认值: "./"]
```

## 为什么不直接使用原生 ESM ?

- 尽管原生 ESM 现在得到了广泛支持，但仍然存在不支持原生 ESM 的浏览器
- 项目工程源码模块数量庞大，如果不进行 bundle，模块的往返加载需要耗费大量的网络资源。
- 现代项目很多都会采用 TS，而且会使用一些新语法，源码仍然需要编译才能被浏览器执行。
