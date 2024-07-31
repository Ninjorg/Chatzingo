import React, { useState, useEffect, useRef } from 'react';
import './ChatRoom.css';

const ChatRoom = ({ username, userPermissions, socket }) => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    socket.on('message', (message) => {
      setChat((prevChat) => [...prevChat, message]);
    });

    socket.on('activeUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('typing', ({ user, isTyping }) => {
      setTypingUsers((prevTypingUsers) => {
        if (isTyping) {
          return [...prevTypingUsers, user];
        } else {
          return prevTypingUsers.filter((typingUser) => typingUser !== user);
        }
      });
    });

    return () => {
      socket.off('message');
      socket.off('activeUsers');
      socket.off('typing');
    };
  }, [socket]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('message', { username, message, recipient: selectedUser });
      setMessage('');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { user: username, isTyping: e.target.value.length > 0 });
  };

  return (
    <div className="chat-room">
      <div className="sidebar">
        <h2>Online Users</h2>
        <ul>
          {onlineUsers.map((user, index) => (
            <li key={index} onClick={() => setSelectedUser(user.username)}>
              @{user.username}
              {user.isOnline && <span className="online-dot"></span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-container" ref={chatContainerRef}>
        <div className="chat-messages">
          {chat.map((payload, index) => (
            <p key={index} className={payload.username === username ? 'user-message' : 'other-message'}>
              <strong>{payload.username}:</strong> {payload.message}
            </p>
          ))}
        </div>
        <div className="typing-indicator">
          {typingUsers.map((user, index) => (
            <span key={index}>{user} is typing...</span>
          ))}
        </div>
        <form className="message-form" onSubmit={sendMessage}>
          <input type="text" value={message} onChange={handleTyping} placeholder="Type a message..." />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
