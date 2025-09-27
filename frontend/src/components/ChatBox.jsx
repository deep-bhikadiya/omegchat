import React, { useState } from 'react';

export default function ChatBox({ messages, onSend }){
  const [text, setText] = useState('');
  const send = () => {
    if(!text) return;
    onSend(text);
    setText('');
  };
  return (
    <div className="chatbox">
      <div className="messages">
        {messages.map((m,i) => (
          <div key={i} className={`msg ${m.event ? 'event' : ''}`}>
            {m.event ? <em>{m.text}</em> : (<><b>{m.from}</b>: {m.text}</>)}
          </div>
        ))}
      </div>
      <div className="chat-controls">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
