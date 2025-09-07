const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const appsFilePath = path.join(__dirname, 'apps.json');

exports.handler = async (event) => {
    const { code } = event.queryStringParameters;

    if (!code) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Authorization code is missing' }) };
    }

    try {
        const app = JSON.parse(await fs.readFile(appsFilePath, 'utf8'));

        const response = await axios.post('https://graph.threads.net/oauth/access_token', null, {
            params: {
                client_id: app.appId,
                client_secret: app.appSecret,
                grant_type: 'authorization_code',
                redirect_uri: app.redirectUri,
                code: code,
            },
        });

        return {
            statusCode: 302,
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