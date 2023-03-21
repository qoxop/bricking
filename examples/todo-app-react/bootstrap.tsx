import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReduxProvider } from 'react-ducky';
import { TodoApp, TodoReducer } from 'todo-app';

import { initStore } from 'react-ducky';

export const { store } = initStore({
  isDev: true,
  initState: {},
  reducerRecord: {
    todo: TodoReducer
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(<ReduxProvider store={store}><TodoApp /></ReduxProvider>)
