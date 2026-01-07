const fs = require('fs');
const path = require('path');
const urls = require('../urls');

const dataDir = path.join(__dirname, 'data');

// Build a map of ID -> Slug
const idToSlug = {};

urls.forEach(url => {
    // Extract ID
    const idMatch = url.match(/tests\/(\d+)/);
    const id = idMatch && idMatch[1] ? idMatch[1] : null;

    // Extract Slug
    const slugMatch = url.match(/\/([^\/]+)\/?$/);
    let slug = slugMatch && slugMatch[1] ? slugMatch[1] : null;
    
    if (id && slug) {
        // Remove 'toeic-' prefix
        slug = slug.replace(/^toeic-/, '');
        idToSlug[id] = slug;
    }
});

console.log(`Loaded ${Object.keys(idToSlug).length} URL mappings.`);

if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    let renameCount = 0;

    files.forEach(file => {
        // Match old format: test_1234.json
        const match = file.match(/^test_(\d+)\.json$/);
        if (match) {
            const id = match[1];
            const slug = idToSlug[id];

            if (slug) {
                const oldPath = path.join(dataDir, file);
                const newFilename = `${slug}-id_${id}.json`;
                const newPath = path.join(dataDir, newFilename);

                // Only rename if new file doesn't exist
                if (!fs.existsSync(newPath)) {
                    fs.renameSync(oldPath, newPath);
                    console.log(`Renamed: ${file} -> ${newFilename}`);
                    renameCount++;
                } else {
                    console.log(`Skipped: ${file} (Target ${newFilename} already exists)`);
                }
            } else {
                console.warn(`Warning: No slug found for ID ${id} (file: ${file})`);
            }
        }
    });

    console.log(`Finished. Renamed ${renameCount} files.`);
} else {
    console.error('Data directory not found.');
}
