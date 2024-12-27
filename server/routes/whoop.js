const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// OAuth initialization
router.get('/auth', async (req, res) => {
  try {
    console.log('Starting OAuth flow...');
    const scopes = 'offline read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement';
    
    // Generate a random state parameter
    const state = crypto.randomBytes(16).toString('hex');
    
    console.log('Client ID:', process.env.WHOOP_CLIENT_ID);
    console.log('Redirect URI:', process.env.WHOOP_REDIRECT_URI);
    console.log('State:', state);
    
    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth` +
      `?response_type=code` +
      `&client_id=${process.env.WHOOP_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.WHOOP_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${state}`;

    console.log('Auth URL:', authUrl);
    
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
  console.log('Callback received with query params:', req.query);
  const { code, error, error_description, state } = req.query;

  if (error) {
    console.error('OAuth error received:', error, error_description);
    console.error('State received:', state);
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
    console.error('No code received in callback');
    return res.status(400).send('No authorization code received');
  }

  try {
    // Create form data for token request
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.WHOOP_CLIENT_ID);
    params.append('client_secret', process.env.WHOOP_CLIENT_SECRET);
    params.append('redirect_uri', process.env.WHOOP_REDIRECT_URI);

    console.log('Full token request details:', {
      url: 'https://api.prod.whoop.com/oauth/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Token response received:', tokenResponse.data);

    const { access_token, refresh_token } = tokenResponse.data;

    // Fetch user data
    const userResponse = await axios.get('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    res.send(`
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100 min-h-screen p-8">
          <div class="max-w-2xl mx-auto">
            <div class="bg-white rounded-lg shadow-md p-6">
              <h1 class="text-2xl font-bold mb-4">WHOOP Connected Successfully!</h1>
              
              <div class="mb-6">
                <h2 class="text-lg font-semibold mb-2">User Info</h2>
                <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">
${JSON.stringify(userResponse.data, null, 2)}
                </pre>
              </div>

              <div class="space-y-4">
                <div>
                  <h2 class="text-lg font-semibold mb-2">Access Token</h2>
                  <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto">${access_token}</pre>
                </div>
                
                <div>
                  <h2 class="text-lg font-semibold mb-2">Refresh Token</h2>
                  <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto">${refresh_token}</pre>
                </div>
              </div>
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
              <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h2 class="mt-4 text-2xl font-bold text-gray-900">Connection Error</h2>
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

// Optional: Add a route to handle token refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);
    params.append('client_id', process.env.WHOOP_CLIENT_ID);
    params.append('client_secret', process.env.WHOOP_CLIENT_SECRET);

    const tokenResponse = await axios.post(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json(tokenResponse.data);
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error);
    res.status(500).json({ 
      error: 'Failed to refresh token', 
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;