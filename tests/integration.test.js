const { login } = require('../src/auth');
const { processSteps } = require('../src/actions');

// Mock sharp
jest.mock('sharp', () => () => ({
    grayscale: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(true)
}));

describe('Integration Logic', () => {
    let mockPage;

    beforeEach(() => {
        mockPage = {
            goto: jest.fn(),
            waitForSelector: jest.fn(),
            locator: jest.fn(),
            url: jest.fn(),
            evaluate: jest.fn(),
            screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
            $: jest.fn(),
            waitForLoadState: jest.fn(),
            waitForNavigation: jest.fn().mockResolvedValue(),
            frameLocator: jest.fn().mockReturnValue({
                locator: jest.fn().mockReturnValue({
                    first: jest.fn().mockReturnValue({
                        isVisible: jest.fn().mockResolvedValue(false),
                        click: jest.fn()
                    })
                })
            })
        };
    });

    test('login flow should call correct selectors', async () => {
        const config = {
            baseUrl: 'https://test.com',
            login: {
                url: '/login',
                username: 'user',
                password: 'pass'
            }
        };

        // Mock elements found
        const mockElement = { fill: jest.fn(), click: jest.fn() };
        mockPage.waitForSelector.mockResolvedValue(mockElement);
        mockPage.locator.mockReturnValue({ first: jest.fn().mockReturnValue({ isVisible: jest.fn().mockResolvedValue(false) }) });

        await login(mockPage, config);

        expect(mockPage.goto).toHaveBeenCalledWith('https://test.com/login');
        expect(mockElement.fill).toHaveBeenCalledWith('user');
        expect(mockElement.fill).toHaveBeenCalledWith('pass');
    });

    test('processSteps should handle navigation and screenshot', async () => {
        const steps = [
            {
                name: 'test_step',
                navigationSelector: 'text=Link',
                screenshotSelector: '.content'
            }
        ];

        // Mock link found
        const mockLink = {
            waitFor: jest.fn(),
            click: jest.fn()
        };
        mockPage.locator.mockReturnValue({ first: jest.fn().mockReturnValue(mockLink) });

        // Mock element for screenshot
        const mockElement = { screenshot: jest.fn().mockResolvedValue(Buffer.from('ele-img')) };
        mockPage.$.mockResolvedValue(mockElement);

        await processSteps(mockPage, steps);

        expect(mockLink.click).toHaveBeenCalled();
        expect(mockElement.screenshot).toHaveBeenCalled();
    });
});
