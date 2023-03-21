# bricking

一个基于 rollup 的模块开发和打包工具，支持 Systemjs 和 ESM 模块。

允许指定基于一个预编译过的基座包进行开发，使得编译构建过程中可以将基座包提供的基础依赖库排除在外，从而加速构建速度，且最终构建出的脚本资源体积更小。

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

`bricking` 项目推荐使用 TS 进行开发。项目必须存在 `tsconfig.json` 文件，`bricking` 除了会读取本身的配置文件外，也参考 `tsconfig.json` 中的编译信息进行构建，比如, 参考 `paths` 配置进行模块别名的设置。

## 其他配置

-[ ] TODO
