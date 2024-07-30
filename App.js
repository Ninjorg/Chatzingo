import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import './index.css';

const socket = io.connect('http://localhost:4000');

const validUsers = [
  { username: 'user1', password: 'pass1', permissions: ['general'] },
  { username: 'user2', password: 'pass2', permissions: ['general'] },
  { username: 'admin', password: 'pass1', permissions: ['general', 'admin'] },
  { username: 'admin2', password: 'pass1', permissions: ['general', 'admin'] },
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
  const [typingUsers, setTypingUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const chatContainerRef = useRef(null);

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

    const handleTyping = ({ username, isTyping }) => {
      setTypingUsers((prevTypingUsers) => {
        if (isTyping) {
          return [...prevTypingUsers, username];
        } else {
          return prevTypingUsers.filter((user) => user !== username);
        }
      });
    };

    socket.on('message', handleMessage);
    socket.on('activeUsers', handleUserUpdate);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('message', handleMessage);
      socket.off('activeUsers', handleUserUpdate);
      socket.off('typing', handleTyping);
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
      <div className={`chat-room ${darkMode ? 'dark-mode' : ''}`}>
        <div className="sidebar">
          <h2>Your Channels</h2>
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
          <h1>{selectedUser ? `Chat with ${selectedUser}` : 'General Chat Room'}</h1>
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
          {filteredChat.map((payload, index) => (
            <div key={index} className="message">
              <div className={`message-content ${payload.username === username ? 'user-message' : 'other-message'}`}>
                {payload.type === 'image' ? (
                  <img src={payload.message} alt="Chat image" style={{ maxWidth: '600px', maxHeight: '600px' }} />
                ) : (
                  <>
                    <strong>{payload.username}:</strong> {payload.message}
                  </>
                )}
              </div>
              <div className="message-reactions">
                <span role="img" aria-label="like" onClick={() => handleReaction(payload, '👍')}>👍</span>
                <span role="img" aria-label="love" onClick={() => handleReaction(payload, '❤️')}>❤️</span>
                <span role="img" aria-label="laugh" onClick={() => handleReaction(payload, '😂')}>😂</span>
                {/* Add more reactions as needed */}
              </div>
            </div>
          ))}
          <form className="message-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onFocus={() => socket.emit('typing', { username, isTyping: true })}
              onBlur={() => socket.emit('typing', { username, isTyping: false })}
              autoFocus
            />
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    );
  };

  const handleReaction = (payload, reaction) => {
    socket.emit('reaction', { username, reaction, message: payload });
  };

  return (
    <Router>
      <Navbar />
      <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
        <button onClick={() => setDarkMode(!darkMode)} className="dark-mode-toggle">
          {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
        <Routes>
          <Route
            path="/"
            element={
              <div className="landing-page">
                <div className="banner">
                  <h1>What is Collabo?</h1>
                </div>
                <div className="content">
                  <p>
                    Created by Ronit, Collabo offers a platform for students to collaborate and work on projects together. Our aim is to foster creativity and teamwork through seamless collaboration tools and resources.
                  </p>
                  <div className="button-container">
                    <Link to="/chat"><button>Join Chat</button></Link>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/chat"
            element={
              !isLoggedIn ? (
                <form onSubmit={handleLogin} className="login-form">
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
                    onChange={(e)
