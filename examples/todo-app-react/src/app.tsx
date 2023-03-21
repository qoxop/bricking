import React, { useContext } from 'react';
import { TodoController } from './controller'
import { useReduxController } from 'react-ducky';
import  { Todo, AddTodo, Filter } from './components';
import './style.css';

export function TodoApp() {
    console.log(useContext)
    const [ctrl, { todos, filter }] = useReduxController(TodoController);
    const bindActions = ctrl.actions;
    return (
        <div className="todo-module">
            <AddTodo onSave={ctrl.actions.addTodo} />
            <Filter type={filter} onChange={bindActions.setFilter} />
            <div>
                {todos.map(item => (<Todo
                    key={item.id}
                    todo={item}
                    onToggle={bindActions.toggleTodo}
                    onDelete={bindActions.delTodo}
                />))}
            </div>
        </div>
    )
}
