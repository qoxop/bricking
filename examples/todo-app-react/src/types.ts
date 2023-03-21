export namespace TodoList {
  export type TodoItem = { id: string; finished: boolean; text: string; }
  export type FilterType = 'all'|'unfinished'|'finished';
  export interface State {
    todos: TodoItem[],
    filter: FilterType,
  }
}
