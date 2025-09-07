document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.getElementById('step1');
    const step3 = document.getElementById('step3');
    const errorContainer = document.getElementById('error-container');

    const authButton = document.getElementById('auth-button');
    const copyButton = document.getElementById('copy-button');
    const homeButton = document.getElementById('home-button');

    const accessTokenElement = document.getElementById('access-token');
    const errorMessageElement = document.getElementById('error-message');

    let appConfig;

    // --- Main App Logic ---

    async function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const shortLivedToken = urlParams.get('short_lived_token');

        if (code) {
            await handleCallback(code);
        } else if (shortLivedToken) {
            await handleShortLivedToken(shortLivedToken);
        } else {
            await loadConfigAndEnableButton();
        }
    }

    async function loadConfigAndEnableButton() {
        try {
            const response = await fetch('/.netlify/functions/getConfig');
            const data = await response.json();
            if (response.ok) {
                appConfig = data.app;
                authButton.textContent = 'Generate Token';
                authButton.disabled = false;
            } else {
                showError(data.error);
                authButton.textContent = 'Error loading config';
            }
        } catch (error) {
            showError(error.message);
            authButton.textContent = 'Error loading config';
        }
    }

    authButton.addEventListener('click', () => {
        if (appConfig) {
            const { appId, redirectUri, scope } = appConfig;
            const authUrl = `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
            window.location.href = authUrl;
        }
    });

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(accessTokenElement.textContent);
        alert('Access token copied to clipboard!');
    });

    homeButton.addEventListener('click', () => {
        window.location.href = '/';
    });

    // --- Helper Functions ---

    async function handleCallback(code) {
        step1.style.display = 'none';
        try {
            const response = await fetch(`/.netlify/functions/callback?code=${code}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details?.error?.message || 'Failed to exchange code for token');
            }
            // The callback function redirects, so the page will reload with a short_lived_token.
        } catch (error) {
            showError(error.message);
        }
    }

    async function handleShortLivedToken(token) {
        step1.style.display = 'none';
        try {
            const longLivedToken = await getLongLivedToken(token);
            accessTokenElement.textContent = longLivedToken;
            step3.style.display = 'block';
        } catch (error) {
            showError(error.message);
        }
    }

    async function getLongLivedToken(shortLivedToken) {
        const response = await fetch('/.netlify/functions/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: shortLivedToken }),
        });
        const data = await response.json();
        if (response.ok) {
            return data.access_token;
        } else {
            throw new Error(data.details?.error?.message || 'Failed to refresh token');
        }
    }

    function showError(message) {
        step1.style.display = 'none';
        step3.style.display = 'none';
        errorMessageElement.textContent = message;
        errorContainer.style.display = 'block';
    }

    // --- Start the app ---
    initialize();
});