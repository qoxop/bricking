import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReduxProvider } from 'react-ducky';
import { initStore } from 'react-ducky';

(async () => {
  // @ts-ignore
  $bricking.setMetadata('todo-app', { version: '1.0.0' });
  // 验证 import.meta.data
  const { TodoApp, TodoReducer } = await import('todo-app');
  const { store } = initStore({
    isDev: true,
    initState: {},
    reducerRecord: {
      todo: TodoReducer
    }
  });

  ReactDOM.createRoot(document.getElementById('root')).render(<ReduxProvider store={store}><TodoApp /></ReduxProvider>)
})()
