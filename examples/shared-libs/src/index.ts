import $bricking from "@bricking/runtime";

// 手动注入依赖库
// 是否使用动态模块，取决于你希望入口文件要不要包含这些库
$bricking.mm.setDynamic({ 
  'antd': () => import('./antd')
})

// 通过 set 方法注入依赖库必须使用同步写法
// 这些库会被注入入口文件，增大入口文件的体积
// $bricking.mm.set({})