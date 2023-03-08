# Bricking 基座包模板 — React 版

## 开发
```sh
yarn run dev

# > origin =  http://localhost:8080
# > bundle  =  http://localhost:8080/base-js-bricking.js
# > package  =  http://localhost:8080/package.json
```
开发模式下页面会先引入 `entry-chunk` 文件再引入 `devEntry-chunk` 来启动应用。`devEntry` 适合用来做一些简单的功能验证。

如果你想完整测试整个基座包，建议另起一个微模块项目，然后以控制台打印出来的 JSON 地址进行配置。

[👉 如何配置一个微模块项目?](https://github.com/qoxop/bricking/blob/main/packages/bricking/README.md)

```sh
# 输入一下命令，它会要求你填写一下必要信息
# 然后初始化一个微模块模版项目
npx bricking create module
```

## 构建
```sh
yarn run build
```

## 配置说明

[👉 @bricking/base-builder 配置文档](https://github.com/qoxop/bricking/blob/main/packages/base-builder/README.md)

## 自定义 package.json

此模板除了 `React` 外, 内置了 `antd`、`axios`、`history`、`immer`、`qs`、`redux`、`react-ducky`、`react-is`、`react-route`、`react-router-dom`、`redux-saga`、`styled-components` 等常用库，可以根据实际需要进行新增或删除。

### 必需安装的依赖

- `@babel/runtime`
- `@bricking/runtime`
- `core-js`

### 可选的依赖

如需使用 less 编写样式，安装
- `less`

如需使用 sass 编写样式，安装
- `sass`
