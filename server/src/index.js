// Load environment variables from .env file
require('dotenv').config();

// libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware configuration
app.use(express.json()); // parse JSON request bodies
app.use(cors());         // fontend requests

// Test endpoint
app.get('/api/hello', (req, res) => {
    console.log('GET /api/hello called');
  res.json({ message: 'Backend hello' });
});

// port and MongoDB configuration
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nutrition';

// Merge with base and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error with connecting to MongoDB:', err);
  });
