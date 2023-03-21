import { defineBricking } from 'bricking';

export default defineBricking({
  bootstrap: './bootstrap.tsx',
  modules: {
    'todo-app': './src/bundle.ts'
  },
  basePackage: "http://localhost:8080/package.json",
})
