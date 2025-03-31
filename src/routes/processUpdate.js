const express = require('express');
const { processUpdateHandler } = require('../controllers/processUpdateController');

const router = express.Router();

// Define the route for SSE updates
router.get('/', processUpdateHandler);

module.exports = router;