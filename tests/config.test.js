const { loadConfig } = require('../src/config');
const fs = require('fs');
const yaml = require('js-yaml');

jest.mock('fs');
jest.mock('js-yaml');

describe('Config Module', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    test('should load config and merge with environment variables', () => {
        const mockYaml = {
            baseUrl: 'https://example.com',
            login: { url: '/login' },
            steps: []
        };

        fs.readFileSync.mockReturnValue('yaml content');
        yaml.load.mockReturnValue(mockYaml);

        process.env.LOGIN_USERNAME = 'testuser';
        process.env.PASSWORD = 'testpass';

        const config = loadConfig('config.yaml');

        expect(config.baseUrl).toBe('https://example.com');
        expect(config.login.username).toBe('testuser');
        expect(config.login.password).toBe('testpass');
    });

    test('should throw error if required env vars are missing', () => {
        const mockYaml = {
            baseUrl: 'https://example.com',
            login: { url: '/login' }
        };

        fs.readFileSync.mockReturnValue('yaml content');
        yaml.load.mockReturnValue(mockYaml);

        delete process.env.LOGIN_USERNAME;
        delete process.env.USERNAME;
        delete process.env.PASSWORD;

        // Mock process.exit to prevent test from exiting
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });

        // Suppress console.error
        jest.spyOn(console, 'error').mockImplementation(() => { });

        loadConfig('config.yaml');

        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
