const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const appsFilePath = path.join(__dirname, 'apps.json');

exports.handler = async (event) => {
    // Assuming 'event' structure from a Netlify/AWS Lambda context
    // For local testing or different event sources, you might need to adjust how 'code' is extracted.
    const code = event.queryStringParameters ? event.queryStringParameters.code : null;

    if (!code) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Authorization code is missing' }) };
    }

    try {
        const app = JSON.parse(await fs.readFile(appsFilePath, 'utf8'));

        // Using Facebook Graph API endpoint for exchanging authorization code
        // Ensure app.appId, app.appSecret, and app.redirectUri are configured for Facebook in your apps.json
        const response = await axios.post('https://graph.facebook.com/v19.0/oauth/access_token', null, { // Using Facebook Graph API v19.0
            params: {
                client_id: app.appId, // Facebook App ID
                client_secret: app.appSecret, // Facebook App Secret
                grant_type: 'authorization_code',
                redirect_uri: app.redirectUri, // Must match the redirect URI configured in your Facebook App settings
                code: code, // The authorization code received from Facebook
            },
        });

        // The response will contain the short-lived access token and potentially other info
        return {
            statusCode: 302, // Redirect the user with the short-lived token
            headers: {
                Location: `/?short_lived_token=${response.data.access_token}`,
            },
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to exchange authorization code for access token',
                details: error.response ? error.response.data : error.message,
            }),
        };
    }
};
