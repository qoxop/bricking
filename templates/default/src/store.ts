import { thunkMiddleware } from 'react-ducky';
import { createStore, combineReducers, applyMiddleware, compose, Reducer } from 'redux';

type ArrayItem<T> = T|Array<T>;

// reducer mapping
const mapping = {}

// @ts-ignore
const composeEnhancers = typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?   window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({}) : compose;

export const store = createStore(
    s => s,
    composeEnhancers(applyMiddleware(thunkMiddleware))
);

export const injectReduce = (reducers: ArrayItem<{ key: string; reducer: Reducer; }>) => {
    reducers = reducers instanceof Array ? reducers: [reducers];
    let hasNew = false;
    reducers.forEach(({key, reducer}) => {
        if (!mapping[key]) {
            hasNew = true;
            mapping[key] = reducer;
        };
    });
    store.replaceReducer(combineReducers(mapping));
}
