const { chromium } = require('playwright');

async function setupBrowser(headless = false) {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    return { browser, context, page };
}

async function teardownBrowser(browser) {
    if (browser) {
        console.log('Closing browser...');
        await browser.close();
    }
}

module.exports = { setupBrowser, teardownBrowser };
