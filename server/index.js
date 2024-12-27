// Add this at the top
const path = require('path');

// Add this before your routes
app.use(express.static(path.join(__dirname, '../')));

// Add this after your routes as a catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});


const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { Pool } = require('pg');
const whoopRouter = require('./routes/whoop');
const dataRouter = require('./routes/data'); // Add this line

const app = express();
dotenv.config();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/whoop', whoopRouter);
app.use('/api/whoop/data', dataRouter); // Add this line

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});