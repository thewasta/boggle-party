const fs = require('fs');
const path = require('path');
const dictionary = require('an-array-of-spanish-words');

const outputPath = path.resolve(__dirname, '../data/dictionary.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));

console.log(`Dictionary copied to ${outputPath}`);
console.log(`Total words: ${dictionary.length}`);
