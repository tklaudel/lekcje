const fs = require('fs');
const yaml = require('js-yaml');

function loadConfig(configPath) {
    try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(fileContents);

        // Merge with environment variables for secrets and overrides
        // We don't want to put secrets in YAML
        const envLogin = {
            username: process.env.LOGIN_USERNAME || process.env.USERNAME,
            password: process.env.PASSWORD,
        };

        if (process.env.ACCOUNT_NAME) {
            envLogin.accountName = process.env.ACCOUNT_NAME;
        }

        // Validate required secrets
        if (!envLogin.username || !envLogin.password) {
            throw new Error('Missing required environment variables: LOGIN_USERNAME (or USERNAME) and PASSWORD');
        }

        return {
            ...config,
            login: {
                ...config.login,
                ...envLogin
            }
        };
    } catch (e) {
        console.error(`Error loading config from ${configPath}:`, e.message);
        process.exit(1);
    }
}

module.exports = { loadConfig };
