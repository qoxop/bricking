import React from 'react';
import { TodoController } from './controller'
import { useReduxController } from 'react-ducky';
import  { Todo, AddTodo, Filter } from './components';
import ReactIcon from './react.svg';
import './style.css';

export function TodoApp() {
    const [ctrl, { todos, filter }] = useReduxController(TodoController);
    const bindActions = ctrl.actions;
    return (
        <div className="todo-module">
            <div>
              <img src={ReactIcon} alt=""/>
            </div>
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
