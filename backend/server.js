const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
app.use(express.json());
connectDB();

// Update CORS configuration
app.use(cors({
    origin: 'http://localhost:5173', // Change this to match your frontend URL
    credentials: true, // Allow credentials (cookies, authorization headers)
}));

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
