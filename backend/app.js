const express = require('express');
const app= express();
const cors = require('cors');
const main = require('./config/database.js');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const adminRouter = require('./routes/admin');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const rideRouter = require('./routes/rides');
const requestRouter = require('./routes/requests');
const reviewRouter = require('./routes/reviews');
const chatRouter = require('./routes/chat');
const RideModel = require('./models/ride');

// WebSocket setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});

// Socket.io connection handling
const Chat = require('./models/chat');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user._id;
    socket.userName = `${user.firstName} ${user.lastName}`;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userName);
  
  // Join ride-specific room
  socket.on('join-ride', (rideId) => {
    const roomName = `ride-${rideId}`;
    socket.join(roomName);
    console.log(`${socket.userName} (${socket.userId}) joined room: ${roomName}`);
    
    // Get room info for debugging
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room) {
      console.log(`Room ${roomName} now has ${room.size} member(s)`);
    }
  });
  
  // Leave ride-specific room
  socket.on('leave-ride', (rideId) => {
    const roomName = `ride-${rideId}`;
    socket.leave(roomName);
    console.log(`${socket.userName} left room: ${roomName}`);
  });
  
  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { rideId, content } = data;
      
      // Save message to database
      const chat = await Chat.findOne({ rideId: rideId });
      if (!chat) {
        console.error('Chat not found for rideId:', rideId);
        return;
      }
      
      // Fetch user details to ensure we have complete sender information
      const senderUser = await User.findById(socket.userId);
      if (!senderUser) {
        console.error('User not found:', socket.userId);
        return;
      }
      
      const newMessage = {
        sender: socket.userId,
        content: content,
        timestamp: new Date()
      };
      
      chat.messages.push(newMessage);
      chat.lastMessage = new Date();
      await chat.save();
      
      // Broadcast message to all participants in the ride (including sender)
      const populatedMessage = {
        ...newMessage,
        sender: {
          _id: senderUser._id,
          firstName: senderUser.firstName,
          lastName: senderUser.lastName
        }
      };
      
      // Emit to all users in the ride room (including the sender)
      const roomName = `ride-${rideId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      
      if (room) {
        console.log(`Broadcasting message to room ${roomName} with ${room.size} member(s)`);
        io.to(roomName).emit('new-message', {
          rideId: rideId,
          message: populatedMessage
        });
        console.log(`Message sent by ${senderUser.firstName} ${senderUser.lastName} in ride ${rideId}`);
      } else {
        console.warn(`Room ${roomName} not found or empty`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Emit error back to sender
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userName);
  });
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/admin', adminRouter);
app.use('/rides', rideRouter);
app.use('/requests', requestRouter);
app.use('/reviews',  reviewRouter);
app.use('/chat', chatRouter);

main()
.then(()=>{
    console.log("Database connected successfully");
    // Ensure geospatial indexes exist for ride searches
    RideModel.syncIndexes().then(()=>{
        console.log('Ride indexes synced');
    }).catch((e)=>{
        console.error('Failed to sync Ride indexes', e.message);
    });
    server.listen(1511,()=>{
        console.log("Server is running on port 1511");
    });
})
.catch(err => console.log(err));