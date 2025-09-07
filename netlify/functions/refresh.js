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

        const response = await axios.get('https://graph.threads.net/access_token', {
            params: {
                grant_type: 'th_exchange_token',
                client_secret: app.appSecret,
                access_token: token,
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