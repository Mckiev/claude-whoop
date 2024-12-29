const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');
const router = express.Router();

// At the top of whoop.js, after the imports
const pool = new Pool({
  user: 'aimmachine',
  host: 'localhost',
  database: 'MouthTape',
  port: 5432
});

// Test database connection on startup
pool.connect()
  .then(() => console.log('Connected to database successfully'))
  .catch(err => {
      console.error('Database connection error:', err.message);
      console.error('Connection details:', {
          database: 'MouthTape',
          user: 'aimmachine',
          host: 'localhost',
          port: 5432
      });
  });
// OAuth initialization
router.get('/auth', async (req, res) => {
  try {
    console.log('All environment variables:', {
      redirect_uri: process.env.WHOOP_REDIRECT_URI,
      client_id: process.env.WHOOP_CLIENT_ID
    });
   
    console.log('Starting OAuth flow...');
    const scopes = 'offline read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement';
    
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth` +
      `?response_type=code` +
      `&client_id=${process.env.WHOOP_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.WHOOP_REDIRECT_URI)}` + 
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${state}`;

    console.log('Using redirect URI:', encodeURIComponent(process.env.WHOOP_REDIRECT_URI));
    console.log('Full auth URL:', authUrl);
    
    res.send(`
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100 min-h-screen flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 class="text-2xl font-bold mb-4">WHOOP Authorization</h2>
            <p class="mb-4">Click the link below to authorize:</p>
            <a href="${authUrl}" class="block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-center">
              Connect WHOOP Account
            </a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in auth route:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// OAuth callback handler
router.get('/callback', async (req, res) => {
  const { code, error, error_description, state } = req.query;

  if (error) {
    console.error('OAuth error received:', error, error_description);
    return res.status(400).send(`
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100 min-h-screen flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-red-600">Authorization Error</h2>
              <p class="mt-2 text-gray-600">${error_description || error}</p>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.WHOOP_CLIENT_ID);
    params.append('client_secret', process.env.WHOOP_CLIENT_SECRET);
    params.append('redirect_uri', process.env.WHOOP_REDIRECT_URI);

    const tokenResponse = await axios.post(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Get user profile to get email
    const userResponse = await axios.get('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    // Store or update user data
    await pool.query(
      `INSERT INTO whoop_users (email, access_token, refresh_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         access_token = $2,
         refresh_token = $3,
         updated_at = CURRENT_TIMESTAMP`,
      [userResponse.data.email, access_token, refresh_token]
    );

    res.send(`
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100 min-h-screen p-8">
          <div class="max-w-2xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-6">
              <h1 class="text-2xl font-bold mb-4">WHOOP Connected Successfully!</h1>
              <p class="text-gray-600">Your account has been connected and your data will be synced automatically.</p>
            </div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth error details:', error.response?.data || error);
    res.status(500).send(`
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100 min-h-screen flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-red-600">Connection Error</h2>
              <p class="mt-2 text-gray-600">Failed to connect to WHOOP API</p>
              <pre class="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto text-left">
${JSON.stringify(error.response?.data || error.message, null, 2)}
              </pre>
            </div>
          </div>
        </body>
      </html>
    `);
  }
});

module.exports = router;