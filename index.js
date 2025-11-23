const { program } = require('commander');
const { loadConfig } = require('./src/config');
const { setupBrowser, teardownBrowser } = require('./src/browser');
const { login } = require('./src/auth');
const { processSteps } = require('./src/actions');

program
    .option('-c, --config <path>', 'Path to YAML configuration file', 'flow.yaml')
    .option('--headless', 'Run in headless mode', false)
    .parse(process.argv);

const options = program.opts();

async function main() {
    let browser;
    try {
        console.log(`Loading configuration from ${options.config}...`);
        const config = loadConfig(options.config);

        const { browser: b, page } = await setupBrowser(options.headless);
        browser = b;

        console.log('--- Starting Login Flow ---');
        await login(page, config);

        console.log('\n--- Starting Steps Processing ---');
        await processSteps(page, config.steps);

        console.log('\n--- Flow Completed Successfully ---');

    } catch (error) {
        console.error('\n!!! Flow Failed !!!');
        console.error(error);
        process.exit(1);
    } finally {
        await teardownBrowser(browser);
    }
}

main();
