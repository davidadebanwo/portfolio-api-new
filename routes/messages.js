const express = require('express');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const verifyToken = require('../middleware/auth');
const router = express.Router();

// Valid portfolio sources - add your portfolio domains here
const VALID_SOURCES = [
  'davidadebanwo.com',
  'emmanueladama.com'
];

// --- AUTH ROUTE ---
router.post('/login', (req, res) => {
  const { password } = req.body;

  // In production, use process.env.ADMIN_PASSWORD
  // fallback is 'admin123' for testing if env not set
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === validPassword) {
    // Create token
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET || 'your_fallback_secret_key',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token: token
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid password'
  });
});

// POST route to create a new message (PUBLIC - No Auth needed)
router.post('/messages', async (req, res) => {
  try {
    const { name, email, subject, message, source } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, subject, message'
      });
    }

    // Validate and set source (default to davidadebanwo.com if not provided)
    let messageSource = source || 'davidadebanwo.com';

    // Validate that source is allowed
    // Note: If you want to allow dynamic sources, you can remove this check or make it more flexible
    if (!VALID_SOURCES.includes(messageSource)) {
      // Optional: Log this occurrence but maybe still save it with a 'unknown' source or reject
      // For now, stricter validation:
      // return res.status(400).json({
      //   success: false,
      //   message: `Invalid source. Allowed sources: ${VALID_SOURCES.join(', ')}`
      // });

      // Lenient Mode: Just accept it, or default to main
      // messageSource = 'davidadebanwo.com';
    }

    // Create a new message
    const newMessage = await Message.create({
      name,
      email,
      subject,
      message,
      source: messageSource
    });

    res.status(201).json({
      success: true,
      message: 'Message received and saved successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error saving message:', error);

    // Check for validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while saving the message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET route to retrieve all messages (PROTECTED)
router.get('/messages', verifyToken, async (req, res) => {
  try {
    const { source } = req.query;

    // Build query options
    const queryOptions = {
      order: [['createdAt', 'DESC']]
    };

    // If source is specified, filter by it
    if (source) {
      queryOptions.where = { source };
    }

    const messages = await Message.findAll(queryOptions);

    res.status(200).json({
      success: true,
      count: messages.length,
      source: source || 'all',
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET route to retrieve messages for a specific portfolio source (PROTECTED)
router.get('/messages/:source', verifyToken, async (req, res) => {
  try {
    const { source } = req.params;

    const messages = await Message.findAll({
      where: { source },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      source,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET route to list available sources (PROTECTED)
router.get('/sources', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    sources: VALID_SOURCES
  });
});

module.exports = router;
