const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For token-based authentication
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

// PostgreSQL client setup (adjust with your config)
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

// Secret for JWT
const JWT_SECRET = 'your_secret_key';

// User registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    res.status(201).send('User registered');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

// Middleware for token authentication
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('Token required');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token');
    }
    req.user = decoded;
    next();
  });
};

io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle message event
  socket.on('message', async ({ username, message, recipient, type, room }) => {
    const timestamp = new Date().toISOString();
    const messageData = { username, message, recipient, type, timestamp };

    try {
      if (room) {
        // Send message to a specific room
        socket.to(room).emit('message', messageData);
      } else if (recipient) {
        // Send message to a specific user
        const recipientSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.username === recipient
        );
        const senderSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.username === username
        );

        if (recipientSocket) {
          recipientSocket.emit('message', messageData);
        }
        if (senderSocket) {
          senderSocket.emit('message', messageData);
        }
      } else {
        // Broadcast public messages to all connected clients
        io.emit('message', messageData);
      }

      // Store the message in the database
      await pool.query('INSERT INTO messages (username, message, recipient, type, timestamp) VALUES ($1, $2, $3, $4, $5)', [username, message, recipient, type, timestamp]);
    } catch (error) {
      console.error('Error storing message:', error);
    }
  });

  // Register a new user
  socket.on('register', (username) => {
    socket.username = username;
    if (!activeUsers.includes(username)) {
      activeUsers.push(username);
      io.emit('activeUsers', activeUsers);
    }
  });

  // Join a room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`${socket.username} joined room ${room}`);
  });

  // Leave a room
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`${socket.username} left room ${room}`);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    activeUsers = activeUsers.filter((user) => user !== socket.username);
    io.emit('activeUsers', activeUsers);
  });
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
