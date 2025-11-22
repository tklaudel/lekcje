const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');

async function run() {
    const LOGIN_URL = process.env.LOGIN_URL;
    const USERNAME = process.env.LOGIN_USERNAME; // Prefer LOGIN_USERNAME to avoid system USERNAME conflict
    const PASSWORD = process.env.PASSWORD;
    const TARGET_URL = process.env.TARGET_URL;
    const ACCOUNT_NAME = process.env.ACCOUNT_NAME; // Name of the child/account to select
    const NAVIGATE_TO_LINK = process.env.NAVIGATE_TO_LINK; // Link text to click after login/account selection
    const SELECTOR = process.env.SELECTOR_TO_SCREENSHOT || 'body'; // Default to body if not specified

    // Selectors
    const USERNAME_SELECTOR = process.env.USERNAME_SELECTOR || 'input[name="Alias"]';
    const NEXT_BUTTON_SELECTOR = process.env.NEXT_BUTTON_SELECTOR || 'button:has-text("Dalej"), button[id="btNext"]'; // Try to guess "Next" button
    const PASSWORD_SELECTOR = process.env.PASSWORD_SELECTOR || 'input[name="Password"]'; // Corrected based on typical Vulcan behavior, user had Alias which is wrong for password usually, but let's stick to standard or what user set. User changed it to Alias in previous step manually, but standard is Password. I will make it configurable but default to what might work or keep user's manual change if I can. Actually, I'll add the consent selector here.
    const CONSENT_BUTTON_SELECTOR = process.env.CONSENT_BUTTON_SELECTOR || '#save-default-button, button:has-text("Zgadzam się")';
    const LOGIN_BUTTON_SELECTOR = process.env.LOGIN_BUTTON_SELECTOR || 'button:has-text("Zaloguj")';

    if (!LOGIN_URL || !USERNAME || !PASSWORD || !TARGET_URL) {
        console.error('Error: Missing required environment variables: LOGIN_URL, USERNAME, PASSWORD, TARGET_URL');
        process.exit(1);
    }

    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log(`Navigating to login page: ${LOGIN_URL}`);
        await page.goto(LOGIN_URL);

        // Handle Consent Layer
        try {
            console.log('Waiting for page load...');
            await page.waitForLoadState('domcontentloaded');

            console.log('Checking for consent button (15s timeout)...');

            // Check for iframe first
            const consentFrame = page.frameLocator('#respect-privacy-frame');
            const consentButtonInFrame = consentFrame.locator(CONSENT_BUTTON_SELECTOR).first();
            const consentButtonOnPage = page.locator(CONSENT_BUTTON_SELECTOR).first();

            if (await consentButtonInFrame.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('Consent button found IN IFRAME. Clicking...');
                await consentButtonInFrame.click();
            } else if (await consentButtonOnPage.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('Consent button found ON PAGE. Clicking...');
                await consentButtonOnPage.click();
            } else {
                console.log('Consent button NOT found in iframe or on page.');
                // Fallback: try to remove the wrapper if it exists
                const wrapper = await page.$('#respect-privacy-wrapper');
                if (wrapper) {
                    console.log('Found wrapper #respect-privacy-wrapper, removing it manually...');
                    await page.evaluate(() => {
                        const el = document.querySelector('#respect-privacy-wrapper');
                        if (el) el.remove();
                    });
                }
            }

            // Wait for the overlay to disappear (if it was clicked)
            try {
                await page.waitForSelector('#respect-privacy-wrapper', { state: 'hidden', timeout: 5000 });
                console.log('Consent overlay disappeared.');
            } catch (e) {
                // Ignore timeout here if we already removed it or if it wasn't there
            }

        } catch (e) {
            console.log('Error handling consent:', e.message);
            await page.screenshot({ path: 'debug_consent_error.png' });
        }

        // Step 1: Username and Next
        console.log(`Filling username: ${USERNAME}`);
        const usernameInput = await page.waitForSelector(USERNAME_SELECTOR, { timeout: 10000 });
        if (usernameInput) {
            await usernameInput.fill(USERNAME);
        } else {
            throw new Error(`Could not find username field with selector: ${USERNAME_SELECTOR}`);
        }

        console.log('Clicking "Next" button...');
        const nextButton = await page.waitForSelector(NEXT_BUTTON_SELECTOR, { timeout: 10000 });
        if (nextButton) {
            await nextButton.click();
        } else {
            throw new Error(`Could not find next button with selector: ${NEXT_BUTTON_SELECTOR}`);
        }

        // Step 2: Password and Login
        console.log('Waiting for password field...');
        const passwordInput = await page.waitForSelector(PASSWORD_SELECTOR, { timeout: 10000 });
        if (passwordInput) {
            await passwordInput.fill(PASSWORD);
        } else {
            throw new Error(`Could not find password field with selector: ${PASSWORD_SELECTOR}`);
        }

        console.log('Clicking "Login" button...');
        const loginButton = await page.waitForSelector(LOGIN_BUTTON_SELECTOR, { timeout: 10000 });
        if (loginButton) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => console.log('Navigation timeout or no navigation triggered, continuing...')),
                loginButton.click()
            ]);
        } else {
            throw new Error(`Could not find login button with selector: ${LOGIN_BUTTON_SELECTOR}`);
        }

        const currentUrl = page.url();
        console.log(`Logged in. Current URL: ${currentUrl}`);

        if (ACCOUNT_NAME) {
            console.log(`Looking for account: "${ACCOUNT_NAME}"...`);
            // Selector for the account link
            // <a class="connected-account ..."> <div ...>NAME</div> </a>
            // Use filter({ hasText: ... }) to handle potential whitespace around the name
            const accountLink = page.locator('a.connected-account').filter({ hasText: ACCOUNT_NAME }).first();

            try {
                await accountLink.waitFor({ state: 'visible', timeout: 10000 });
                console.log(`Account "${ACCOUNT_NAME}" found. Clicking...`);
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle' }),
                    accountLink.click()
                ]);
                const newUrl = page.url();
                console.log(`Redirected to: ${newUrl}`);
                console.log('Using redirected URL as target, ignoring TARGET_URL env var.');
            } catch (e) {
                console.error(`Could not find or click account "${ACCOUNT_NAME}". Error: ${e.message}`);
                // If account selection fails, maybe we should still try TARGET_URL? 
                // For now, let's assume if user wanted account, and it failed, we might be in a bad state, but let's try TARGET_URL as fallback if provided.
                if (TARGET_URL) {
                    console.log(`Fallback: Navigating to target URL: ${TARGET_URL}`);
                    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
                }
            }
        } else if (TARGET_URL) {
            console.log(`Navigating to target URL: ${TARGET_URL}`);
            await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
        }

        if (NAVIGATE_TO_LINK) {
            console.log(`Looking for link with text: "${NAVIGATE_TO_LINK}"...`);
            // Try to find a link with the exact text or containing the text
            const link = page.locator(`a:has-text("${NAVIGATE_TO_LINK}"), span:has-text("${NAVIGATE_TO_LINK}")`).first();

            try {
                await link.waitFor({ state: 'visible', timeout: 10000 });
                console.log(`Link "${NAVIGATE_TO_LINK}" found. Clicking...`);
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => console.log('Navigation timeout or no navigation triggered, continuing...')),
                    link.click()
                ]);
                console.log(`Navigated to: ${page.url()}`);
            } catch (e) {
                console.error(`Could not find or click link "${NAVIGATE_TO_LINK}". Error: ${e.message}`);
            }
        }

        console.log('Auto-scrolling to load all content...');
        await autoScroll(page);

        console.log(`Taking screenshot of selector: ${SELECTOR}`);
        let buffer;
        if (SELECTOR === 'body' || SELECTOR === 'html') {
            buffer = await page.screenshot({ fullPage: true });
        } else {
            const element = await page.$(SELECTOR);
            if (element) {
                buffer = await element.screenshot();
            } else {
                console.warn(`Selector "${SELECTOR}" not found, taking full page screenshot instead.`);
                buffer = await page.screenshot({ fullPage: true });
            }
        }

        console.log('Processing image to grayscale GIF...');
        await sharp(buffer)
            .grayscale()
            .toFormat('gif')
            .toFile('output.gif');

        console.log('Done! Saved to output.gif');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

run();
