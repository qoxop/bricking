const { runBuild } = require('@bricking/base-builder/build');

process.env.NODE_ENV = 'production';

runBuild();
// const { btkType } = require('@bricking/toolkit');
// const path = require('path');

// btkType.createTypeDefine({
//     input: path.resolve(__dirname, './src/utils'),
//     output: path.resolve(__dirname, './dist/utils.d.ts'),
//     cwd: __dirname
// })

// // btkType.rollupDTS({
// //     input: path.resolve(__dirname, './src/index.ts'),
// //     output: path.resolve(__dirname, './temp/index.ts'),
// //     cwd: __dirname
// // })