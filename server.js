const io = require('socket.io')(4000); // Import socket.io server-side

const users = {}; // Track users and their socket IDs

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Set username and store the socket ID
  socket.on('setUsername', (username) => {
    users[username] = socket.id;
    console.log(`Username set for socket ${socket.id}: ${username}`);
    // Notify user that they have successfully connected
    socket.emit('message', { username: 'System', message: 'You are now connected.', private: true });
  });

  // Handle incoming messages
  socket.on('message', ({ username, message }) => {
    if (message.startsWith('@')) {
      // Private message
      const [recipient, ...msgArray] = message.slice(1).split(' ');
      const msg = msgArray.join(' ');
      if (users[recipient]) {
        io.to(users[recipient]).emit('message', { username, message: msg, private: true });
      } else {
        // Optionally, notify the sender if the recipient is not found
        socket.emit('message', { username: 'System', message: `User ${recipient} not found.`, private: true });
      }
    } else {
      // Public message
      io.emit('message', { username, message, private: false });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from the tracking object
    for (const [username, id] of Object.entries(users)) {
      if (id === socket.id) {
        delete users[username];
        break;
      }
    }
  });
});
