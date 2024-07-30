const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg'); // Assuming you're using PostgreSQL

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

// PostgreSQL client setup
const pool = new Pool({
  user: 'yourUsername',
  host: 'localhost',
  database: 'yourDatabase',
  password: 'yourPassword',
  port: 5432,
});

let activeUsers = [];

// Middleware to parse JSON requests
app.use(express.json());

io.on('connection', (socket) => {
  console.log('New client connected');

  // Event handlers...
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    activeUsers = activeUsers.filter((user) => user !== socket.username);
    io.emit('activeUsers', activeUsers);
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
