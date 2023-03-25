const path = require('path');
const fs = require('fs-extra');
const ts = require('typescript');
const rollup = require('rollup');

const EntryFile = path.resolve(__dirname, '../src/index.ts');
const DistDir = path.resolve(__dirname, '../dist/');

fs.removeSync(DistDir);
if (!fs.existsSync(DistDir)) fs.mkdirSync(DistDir);

(async () => {
  // bundle
  ts.createProgram({
    rootNames: [EntryFile],
    options: {
      outDir: DistDir,
      emitDeclarationOnly: false,
      esModuleInterop: true,
      declaration: true,
      skipLibCheck: true,
    },
  }).emit();

  const rollupBundle = await rollup.rollup({
    input: path.resolve(DistDir, './index.js'),
    plugins: [
      require('@rollup/plugin-node-resolve').nodeResolve(),
      require('@rollup/plugin-commonjs')(),
      require('@rollup/plugin-terser').default({ format: { comments: false } }),
    ],
  });
  await rollupBundle.write({
    format: 'iife',
    file: path.resolve(DistDir, 'bricking.min.js'),
    name: 'bricking',
    sourcemap: false,
  })


  // // copy
  // fs.writeFileSync(
  //   path.resolve(DistDir, './index.d.ts'),
  //   fs.readFileSync(path.resolve(__dirname, '../global.d.ts'), 'utf8'),
  // );
})();





