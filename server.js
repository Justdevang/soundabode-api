const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: ['https://soundabode.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Your reCAPTCHA v2 SECRET KEY
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '6Lesft8rAAAAANbZ6YazsT_SuhpMwLkMreYtn7W2';

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sound Abode reCAPTCHA API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /',
      verify: 'POST /api/verify-recaptcha'
    }
  });
});

// reCAPTCHA verification endpoint
app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;

    console.log('Received verification request');

    // Validate token is provided
    if (!token) {
      console.log('Error: No token provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Token is required' 
      });
    }

    // Verify the token with Google reCAPTCHA API
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token
    });

    console.log('Verifying with Google...');

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();

    // Log for debugging
    console.log('Google reCAPTCHA response:', {
      success: data.success,
      hostname: data.hostname,
      challenge_ts: data['challenge_ts'],
      errorCodes: data['error-codes']
    });

    // Check if verification failed
    if (!data.success) {
      console.log('Verification failed:', data['error-codes']);
      return res.json({ 
        success: false, 
        error: 'reCAPTCHA verification failed',
        errorCodes: data['error-codes'] || []
      });
    }

    // Verification successful
    console.log('Verification successful!');
    res.json({
      success: true,
      message: 'reCAPTCHA verification successful'
    });

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during verification'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'POST /api/verify-recaptcha'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Sound Abode API Server');
  console.log('=================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/`);
  console.log(`📍 Verify: http://localhost:${PORT}/api/verify-recaptcha`);
  console.log('=================================');
});
