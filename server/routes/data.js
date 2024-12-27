const express = require('express');
const axios = require('axios');
const router = express.Router();

// Example endpoint to get recovery data
router.get('/recovery', async (req, res) => {
    try {
        const bearerToken = req.headers.authorization.replace('Bearer ', '');
        console.log('Using token for recovery:', bearerToken.substring(0, 10) + '...');
        
        const response = await axios.get('https://api.prod.whoop.com/developer/v1/recovery', {
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching recovery data:', error.response?.data);
        res.status(500).json({
            error: 'Failed to fetch recovery data',
            details: error.response?.data
        });
    }
});

// Get sleep data
router.get('/sleep', async (req, res) => {
    try {
        const bearerToken = req.headers.authorization.replace('Bearer ', '');
        console.log('Using token for sleep:', bearerToken.substring(0, 10) + '...');
        
        const response = await axios.get('https://api.prod.whoop.com/developer/v1/activity/sleep', {
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching sleep data:', error.response?.data);
        res.status(500).json({
            error: 'Failed to fetch sleep data',
            details: error.response?.data
        });
    }
});

// Get workout data
router.get('/workouts', async (req, res) => {
    try {
        const bearerToken = req.headers.authorization.replace('Bearer ', '');
        console.log('Using token for workouts:', bearerToken.substring(0, 10) + '...');
        
        const response = await axios.get('https://api.prod.whoop.com/developer/v1/activity/workout', {
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching workout data:', error.response?.data);
        res.status(500).json({
            error: 'Failed to fetch workout data',
            details: error.response?.data
        });
    }
});

module.exports = router;