// App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import './index.css';

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
  const [showLanding, setShowLanding] = useState(true);
  const [currentRoom, setCurrentRoom] = useState('General');
  const chatContainerRef = useRef(null);

  const rooms = ['General', 'Room1', 'Room2', 'Room3', 'Room4', 'Room5', 'Room6', 'Room7', 'Room8', 'Room9', 'Room10'];

  useEffect(() => {
    socket.emit('joinRoom', currentRoom);

    const handleMessage = ({ username, message, room }) => {
      if (room === currentRoom) {
        setChat((prevChat) => [...prevChat, { username, message }]);
      }
    };

    socket.on('message', handleMessage);

    return () => {
      socket.emit('leaveRoom', currentRoom);
      socket.off('message', handleMessage);
    };
  }, [currentRoom]);

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
      setShowLanding(false);
    } else {
      alert('Not registered: Please contact Ronit Parikh to get this issue resolved.');
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('message', { username, message, room: currentRoom });
      setMessage('');
    }
  };

  const handleRoomChange = (room) => {
    socket.emit('leaveRoom', currentRoom);
    setCurrentRoom(room);
    setChat([]); // Clear chat on room change
    socket.emit('joinRoom', room);
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
                    <button onClick={() => setShowLanding(false)}>Enter</button>
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
                <div>
                  <h1>Chat Room - {currentRoom}</h1>
                  <div className="room-selector">
                    {rooms.map((room) => (
                      <button key={room} onClick={() => handleRoomChange(room)}>
                        {room}
                      </button>
                    ))}
                  </div>
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
