const fs = require('fs');

const INPUT_FILE = './data/dictionary.json';
const OUTPUT_FILE = './data/dictionary_clean.json';

const cleanSpanish = (text) => {
    return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zñ]/g, "");
};

function shouldKeep(word) {
    if (word.length < 3 || word.length > 8) return false;
    if (word.includes('q') && !word.includes('qu')) return false;
    
    const verbEndings = [
        'aremos', 'ereis', 'ireis', 'asteis', 'isteis', 'abamos', 'abais',
        'arian', 'arias', 'erias', 'erian', 'irias', 'irian',
        'ieseis', 'aseis', 'isteis', 'ramos', 'semos', 'sese', 'aste',
        'idles', 'adles', 'edles', 'adme', 'edme', 'idme', 'isico'
    ];
    if (word.length > 5 && verbEndings.some(end => word.endsWith(end))) return false;
    const technicalSuffixes = [
        'mente', 'ismo', 'ista', 'logia', 'grafia', 'oide', 'itis', 
        'tico', 'tiva', 'tivo', 'anza', 'cion', 'sion'
    ];
        if (word.length >= 7 && technicalSuffixes.some(s => word.endsWith(s))) return false;

    // 3. REGLA DE LA Q (Fundamental)
    if (word.includes('q') && !word.includes('qu')) return false;

    // 4. FILTRAR POR LETRAS RARAS
    // 'w', 'k' y 'x' (la x es aceptable pero con moderación)
    if (/[wk]/.test(word)) return false;

    // 5. EVITAR REPETICIONES RARAS
    if (/(.)\1/.test(word)) {
        // Permitir solo 'rr', 'll', 'cc', 'nn', 'ee' (comunes en español)
        if (!/(rr|ll|cc|nn|ee)/.test(word)) return false;
    }

    return true;

}


function getFrequencyScore(word) {
    let score = 0;
    const superCommon = 'aeosrni'; 
    const common = 'ltdu';
    // Letras comunes en español dan más puntos
    for (let char of word) {
        if (superCommon.includes(char)) score += 3;
        else if (common.includes(char)) score += 2;
        else score += 1;
    }
    if (word.length === 3) score += 8;
    if (word.length === 4) score += 6;
    if (word.length === 5) score += 4;

    return score;

}


const rawWords = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
console.log(`Palabras iniciales: ${rawWords.length}`);

const cleanWordsMap = new Map();

rawWords.forEach(word => {
    const cleaned = cleanSpanish(word);
    if (shouldKeep(cleaned)) {
        const score = getFrequencyScore(cleaned);
        // Solo mantener si es la primera vez o tiene mejor score
        if (!cleanWordsMap.has(cleaned) || cleanWordsMap.get(cleaned) < score) {
            cleanWordsMap.set(cleaned, score);
        }
    }
});

// Convertir de nuevo a array y ordenar
let finalWords = Array.from(cleanWordsMap.keys());
const SCORE_THRESHOLD = 16;
finalWords = finalWords.filter(word => cleanWordsMap.get(word) >= SCORE_THRESHOLD);
finalWords.sort();

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalWords, null, 2));
console.log(`Palabras finales: ${finalWords.length}`);
console.log(`Reducción: ${((1 - finalWords.length / rawWords.length) * 100).toFixed(1)}%`);
const lengthStats = {};
finalWords.forEach(word => {
    lengthStats[word.length] = (lengthStats[word.length] || 0) + 1;
});
console.log('\nDistribución por longitud:');
Object.keys(lengthStats).sort().forEach(len => {
    console.log(`  ${len} letras: ${lengthStats[len]} palabras`);
});
