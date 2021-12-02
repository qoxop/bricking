import React, { useMemo } from 'react';
import {bindActionCreators } from 'redux'
import { ReduxControler, useReduxController, ctrlEnhance} from 'react-ducky';
import { actions, useModel as useTodoModel, reducer } from './model';
import  { Todo, AddTodo, Filter } from './components';
import './style.less';

@ctrlEnhance({ bindThis: true })
class TodoController extends ReduxControler {
    actions: typeof actions;
    constructor(store) {
        super(store);
        this.actions = bindActionCreators(actions, this.dispatch);
    }
    useHooks() {
        const { filter, todos = [] } = useTodoModel();
        console.log(filter,todos);
        const todoArr = useMemo(() => todos.filter(todo => (
            (filter === 'unfinished' && !todo.finished) ||
            (filter === 'finished' && todo.finished) ||
            (filter === 'all')
        )), [todos, filter]);
        console.log(todoArr);
        return { filter, todos: todoArr }
    }
}

export default function TodoApp() {
    const [ctrl, { todos, filter }] = useReduxController(TodoController);
    console.log(todos)
    const bindActions = ctrl.actions;
    return (
        <TodoController.Provider controller={ctrl}>
            <div className="todo-module">
                <AddTodo onSave={ctrl.actions.addTodo} />
                <Filter type={filter} onChange={bindActions.setFilter} />
                <div>
                    {todos?.map(item => (<Todo
                        key={item.id}
                        todo={item}
                        onToggle={bindActions.toggleTodo}
                        onDelete={bindActions.delTodo}
                    />))}
                </div>
            </div>
        </TodoController.Provider>
        
    )
}

export {
    reducer
}