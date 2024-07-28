import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './index.css'; // Make sure to add your CSS for styling

const socket = io.connect('http://localhost:4000');

const validUsers = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' },
  { username: 'admin', password: 'admin123' },
];

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLanding, setShowLanding] = useState(true); // New state for landing page
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const handleMessage = ({ username, message }) => {
      setChat((prevChat) => [...prevChat, { username, message }]);
    };

    socket.on('message', handleMessage);

    // Cleanup listener on component unmount
    return () => {
      socket.off('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = validUsers.find((user) => user.username === username && user.password === password);
    if (user) {
      setIsLoggedIn(true);
      setShowLanding(false); // Hide landing page after login
    } else {
      alert('Invalid username or password');
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
      {showLanding ? (
        <div className="landing-page">
          <div className="banner">
            <h1>Collabo</h1>
          </div>
          <div className="content">
            <p>
              Created by Ronit, Collabo offers a platform for students to collaborate and work on projects together. Our aim is to foster creativity and teamwork through seamless collaboration tools and resources.
            </p>
            <div className="button-container">
              <button onClick={() => setShowLanding(false)}>Enter</button>
            </div>
          </div>
        </div>
      ) : !isLoggedIn ? (
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username..."
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password..."
            required
          />
          <button type="submit">Join Chat</button>
        </form>
      ) : (
        <div>
          <h1>Chat Room</h1>
          <div className="chat-container" ref={chatContainerRef}>
            {chat.map((payload, index) => (
              <p
                key={index}
                className={payload.username === username ? 'user-message' : 'other-message'}
              >
                <strong>{payload.username}:</strong> {payload.message}
              </p>
            ))}
          </div>
          <form className="message-form" onSubmit={sendMessage}>
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
