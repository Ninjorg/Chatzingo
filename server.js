const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg'); // Assuming you're using PostgreSQL
const cors = require('cors'); // For handling CORS

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
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
app.use(cors()); // Use CORS middleware

// Middleware for user authentication
const authenticateUser = async (username, password) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
  return result.rows.length > 0;
};

// Socket.io event handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Event handler for user registration
  socket.on('register', async (username) => {
    socket.username = username;
    if (!activeUsers.includes(username)) {
      activeUsers.push(username);
      io.emit('activeUsers', activeUsers);
    }
  });

  // Event handler for sending messages
  socket.on('message', async ({ username, message, recipient, type }) => {
    console.log(`Message from ${username} to ${recipient || 'general'}: ${message}`);

    // Save message to database
    await pool.query(
      'INSERT INTO messages (username, message, recipient, type, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [username, message, recipient, type]
    );

    // Emit message to recipient or to general chat
    if (recipient) {
      io.to(recipient).emit('message', { username, message, recipient, type });
      io.to(username).emit('message', { username, message, recipient, type });
    } else {
      io.emit('message', { username, message, recipient, type });
    }
  });

  // Event handler for user disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (socket.username) {
      activeUsers = activeUsers.filter((user) => user !== socket.username);
      io.emit('activeUsers', activeUsers);
    }
  });

  // Event handler for retrieving initial messages
  socket.on('getInitialMessages', async () => {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50');
    socket.emit('initialMessages', result.rows);
  });
});

// Route for user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const isValidUser = await authenticateUser(username, password);
    if (isValidUser) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start the server
server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
