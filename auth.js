const { chromium } = require('playwright');
const readline = require('readline');

(async () => {
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Navigating to study4.com...');
    await page.goto('https://study4.com/');

    console.log('Please log in manually in the browser window.');
    console.log('Once you have successfully logged in, press ENTER in this terminal to save the session state and exit.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await new Promise(resolve => {
        rl.question('Press ENTER to save state...', resolve);
    });

    rl.close();

    // Save storage state into the file.
    await context.storageState({ path: 'state.json' });
    console.log('Session state saved to state.json');

    await browser.close();
})();
