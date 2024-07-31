import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import './index.css';

// Initialize socket connection
const socket = io.connect('http://localhost:4000');

// Sample valid users for authentication
const validUsers = [
  { username: 'user1', password: 'pass1', permissions: ['general'] },
  { username: 'user2', password: 'pass2', permissions: ['general'] },
  { username: 'admin', password: 'pass1', permissions: ['general'] },
  { username: 'admin2', password: 'pass1', permissions: ['general'] },
];

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const chatContainerRef = useRef(null);

  // Handle socket events and chat scroll
  useEffect(() => {
    const handleMessage = ({ username, message, recipient, type }) => {
      setChat((prevChat) => [...prevChat, { username, message, recipient, type }]);

      if (recipient !== username) {
        setUnreadMessages((prevUnreadMessages) => ({
          ...prevUnreadMessages,
          [recipient]: (prevUnreadMessages[recipient] || 0) + 1,
        }));
      }
    };

    const handleUserUpdate = (users) => {
      setOnlineUsers(users);
    };

    const handleInitialMessages = (msgs) => {
      setChat(msgs);
    };

    socket.on('message', handleMessage);
    socket.on('activeUsers', handleUserUpdate);
    socket.on('initialMessages', handleInitialMessages);

    return () => {
      socket.off('message', handleMessage);
      socket.off('activeUsers', handleUserUpdate);
      socket.off('initialMessages', handleInitialMessages);
    };
  }, [username]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = validUsers.find((user) => user.username === username && user.password === password);
    if (user) {
      setIsLoggedIn(true);
      setUserPermissions(user.permissions);
      socket.emit('register', username);
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const recipient = selectedUser || null;
      socket.emit('message', { username, message, recipient, type: 'text' });
      setMessage('');
      if (recipient && unreadMessages[recipient]) {
        setUnreadMessages((prevUnreadMessages) => ({
          ...prevUnreadMessages,
          [recipient]: 0,
        }));
      }
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          socket.emit('message', { username, message: dataUrl, recipient: selectedUser || null, type: 'image' });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const ChatRoom = () => {
    const filteredChat = chat.filter(({ username: msgUsername, recipient }) => {
      if (selectedUser) {
        return (
          (msgUsername === username && recipient === selectedUser) ||
          (recipient === username && msgUsername === selectedUser)
        );
      } else {
        return !recipient;
      }
    });

    return (
      <div className="chat-room">
        <div className="sidebar">
          <h2>Your Channels:</h2>
          <ul>
            <li
              onClick={() => setSelectedUser(null)}
              className={!selectedUser ? 'active' : ''}
            >
              #General Chat {unreadMessages[null] ? <span className="message-count">+{unreadMessages[null]}</span> : null}
              {onlineUsers.includes(null) && <span className="green-dot"></span>}
            </li>
            {validUsers
              .filter(user => user.username !== username)
              .map((user, index) => (
                <li
                  key={index}
                  onClick={() => setSelectedUser(user.username)}
                  className={selectedUser === user.username ? 'active' : ''}
                >
                  @{user.username}
                  {onlineUsers.includes(user.username) && (
                    <span className="green-dot"></span>
                  )}
                  {unreadMessages[user.username] ? <span className="message-count">+{unreadMessages[user.username]}</span> : null}
                </li>
              ))}
          </ul>
        </div>
        <div className="chat-container" ref={chatContainerRef}>
          {filteredChat.map((msg, index) => (
            <div key={index} className={`message ${msg.username === username ? 'sent' : 'received'}`}>
              {msg.type === 'image' ? (
                <img src={msg.message} alt="message" />
              ) : (
                <p>{msg.message}</p>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="message-form">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="fileInput"
          />
          <label htmlFor="fileInput" className="upload-button">Upload Image</label>
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
  };

  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={
            !isLoggedIn ? (
              <form onSubmit={handleLogin} className="login-form">
                <label>
                  Username:
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label>
                  Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button type="submit">Login</button>
              </form>
            ) : (
              <ChatRoom />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
