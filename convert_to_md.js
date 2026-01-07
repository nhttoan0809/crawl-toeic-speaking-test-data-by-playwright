const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const outDir = path.join(__dirname, 'data_markdown');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

function cleanText(text) {
    if (!text) return '';
    
    // 1. Fix merged words: "questionsImagine" -> "questions\n\nImagine"
    // Regex explanation: Look for lowercase letter followed immediately by uppercase letter
    let cleaned = text.replace(/([a-z])([A-Z])/g, '$1\n\n$2');

    // 2. Remove common prefixes
    cleaned = cleaned.replace(/^Response to questions/i, '');
    cleaned = cleaned.replace(/^Express an opinion/i, '');
    cleaned = cleaned.replace(/^Respond to questions using the information provided/i, '');

    // 3. Split "Question X:" into new lines for better readability
    cleaned = cleaned.replace(/(Question \d+:)/g, '\n\n**$1**');

    return cleaned.trim();
}

if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const rawData = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(rawData);

        // Derive title from filename: sw-speaking-test-1-id_5895.json -> SW Speaking Test 1
        let title = file.replace(/-id_\d+\.json$/, '').replace(/-/g, ' ');
        title = title.replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letters

        let mdContent = `# ${title}\n\n`;

        // Item 1: Read a Text Aloud
        mdContent += `## 1. Read a Text Aloud\n\n`;
        if (json['Item 1'] && Array.isArray(json['Item 1'])) {
            json['Item 1'].forEach(p => {
                mdContent += `> ${p}\n\n`;
            });
        }

        // Item 2: Describe a Picture
        mdContent += `## 2. Describe a Picture\n\n`;
        if (json['Item 2'] && Array.isArray(json['Item 2'])) {
            json['Item 2'].forEach(img => {
                mdContent += `![Image](${img})\n\n`;
            });
        }

        // Item 3: Respond to Questions
        mdContent += `## 3. Respond to Questions\n\n`;
        if (json['Item 3']) {
            mdContent += cleanText(json['Item 3']) + `\n\n`;
        }

        // Item 4: Respond to Questions using Information Provided
        // NOTE: USER REQUESTED MANUAL CHECK, NO AUTO CLEANING FOR THIS SECTION
        mdContent += `## 4. Respond to Questions using Information Provided\n\n`;
        mdContent += `> [!WARNING]\n> **CHECK THIS SECTION MANUALLY**. The content may contain complex tables or schedules that require human verification.\n\n`;
        
        if (json['Item 4']) {
            if (json['Item 4'].image) {
                mdContent += `![Schedule](${json['Item 4'].image})\n\n`;
            }
            if (json['Item 4'].text) {
                // Just dump the text as is, maybe wrapping in a blockquote or code block if it's messy?
                // User said "don't clean", so raw text is safest, but let's at least ensure newlines aren't lost if they exist.
                mdContent += `${json['Item 4'].text}\n\n`;
            }
        }

        // Item 5: Express an Opinion
        mdContent += `## 5. Express an Opinion\n\n`;
        if (json['Item 5']) {
            mdContent += cleanText(json['Item 5']) + `\n\n`;
        }

        const outPath = path.join(outDir, file.replace('.json', '.md'));
        fs.writeFileSync(outPath, mdContent);
        console.log(`Converted: ${file} -> ${path.basename(outPath)}`);
    });

    console.log(`\nconversion complete. Output in: ${outDir}`);
} else {
    console.error('Data directory not found.');
}
