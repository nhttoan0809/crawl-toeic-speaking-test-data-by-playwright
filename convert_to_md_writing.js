const fs = require('fs');
const path = require('path');

// Update to writing folders
const dataDir = path.join(__dirname, 'data-writing');
const outDir = path.join(__dirname, 'data_markdown_writing');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

function cleanText(text) {
    if (!text) return '';
    
    // 1. Fix merged words: "questionsImagine" -> "questions\n\nImagine"
    let cleaned = text.replace(/([a-z])([A-Z])/g, '$1\n\n$2');

    // 2. Remove common prefixes if any
    
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

        // Derive title from filename
        let title = file.replace(/-id_\d+\.json$/, '').replace(/-/g, ' ');
        title = title.replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letters

        let mdContent = `# ${title}\n\n`;

        // Item 1: Write a sentence based on a picture
        mdContent += `## 1. Write a sentence\n\n`;
        if (json['Item1'] && Array.isArray(json['Item1'].content)) {
            json['Item1'].content.forEach((img, index) => {
                mdContent += `**Image ${index + 1}**\n\n`;
                mdContent += `![Image ${index + 1}](${img})\n\n`;
            });
        }

        // Item 2: Respond to a written request
        // Use code blocks to preserve email formatting
        mdContent += `## 2. Respond to a written request\n\n`;
        if (json['Item2'] && Array.isArray(json['Item2'].content)) {
            json['Item2'].content.forEach((emailText, index) => {
                mdContent += `**Request ${index + 1}**\n\n`;
                mdContent += '```text\n';
                mdContent += cleanText(emailText);
                mdContent += '\n```\n\n';
            });
        }

        // Item 3: Write an opinion essay
        // Use blockquotes for the prompt
        mdContent += `## 3. Write an opinion essay\n\n`;
        if (json['Item3'] && json['Item3'].content) {
            let content = cleanText(json['Item3'].content);
            // Format as blockquote (prefix > to each line)
            mdContent += content.split('\n').map(line => `> ${line}`).join('\n') + `\n\n`;
        }

        const outPath = path.join(outDir, file.replace('.json', '.md'));
        fs.writeFileSync(outPath, mdContent);
        console.log(`Converted: ${file} -> ${path.basename(outPath)}`);
    });

    console.log(`\nconversion complete. Output in: ${outDir}`);
} else {
    console.error('Data directory (data-writing) not found.');
}
