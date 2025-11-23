const USERNAME_SELECTOR = process.env.USERNAME_SELECTOR || 'input[name="Alias"]';
const NEXT_BUTTON_SELECTOR = process.env.NEXT_BUTTON_SELECTOR || 'button:has-text("Dalej"), button[id="btNext"]';
const PASSWORD_SELECTOR = process.env.PASSWORD_SELECTOR || 'input[name="Password"]';
const CONSENT_BUTTON_SELECTOR = process.env.CONSENT_BUTTON_SELECTOR || '#save-default-button, button:has-text("Zgadzam się")';
const LOGIN_BUTTON_SELECTOR = process.env.LOGIN_BUTTON_SELECTOR || 'button:has-text("Zaloguj")';

async function login(page, config) {
    const { url, username, password, accountName } = config.login;
    const fullLoginUrl = config.baseUrl + url;

    console.log(`Navigating to login page: ${fullLoginUrl}`);
    await page.goto(fullLoginUrl);

    // Handle Consent Layer
    await handleConsent(page);

    // Step 1: Username and Next
    console.log(`Filling username: ${username}`);
    const usernameInput = await page.waitForSelector(USERNAME_SELECTOR, { timeout: 10000 });
    if (usernameInput) {
        await usernameInput.fill(username);
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
        await passwordInput.fill(password);
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

    // Account Selection
    if (accountName) {
        await selectAccount(page, accountName);
    }
}

async function handleConsent(page) {
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
}

async function selectAccount(page, accountName) {
    console.log(`Looking for account: "${accountName}"...`);
    // Selector for the account link
    // <a class="connected-account ..."> <div ...>NAME</div> </a>
    // Use filter({ hasText: ... }) to handle potential whitespace around the name
    const accountLink = page.locator('a.connected-account').filter({ hasText: accountName }).first();

    try {
        await accountLink.waitFor({ state: 'visible', timeout: 10000 });
        console.log(`Account "${accountName}" found. Clicking...`);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            accountLink.click()
        ]);
        const newUrl = page.url();
        console.log(`Redirected to: ${newUrl}`);
        console.log('Using redirected URL as target base.');
    } catch (e) {
        console.error(`Could not find or click account "${accountName}". Error: ${e.message}`);
    }
}

module.exports = { login };
