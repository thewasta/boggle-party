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
    

    const rareEndings = [
        'isteis', 'asteis', 'ieseis', 'aremos', 'iereis', 'iesemos',
        'áramos', 'éramos', 'íramos', 'ásemos', 'ésemos', 'ísemos',
        'abais', 'íais', 'ereis', 'ireis', 'areis', 'aseis',
        'aban', 'ían', 'aran', 'eran', 'iran', 'asen', 'esen', 'iesen'
    ];
    if (rareEndings.some(ending => word.endsWith(ending))) return false;

    const rarePrefixes = [
        'pseudo', 'cuasi', 'infra', 'ultra', 'super', 'hiper',
        'anti', 'contra', 'extra', 'meta', 'para', 'semi',
        'macro', 'micro', 'neo', 'proto', 'retro'
    ];
    if (rarePrefixes.some(prefix => word.startsWith(prefix) && word.length > 6)) return false;


    const rareSuffixes = [
        'cion', 'sion', 'dad', 'tad', 'miento', 'mento',
        'ancia', 'encia', 'ismo', 'ista', 'logo', 'fobia',
        'patia', 'logia', 'itis', 'osis', 'emia'
    ];
    if (word.length > 7 && rareSuffixes.some(suffix => word.endsWith(suffix))) {
        const commonExceptions = ['cancion', 'acion', 'nacion', 'pasion', 'ension'];
        if (!commonExceptions.some(exc => word.includes(exc))) return false;
    }

    // 3. Eliminar palabras con demasiadas consonantes raras juntas
    if (/(.)\1\1/.test(word)) return false;

    const rareConsonantGroups = /[bcdfghjklmnpqrstvwxyz]{4,}/;
    if (rareConsonantGroups.test(word)) return false;

    const weirdPatterns = [
        /[wkx]/, // Letras no comunes en español
        /[aeiou]{4,}/, // Demasiadas vocales seguidas
        /^[bcdfghjklmnpqrstvwxyz]{3}/, // 3 consonantes al inicio
        /[bcdfghjklmnpqrstvwxyz]{3}$/, // 3 consonantes al final
    ];
    if (weirdPatterns.some(pattern => pattern.test(word))) return false;
    const veryRareVerbalForms = /[áéíóú](is|rais|semos|remos)$/;
    if (veryRareVerbalForms.test(word)) return false;

    return true;
}


function getFrequencyScore(word) {
    let score = 0;
    
    // Letras comunes en español dan más puntos
    const commonLetters = 'aeiourlnsdt';
    for (let char of word) {
        if (commonLetters.includes(char)) score += 2;
        else score += 1;
    }
    
    // Penalizar letras raras
    if (word.match(/[wkx]/)) score -= 10;
    
    // Bonus para palabras de longitud ideal para Boggle
    if (word.length >= 4 && word.length <= 6) score += 5;
    
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
const SCORE_THRESHOLD = 10;
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
