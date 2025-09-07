const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const appsFilePath = path.join(__dirname, 'apps.json');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const app = JSON.parse(await fs.readFile(appsFilePath, 'utf8'));

        return {
            statusCode: 200,
            body: JSON.stringify({ app: app }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An unexpected error occurred.', details: error.message }),
        };
    }
};