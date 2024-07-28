import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:4000');

function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.on('message', ({ username, message }) => {
      setChat([...chat, { username, message }]);
    });
  }, [chat]);

  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit('message', { username: 'User', message });
    setMessage('');
  };

  return (
    <div className="App">
      <h1>Chat Room</h1>
      <div className="chat-container">
        {chat.map((payload, index) => (
          <p key={index}><strong>{payload.username}:</strong> {payload.message}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
