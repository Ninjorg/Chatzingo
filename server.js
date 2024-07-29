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

io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Client joined room: ${room}`);
  });

  // Leave a room
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`Client left room: ${room}`);
  });

  // Handle incoming messages
  socket.on('message', ({ username, message, room }) => {
    io.to(room).emit('message', { username, message });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
