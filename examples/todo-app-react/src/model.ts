import { createModel, PayloadAction } from "react-ducky";
import { TodoList } from "./types";


const initialState:TodoList.State = {
    todos: [] as TodoList.TodoItem[],
    filter: 'all',
}

const { actions, reducer, getState, useModel, name } =  createModel({
    name: "todo",
    statePaths: ['todo'],
    initialState,
    reducers: {
        addTodo(state, action: PayloadAction<TodoList.TodoItem>) {
            const { payload } = action;
            state.todos.push(payload);
        },
        toggleTodo(state, action: PayloadAction<string>) {
            const { payload } = action;
            // @ts-ignore
            const curTode = state.todos.find((todo) => todo.id === payload);
            if (curTode) {
                curTode.finished = !curTode.finished;
            }
        },
        delTodo(state, action: PayloadAction<string>) {
            const { payload } = action;
            state.todos = state.todos.filter(todo => todo.id !== payload);
        },
        setFilter(state, action: PayloadAction<TodoList.FilterType>) {
            state.filter = action.payload;
        }
    },
    cacheKey: 'todo-list',
    cacheStorage: 'local',
}) as any;

export {
    actions,
    reducer,
    getState,
    useModel,
    name
}
