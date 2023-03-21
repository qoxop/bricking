import { useMemo } from 'react';
import { Controller } from 'react-ducky';
import { actions, useModel as useTodoModel,  } from './model';
import { TodoList } from "./types";

export class TodoController extends Controller {
    actions = actions;
    useHooks() {
        const { filter, todos } = useTodoModel();
        const todoArr = useMemo(() => this.filterTodos(todos, filter), [todos, filter]);
        return { filter, todos: todoArr }
    }
    filterTodos = (todos: TodoList.TodoItem[], filter: TodoList.FilterType) => {
        switch(filter) {
            case 'finished': return todos.filter(todo => todo.finished);
            case 'unfinished': return todos.filter(todo => !todo.finished);
            default: return todos;
        }
    }
}
