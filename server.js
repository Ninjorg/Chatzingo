const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

let users = {}; // Store users and their corresponding socket IDs
let messageHistory = {}; // Store message history for rooms

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', ({ username, room }) => {
    if (!username || !room) {
      socket.emit('error', { message: 'Username and room are required' });
      return;
    }
    socket.join(room);
    users[socket.id] = { username, room };
    messageHistory[room] = messageHistory[room] || [];

    // Emit previous messages
    socket.emit('messageHistory', messageHistory[room]);

    // Notify room of new user
    io.to(room).emit('message', { username: 'Admin', message: `${username} has joined the room.` });

    console.log(`${username} joined room ${room}`);
  });

  socket.on('message', ({ message }) => {
    const user = users[socket.id];
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }
    const { username, room } = user;

    // Save message to history
    const fullMessage = { username, message, timestamp: new Date() };
    messageHistory[room] = messageHistory[room] || [];
    messageHistory[room].push(fullMessage);

    io.to(room).emit('message', fullMessage);
  });

  socket.on('privateMessage', ({ toUsername, message }) => {
    const fromUser = users[socket.id];
    if (!fromUser) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const toUserSocketId = Object.keys(users).find(
      (key) => users[key].username === toUsername
    );

    if (toUserSocketId) {
      const { username: fromUsername } = fromUser;
      io.to(toUserSocketId).emit('privateMessage', { fromUsername, message });
    } else {
      socket.emit('error', { message: 'Recipient not found' });
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      const { username, room } = user;
      io.to(room).emit('message', { username: 'Admin', message: `${username} has left the room.` });
      delete users[socket.id];
      console.log(`${username} disconnected from room ${room}`);
    }
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
