import { defineBricking } from 'bricking';

export default defineBricking({
  bootstrap: './bootstrap.tsx',
  modules: {
    'todo-app': './src/bundle.ts'
  },
  assets: {
    include: [/\.png$/, /\.svg$/],
    limit: 10,
    filename: 'imgs/[hash][extname]'
  },
  basePackage: {
    name: '@bricking/shared-libs',
    version: 'workspace:*'
  },
})
