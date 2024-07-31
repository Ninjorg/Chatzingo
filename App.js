import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import './index.css';

const socket = io.connect('http://localhost:4000');

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

  useEffect(() => {
    const handleMessage = ({ username, message, recipient, type }) => {
      setChat((prevChat) => [...prevChat, { username, message, recipient, type }]);

      // Update unread messages count
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

    socket.on('message', handleMessage);
    socket.on('activeUsers', handleUserUpdate);

    return () => {
      socket.off('message', handleMessage);
      socket.off('activeUsers', handleUserUpdate);
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
      alert('Not registered: Please contact Ronit Parikh to get this issue resolved.');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const recipient = selectedUser || null;
      socket.emit('message', { username, message, recipient, type: 'text' });
      setMessage('');
      // Reset unread messages for the selected user
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
          const maxSize = 300; // Adjusted max size
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
      <div style={{ display: 'flex' }}>
        <div className="sidebar">
          <h2>YOUR CHANNELS:</h2>
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
          {filteredChat.map((payload, index) => (
            <p
              key={index}
              className={
                payload.username === username ? 'user-message' : 'other-message'
              }
            >
              {payload.type === 'image' ? (
                <img src={payload.message} alt="Chat image" style={{ maxWidth: '600px', maxHeight: '600px' }} />
              ) : (
                <>
                  <strong>{payload.username}:</strong> {payload.message}
                </>
              )}
            </p>
          ))}
          <form className="message-form" onSubmit={sendMessage}>
            <div>
              
            </div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                autoFocus
              />
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </form>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <Navbar />
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <div className="landing-page">
                <div className="banner">
                  <h1>What is Collabo</h1>
                </div>
                <div className="content">
                  <p>
                    Created by Ronit, Collabo offers a platform for students to collaborate and work on projects together. Our aim is to foster creativity and teamwork through seamless collaboration tools and resources.
                  </p>
                  <div className="button-container">
                    <a href="/chat"><button>Home</button></a>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/chat"
            element={
              !isLoggedIn ? (
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
                <ChatRoom />
              )
            }
          />
          <Route
            path="/about"
            element={
              <div className="about-page">
                <h1>About Collabo</h1>
                <p>
                  Collabo is a platform designed to help students collaborate on projects and ideas. Whether you're working on a school project, a startup idea, or just want to brainstorm with others, Collabo provides the tools and community to make it happen.
                </p>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
//whew
