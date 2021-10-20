import React, { useState } from 'react';
import { TodoModel } from '../model';

export function AddTodo(props: {
    onSave: (todo: TodoModel.TodoItem) => void,
}) {
    const [text, setText] = useState('');
    const submit = () => {
        if (text) {
            props.onSave({
                id: `${Date.now()}`,
                finished: false,
                text,
            });
            setText('');
        }
    }
    return (
        <div className="add-todo">
            <input type="text" value={text} onChange={e => setText(e.target.value)}/>
            <button disabled={!text} onClick={submit}>
                保存
            </button>
        </div>
    )
}