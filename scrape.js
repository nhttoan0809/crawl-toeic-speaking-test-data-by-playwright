const { chromium } = require('playwright');
const fs = require('fs');
const urls = require('./urls');

(async () => {
    // Ensure data directory exists
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    const browser = await chromium.launch({
        headless: true, // Go headless for the actual scrape
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    
    // Check if state.json exists
    let context;
    if (fs.existsSync('state.json')) {
        context = await browser.newContext({
            storageState: 'state.json',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        console.log('Loaded session state from state.json');
    } else {
        console.warn('state.json not found! You may not be logged in.');
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    }

    const page = await context.newPage();

    for (const url of urls) {
        try {
            console.log(`Processing: ${url}`);
            await page.goto(url);

            // --- STEP 2 LOGIC: Get the link to the real exam ---
            // Extract Test ID from URL
            const testIdMatch = url.match(/tests\/(\d+)/);
            const testId = testIdMatch && testIdMatch[1] ? testIdMatch[1] : '';

            if (!testId) {
                console.error(`Could not extract test ID from ${url}`);
                continue;
            }

            // Find form and checkboxes
            // We need to wait for the form to be present
            const formSelector = `form[action*="/tests/${testId}/"]`;
            try {
                await page.waitForSelector(formSelector, { timeout: 5000 });
            } catch (e) {
                console.error(`Form not found for ${url}`);
                continue;
            }

            const checkboxIds = await page.$eval(formSelector, form => {
                const checkboxes = form.querySelectorAll('input[type="checkbox"]');
                return Array.from(checkboxes).map(checkbox => checkbox.id);
            });

            if (checkboxIds.length === 0) {
                 console.error(`No checkboxes found for ${url}`);
                 continue;
            }

            const queryString = checkboxIds.map(id => `part=${id.replace('part-', '')}`).join('&');
            const baseUrl = `https://study4.com/tests/${testId}/practice/`;
            const finalUrl = `${baseUrl}?${queryString}`;
            
            console.log(`Generated Real Exam URL: ${finalUrl}`);

            // --- STEP 3 LOGIC: Get all data ---
            await page.goto(finalUrl);
            await page.waitForLoadState('networkidle'); // Wait for content to load

            // Execute extraction logic in the page context
            const extractedData = await page.evaluate(() => {
                const data = {};
                const urlParams = new URLSearchParams(window.location.search);
                const partIds = urlParams.getAll('part');

                if (partIds.length >= 5) {
                    // Item 1: div#partcontent-XXXXX - text paragraphs
                    const item1Id = partIds[0];
                    const item1 = document.querySelector(`div#partcontent-${item1Id}`);
                    if (item1) {
                         const paragraphs = Array.from(item1.querySelectorAll('div.context-content.text-highlightable > div > p'));
                         data['Item 1'] = paragraphs.map(p => p.innerText.trim()).filter(text => text.length > 0 && !text.includes('Read a text aloud') && !text.includes('Viết ghi chú / dàn ý'));
                    }

                    // Item 2: div#partcontent-XXXXX - images
                    const item2Id = partIds[1];
                    const item2 = document.querySelector(`div#partcontent-${item2Id}`);
                    if (item2) {
                        const images = Array.from(item2.querySelectorAll('img'));
                        data['Item 2'] = images.map(img => img.src);
                    }

                    // Item 3: div#partcontent-XXXXX - one text content
                    const item3Id = partIds[2];
                    const item3 = document.querySelector(`div#partcontent-${item3Id}`);
                    if (item3) {
                         const textContainer = item3.querySelector('div.context-content.text-highlightable > div');
                         if (textContainer) {
                             data['Item 3'] = textContainer.innerText.trim();
                         }
                    }

                    // Item 4: div#partcontent-XXXXX - one image and text
                    const item4Id = partIds[3];
                    const item4 = document.querySelector(`div#partcontent-${item4Id}`);
                    if (item4) {
                        const img = item4.querySelector('img');
                        const textContainer = item4.querySelector('div.context-content.text-highlightable > div');
                        data['Item 4'] = {};
                        if (img) data['Item 4']['image'] = img.src;
                        if (textContainer) data['Item 4']['text'] = textContainer.innerText.trim();
                    }

                    // Item 5: div#partcontent-XXXXX - one text content
                    const item5Id = partIds[4];
                    const item5 = document.querySelector(`div#partcontent-${item5Id}`);
                    if (item5) {
                        const textContainer = item5.querySelector('div.context-content.text-highlightable > div');
                        if (textContainer) {
                            data['Item 5'] = textContainer.innerText.trim();
                        }
                    }
                    return data;
                } else {
                    return { error: 'Not enough part parameters found' };
                }
            });

            // Extract slug (e.g., toeic-sw-speaking-test-1)
            const slugMatch = url.match(/\/([^\/]+)\/?$/);
            let slug = slugMatch && slugMatch[1] ? slugMatch[1] : `test-${testId}`;
            // Remove 'toeic-' prefix if present to match user preference
            slug = slug.replace(/^toeic-/, '');

            // Save data
            const outputPath = `data/${slug}-id_${testId}.json`;
            fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
            console.log(`Saved data to ${outputPath}`);
            
            // Be nice to the server
            await page.waitForTimeout(1000); 

        } catch (error) {
            console.error(`Error processing ${url}:`, error);
        }
    }

    await browser.close();
})();
