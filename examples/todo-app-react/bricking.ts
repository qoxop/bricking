import { defineBricking } from 'bricking';

export default defineBricking({
  bootstrap: './bootstrap.tsx',
  modules: {
    'todo-app': './src/bundle.ts'
  },
  basePackage: {
    name: '@bricking/shared-libs',
    version: 'workspace:*'
  },
})
