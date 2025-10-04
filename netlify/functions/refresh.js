const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const appsFilePath = path.join(__dirname, 'apps.json');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { token } = JSON.parse(event.body);

        if (!token) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Short-lived token is required' }) };
        }

        const app = JSON.parse(await fs.readFile(appsFilePath, 'utf8'));

        // Exchange short-lived token for a long-lived Facebook access token
        const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', { // Using Facebook Graph API v19.0, adjust as needed
            params: {
                grant_type: 'fb_exchange_token',
                client_id: app.appId, // Assuming appId is stored in apps.json for Facebook
                client_secret: app.appSecret,
                fb_exchange_token: token, // Parameter for short-lived token is fb_exchange_token
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to exchange short-lived token for long-lived token',
                details: error.response ? error.response.data : error.message,
            }),
        };
    }
};
