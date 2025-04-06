const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');

dotenv.config();
const app = express();
app.use(express.json());
connectDB();

// Fix: Remove duplicate CORS configuration and use a single one
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Add this near the top of your server.js file
// const http = require('http');
// const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer(app);
const PORT=5050;
// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available to our routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  // Leave a room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  // Handle messages
  socket.on('send_message', (message) => {
    console.log('Message received:', message);
    socket.to(message.room).emit('receive_message', message);
  });
  
  // Handle song updates
  socket.on('update_song', (data) => {
    console.log('Song update received:', data);
    socket.to(data.roomId).emit('song_updated', data);
  });
});

// Replace app.listen with server.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});