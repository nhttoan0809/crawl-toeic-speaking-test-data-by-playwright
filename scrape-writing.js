const { chromium } = require('playwright');
const fs = require('fs');
const urls = require('./urls-writing');

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
                const urlParams = new URLSearchParams(window.location.search);
                const partIds = urlParams.getAll('part');
                const tabContent = document.querySelector('#pills-tabContent');

                if (!tabContent) {
                    console.error("Không tìm thấy #pills-tabContent");
                }

                // Đối tượng JSON duy nhất để chứa kết quả
                const finalData = {};

                partIds.forEach((partId, index) => {
                    const partElement = tabContent.querySelector(`#partcontent-${partId}`);
                    if (!partElement) return;

                    const itemKey = `Item${index + 1}`;

                    if (index === 0) {
                        // Item 1: Danh sách các đường dẫn ảnh
                        const images = Array.from(partElement.querySelectorAll('.test-questions-wrapper > div .question-twocols-left img'))
                            .map(img => img.src);
                        finalData[itemKey] = {
                            type: "images",
                            content: images
                        };

                    } else if (index === 1) {
                        // Item 2: Danh sách các email (mỗi email là một mảng các dòng văn bản)
                        const emails = Array.from(partElement.querySelectorAll('.test-questions-wrapper > div .question-twocols-left div > div > div'))
                            .map(block => Array.from(block.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t));
                        const content = emails.map(email => email.join('\n'));
                        finalData[itemKey] = {
                            type: "emails",
                            content
                        };

                    } else if (index === 2) {
                        // Item 3: Văn bản tổng hợp
                        const textBlock = partElement.querySelector('.test-questions-wrapper > div .question-twocols-left div > div > div');
                        const paragraphs = textBlock ? Array.from(textBlock.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t) : [];
                        const content = paragraphs.join('\n');
                        finalData[itemKey] = {
                            type: "text_block",
                            content
                        };
                    }

                });
                return finalData;
            });

            // Extract slug (e.g., toeic-sw-writing-test-1)
            const slugMatch = url.match(/\/([^\/]+)\/?$/);
            let slug = slugMatch && slugMatch[1] ? slugMatch[1] : `test-${testId}`;
            // Remove 'toeic-' prefix if present to match user preference
            slug = slug.replace(/^toeic-/, '');

            // Check if folder data-writing exists
            if (!fs.existsSync('data-writing')) {
                fs.mkdirSync('data-writing');
            }

            // Save data
            const outputPath = `data-writing/${slug}-id_${testId}.json`;
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
