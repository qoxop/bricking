import { updateOptions } from '@bricking/base-builder';

export default updateOptions({
  publicPath: 'http://localhost:8080/',
  compile: {
    useSourceMap: true,
  },
  bundle: {
    devEntry: './dev.tsx',
    expose: [
      { name: 'antd', path: './src/antd.ts' },
      { name: 'tasks', path: './src/tasks.ts' },
      { name: 'react-dom/client', path: './src/react-dom-client.ts', isSubLib: true },
    ],
    exposeAll: true,
  }
});
