const Message = require('../models/Message');
const Room = require('../models/Room');

// Get messages for a room
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if room exists
    const roomExists = await Room.findById(roomId);
    if (!roomExists) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const messages = await Message.find({ room: roomId })
      .populate('user', 'name')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Create a new message
const createMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is in the room
    if (!room.participants.includes(userId)) {
      return res.status(403).json({ message: 'You must be in the room to send messages' });
    }
    
    const newMessage = await Message.create({
      room: roomId,
      user: userId,
      text
    });
    
    const populatedMessage = await Message.findById(newMessage._id).populate('user', 'name');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Failed to create message' });
  }
};

module.exports = {
  getRoomMessages,
  createMessage
};