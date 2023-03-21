# @bricking/runtime

Systemjs 运行时模块管理工具，对 Systemjs 进行了封装，支持手动注入运行时模块。

## 安装

```shell
npm install @bricking/runtime
```

## 使用

`@bricking/runtime` 包含了 `Systemjs`，并扩展了其模块功能。项目引入`@bricking/runtime`后，可以通过访问 `window.$bricking`(或者`import $bricking from '@bricking/runtime';`) 进行基础模块的管理。

```ts
import $bricking from '@bricking/runtime';
import React from 'react';
// 注入同步模块
$bricking.set({
  'react': React,
});
// 注入异步模块
$bricking.setDynamic({
  'rxjs': () => import('rxjs')
});
```

### 为什么不直接使用 systemjs 提供的 importmap 功能？
因为使用 importmap 功能意味着你需要为你的所有的依赖单独编译一份 js 脚本，这样的话页面加载脚本的数量就比较不可控。
而且依赖与依赖之间本身也可能存在较为复杂的依赖关系，如果要处理这些关系而不借助打包工具进行分析整合，需要耗费大量的精力。

## API

### $bricking.set

用于注入同步模块

`set(maps: Record<string, any>, force?: boolean): void;`

- `maps`: 模块映射对象
- `force`: 是否强制覆盖现有模块

### $bricking.setDynamic

用于注入异步模块

`setDynamic(maps: Record<string, () => Promise<any>>, force = true)`

- `maps`: 模块映射对象
- `force`: 是否强制覆盖现有模块

### $bricking.extendImportMaps

拓展 Systemjs 的 importmap 对象

`extendImportMaps(maps: Record<string, string>, force?: boolean): void`

- `maps`: importmap 对象
- `force`: 是否强制覆盖现有模块

### $bricking.setMetadata

为特定 ID 的模块的 `import.meta.data` 写入数据(需要在该模块导入前调用)

`setMetadata(id: string, data:Record<string, any>)`

- id: 模块 ID
- data: 任意数据
