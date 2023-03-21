import React from 'react';
import { TodoList } from '../model';

export function Todo(props: { 
    todo: TodoList.TodoItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="todo">
            <div className="checkbox">
                <input type="checkbox" checked={props.todo.finished} onChange={() => props.onToggle(props.todo.id)}name={props.todo.text} id={props.todo.id} />
            </div>
            <div className={`todo-text ${props.todo.finished ? 'finished' : ''}`}>
                <span>
                    {props.todo.text}
                </span>
            </div>
            <div className="todo-del" onClick={() => props.onDelete(props.todo.id)}>x</div>
        </div>
        
    )
}