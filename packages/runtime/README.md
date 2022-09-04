# @bricking/runtime

bricking 运行时代码，对 Systemjs 进行了封装，让 Systemjs 的模块更容易扩展。

## 安装

```
npm install @bricking/runtime
```

## 使用

`@bricking/runtime` 引用了 `Systemjs`，并扩展了其模块功能。项目引入`@bricking/runtime`后，可以通过访问 `window.$bricking` 进行基础模块的管理。`$bricking`同时也支持通过导入的方式进行访问:

```ts
import $bricking from '@bricking/runtime';
import React from 'react';
// 导入同步模块
$bricking.mm.set({
  'react': React,
});
// 导入异步模块
$bricking.mm.setDynamic({
  'rxjs': () => import('rxjs),
});
```

不管基座包内注入的模块是异步还是同步的，对微模块而已都是无差别的，微模块正常使用 ESM 的方式进行编写即可。

