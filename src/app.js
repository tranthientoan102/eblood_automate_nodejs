const express = require('express');
const path = require('path');
const processUpdateRoute = require('./routes/processUpdate');
const processRoute = require('./routes/process');
const snowflakeRoute = require('./routes/snowflake'); // Import the Snowflake route

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/process-updates', processUpdateRoute); // Ensure this is correct
app.use('/process', processRoute);
app.use('/snowflake', snowflakeRoute); // Register the Snowflake route

module.exports = app;