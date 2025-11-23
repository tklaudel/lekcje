const sharp = require('sharp');
const { format } = require('date-fns');

async function processSteps(page, steps) {
    for (const step of steps) {
        console.log(`\n--- Processing step: ${step.name} ---`);

        // 1. Navigation (Optional)
        if (step.navigationSelector) {
            console.log(`Looking for link with selector: "${step.navigationSelector}"...`);
            const link = page.locator(step.navigationSelector).first();

            try {
                await link.waitFor({ state: 'visible', timeout: 10000 });
                console.log(`Link found. Clicking...`);
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => console.log('Navigation timeout or no navigation triggered, continuing...')),
                    link.click()
                ]);
                console.log(`Navigated to: ${page.url()}`);
            } catch (e) {
                console.error(`Could not find or click link "${step.navigationSelector}". Error: ${e.message}`);
                continue; // Skip to next step if navigation fails? Or maybe just try screenshotting anyway?
            }
        }

        // 2. Auto-scroll
        console.log('Auto-scrolling to load all content...');
        await autoScroll(page);

        // 3. Screenshot
        const selector = step.screenshotSelector || 'body';
        console.log(`Taking screenshot of selector: ${selector}`);

        let buffer;
        if (selector === 'body' || selector === 'html') {
            buffer = await page.screenshot({ fullPage: true });
        } else {
            const element = await page.$(selector);
            if (element) {
                buffer = await element.screenshot();
            } else {
                console.warn(`Selector "${selector}" not found, taking full page screenshot instead.`);
                buffer = await page.screenshot({ fullPage: true });
            }
        }

        // 4. Process Image
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const filename = `${step.name}_${dateStr}.gif`;

        console.log(`Processing image to grayscale GIF: ${filename}...`);
        await sharp(buffer)
            .grayscale()
            .toFormat('gif')
            .toFile(filename);

        console.log(`Saved: ${filename}`);
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

module.exports = { processSteps };
