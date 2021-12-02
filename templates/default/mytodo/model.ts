import { createModel, PayloadAction } from "react-ducky";


export namespace TodoModel {
    export type FilterType = 'all'|'unfinished'|'finished';
    export interface TodoItem {
        finished: boolean;
        text: string;
        id: string;
    }
}

export interface InitialState {
    todos: TodoModel.TodoItem[],
    filter: TodoModel.FilterType,
}

const initialState:InitialState = {
    todos: [],
    filter: 'all',
}

const { actions, reducer, getState, useModel } =  createModel({
    name: "todo",
    initialState,
    reducers: {
        addTodo(state, action: PayloadAction<TodoModel.TodoItem>) {
            const { payload } = action;
            state.todos.push(payload);
        },
        toggleTodo(state, action: PayloadAction<string>) {
            const { payload } = action;
            const todo = state.todos.find(item => item.id === payload)
            todo.finished = !todo.finished;
        },
        delTodo(state, action: PayloadAction<string>) {
            const { payload } = action;
            state.todos = state.todos.filter(item => item.id !== payload);
        },
        setFilter(state, action: PayloadAction<TodoModel.FilterType>) {
            state.filter = action.payload;
        }
    },
    persistence: 'session',
});

export {
    actions,
    reducer,
    getState,
    useModel
}