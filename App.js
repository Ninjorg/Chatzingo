// App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import './index.css';
import UserProfile from './UserProfile';
import DirectMessages from './DirectMessages';

// Connect to Socket.io server
const socket = io.connect('http://localhost:4000');

// Sample user data with more detailed profiles
const validUsers = [
  { id: 1, username: 'user1', password: bcrypt.hashSync('pass1', 8), permissions: ['general'], profilePic: 'user1.jpg', bio: 'Hello, I am user1!', interests: 'Gaming, Music', status: 'online' },
  { id: 2, username: 'user2', password: bcrypt.hashSync('pass2', 8), permissions: ['general'], profilePic: 'user2.jpg', bio: 'Hey there, I am user2!', interests: 'Books, Travel', status: 'offline' },
  { id: 3, username: 'admin', password: bcrypt.hashSync('admin', 8), permissions: ['admin'], profilePic: 'admin.jpg', bio: 'Admin here, at your service!', interests: 'Tech, Sports', status: 'online' },
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
  const [dmOpen, setDmOpen] = useState(false);
  const [selectedUserForDM, setSelectedUserForDM] = useState(null);
  const [file, setFile] = useState(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

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

    socket.on('dm', ({ fromUser, toUser, message }) => {
      if (toUser === username) {
        // Handle incoming direct message
        alert(`New message from ${fromUser}: ${message}`);
      }
    });

    return () => {
      socket.off('message');
      socket.off('typing');
      socket.off('dm');
    };
  }, [currentRoom, username]);

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
      setUserProfile({ id: user.id, username: user.username, profilePic: user.profilePic, bio: user.bio, interests: user.interests });
      alert('Login successful!');
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const existingUser = validUsers.find((user) => user.username === newUsername);
    if (!existingUser) {
      validUsers.push({ id: uuidv4(), username: newUsername, password: bcrypt.hashSync(newPassword, 8), permissions: ['general'], profilePic: 'default.jpg', bio: 'New user', interests: '', status: 'online' });
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

  const sendDirectMessage = (e, toUser) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('dm', { fromUser: username, toUser, message });
      setMessage('');
      setSelectedUserForDM(null);
      setDmOpen(false);
    }
  };

  const handleTyping = () => {
    socket.emit('typing', { username, room: currentRoom });
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(URL.createObjectURL(uploadedFile));
    }
  };

  const UserProfilePage = () => {
    return (
      <UserProfile profile={userProfile} />
    );
  };

  const DirectMessagesPage = () => {
    return (
      <DirectMessages users={validUsers} onSelectUser={(user) => { setSelectedUserForDM(user); setDmOpen(true); }} />
    );
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
          <input type="file" onChange={handleFileUpload} />
          {file && <img src={file} alt="Preview" className="image-preview" />}
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
                <div className="auth-page">
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
                    <button type="submit">Login</button>
                  </form>
                  <div>
                    <h2>New here? Register now!</h2>
                    <form onSubmit={handleRegister}>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Choose a username..."
                        required
                      />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Choose a password..."
                        required
                      />
                      <button type="submit">Register</button>
                    </form>
                  </div>
                </div>
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
                  Collabo is a cutting-edge platform for student collaboration. With features like real-time chat, file sharing, and customizable profiles, we're here to support your academic and creative projects.
                </p>
              </div>
            }
          />
          <Route
            path="/profile"
            element={<UserProfilePage />}
          />
          <Route
            path="/direct-messages"
            element={<DirectMessagesPage />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
