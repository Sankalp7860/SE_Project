const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');

dotenv.config();
const app = express();
app.use(express.json());
connectDB();

// Socket.io and HTTP server imports
const http = require('http');
const { Server } = require('socket.io');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Apply CORS middleware - single configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS options
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Add your frontend URLs
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Leave room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);
  });

  // Send message
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  // Update song
  socket.on('update_song', (data) => {
    socket.to(data.roomId).emit('song_updated', data);
  });

  // Update playback state (play/pause)
  socket.on('update_playback_state', (data) => {
    socket.to(data.roomId).emit('playback_state_updated', {
      isPlaying: data.isPlaying,
      currentTime: data.currentTime
    });
  });

  // Update playback time (for seeking)
  socket.on('update_playback_time', (data) => {
    socket.to(data.roomId).emit('playback_time_updated', {
      currentTime: data.currentTime
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Change app.listen to server.listen
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});