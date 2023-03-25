import { TodoApp } from './app';
import { reducer } from './model';
import { TodoList } from "./types";

console.log((import.meta as any).data);

const TodoReducer = reducer as ((data: TodoList.State, action: any) => TodoList.State);

export {
  TodoApp,
  TodoReducer,
}
