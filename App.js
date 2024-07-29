// App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import './index.css';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Connect to Socket.io server
const socket = io.connect('http://localhost:4000');

// Sample user data
const validUsers = [
  { username: 'user1', password: bcrypt.hashSync('pass1', 8), permissions: ['general'], profilePic: 'user1.jpg', bio: 'Hello, I am user1!' },
  { username: 'user2', password: bcrypt.hashSync('pass2', 8), permissions: ['general'], profilePic: 'user2.jpg', bio: 'Hey there, I am user2!' },
  { username: 'admin', password: bcrypt.hashSync('admin', 8), permissions: ['admin'], profilePic: 'admin.jpg', bio: 'Admin here, at your service!' },
];

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [rooms, setRooms] = useState(['general', 'sports', 'music']);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    socket.on('message', ({ username, message, timestamp, room }) => {
      if (room === currentRoom) {
        setChat((prevChat) => [...prevChat, { username, message, timestamp }]);
      }
    });

    socket.on('typing', ({ username, room }) => {
      if (room === currentRoom) {
        setIsTyping(username);
      }
    });

    return () => {
      socket.off('message');
      socket.off('typing');
    };
  }, [currentRoom]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = validUsers.find((user) => user.username === username && bcrypt.compareSync(password, user.password));
    if (user) {
      setIsLoggedIn(true);
      setUserPermissions(user.permissions);
      setUserProfile({ username: user.username, profilePic: user.profilePic, bio: user.bio });
      alert('Login successful!');
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const existingUser = validUsers.find((user) => user.username === newUsername);
    if (!existingUser) {
      validUsers.push({ username: newUsername, password: bcrypt.hashSync(newPassword, 8), permissions: ['general'], profilePic: 'default.jpg', bio: 'New user' });
      alert('Registration successful! Please log in.');
    } else {
      alert('Username already exists.');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      socket.emit('message', { username, message, timestamp, room: currentRoom });
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = () => {
    socket.emit('typing', { username, room: currentRoom });
  };

  const ChatRoom = () => {
    return (
      <div>
        <h1>Chat Room: {currentRoom}</h1>
        <div className="chat-container" ref={chatContainerRef}>
          {chat.map((payload, index) => (
            <div key={index} className={`message ${payload.username === username ? 'user-message' : 'other-message'}`}>
              <div className="message-header">
                <strong>{payload.username}</strong> <span>{payload.timestamp}</span>
              </div>
              <p>{payload.message}</p>
            </div>
          ))}
          {isTyping && <p>{isTyping} is typing...</p>}
        </div>
        <form className="message-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleTyping}
            placeholder="Type a message..."
            autoFocus
          />
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
          <button type="submit">Send</button>
          {showEmojiPicker && <EmojiPicker onEmojiClick={(e, emoji) => setMessage(message + emoji.emoji)} />}
        </form>
      </div>
    );
  };

  return (
    <Router>
      <Navbar toggleDarkMode={() => setDarkMode(!darkMode)} darkMode={darkMode} />
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <Routes>
          <Route
            path="/"
            element={
              <div className="landing-page">
                <div className="banner">
                  <h1>Welcome to Collabo</h1>
                </div>
                <div className="content">
                  <p>
                    Collabo is a platform designed to enhance collaboration among students. Whether you're working on a school project or brainstorming ideas, our tools help you connect and succeed.
                  </p>
                  <div className="button-container">
                    <Link to="/chat"><button>Enter Chat</button></Link>
                    <Link to="/about"><button>About Us</button></Link>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/chat"
            element={
              !isLoggedIn ? (
                <div className="auth-forms">
                  <form onSubmit={handleLogin} className="login-form">
                    <h2>Login</h2>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                    />
                    <button type="submit">Login</button>
                    <p>Don't have an account? <Link to="/register">Register</Link></p>
                  </form>
                  <form onSubmit={handleRegister} className="register-form">
                    <h2>Register</h2>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="New Username"
                      required
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      required
                    />
                    <button type="submit">Register</button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="room-selector">
                    {rooms.map((room) => (
                      <button
                        key={room}
                        className={room === currentRoom ? 'active-room' : ''}
                        onClick={() => {
                          setCurrentRoom(room);
                          setChat([]);
                          socket.emit('joinRoom', room);
                        }}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                  <ChatRoom />
                </div>
              )
            }
          />
          <Route
            path="/about"
            element={
              <div className="about-page">
                <h1>About Collabo</h1>
                <p>
                  Collabo is designed for students to work together on projects and ideas. We provide a platform to connect and collaborate seamlessly. Join us and be part of the collaborative community!
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
