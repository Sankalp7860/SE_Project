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

app.use(cors({
    origin: 'http://localhost:8080', // Ensure this matches your frontend
    credentials: true, // Allow credentials (cookies, authentication headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));