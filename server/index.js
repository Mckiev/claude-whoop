const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { Pool } = require('pg');
const whoopRouter = require('./routes/whoop');
const dataRouter = require('./routes/data');

const app = express();
dotenv.config();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files - place BEFORE routes
app.use(express.static(path.join(__dirname, '../')));

// API Routes
app.use('/api/whoop', whoopRouter);
app.use('/api/whoop/data', dataRouter);

// Serve index.html - this should be LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});