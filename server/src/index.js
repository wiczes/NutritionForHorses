// Load environment variables from .env file
require('dotenv').config();

// libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));
const feedsRouter = require('./routes/pasze');
app.use('/api/pasze', feedsRouter);

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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((mongooseInstance) => {
    console.log('Connected to MongoDB');
    const db = mongooseInstance.connection.db;
    app.locals.db = db;
    app.listen(PORT, () => {
      console.log(`Server running: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
