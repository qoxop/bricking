import React from 'react';
import ReactDOM from 'react-dom';
import MyApp, { reducer } from "my-app-name";
import { ReduxProvider } from 'react-ducky';
import { store, injectReduce } from './store';

injectReduce({ key: 'todo', reducer });

ReactDOM.render(
    <React.StrictMode>
        <ReduxProvider store={store}>
            <React.Suspense fallback={<div>loading...</div>}>
                <MyApp />
            </React.Suspense>
        </ReduxProvider>
    </React.StrictMode>,
    document.getElementById('root')
)
