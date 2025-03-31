const express = require('express');
const fileUpload = require('express-fileupload');
const { processHandler } = require('../controllers/processController');

const router = express.Router();

// Middleware to handle file uploads
router.use(fileUpload());

// Define the /process route
router.post('/', processHandler);

module.exports = router;