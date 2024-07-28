import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './index.css';

const socket = io.connect('http://localhost:4000');

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    socket.on('message', ({ username, message }) => {
      setChat([...chat, { username, message }]);
    });
  }, [chat]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username) {
      setIsLoggedIn(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('message', { username, message });
      setMessage('');
    }
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username..."
            required
          />
          <button type="submit">Join Chat</button>
        </form>
      ) : (
        <div>
          <h1>Chat Room</h1>
          <div className="chat-container">
            {chat.map((payload, index) => (
              <p
                key={index}
                className={payload.username === username ? 'user-message' : 'other-message'}
              >
                <strong>{payload.username}:</strong> {payload.message}
              </p>
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
      )}
    </div>
  );
}

export default App;
