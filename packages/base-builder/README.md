# @bricking/base-builder

共享依赖预编译工具，基于 Systemjs 模块风格。

## 功能

- 预编译依赖模块, 并自动注入 Systemjs 模块系统
- 生成 webpack 模块联邦配置
- 自定义导出模块, 并生成类型文件
- 生成预编译包的信息文件

## 使用

### 初始化

通过 `create` 生产基座包模版项目

```
bricking create base
```

初始化后项目的目录结构如下

```
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

## 配置说明

-[ ] TODO
