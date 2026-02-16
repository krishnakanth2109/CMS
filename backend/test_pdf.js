
// test payload
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
    const pdfParse = require('pdf-parse');
    console.log('Type of pdfParse:', typeof pdfParse);
    if (typeof pdfParse === 'object') {
        console.log('Keys of pdfParse:', Object.keys(pdfParse));
        if (pdfParse.default) console.log('Type of pdfParse.default:', typeof pdfParse.default);
    }
} catch (e) {
    console.error('Error requiring pdf-parse:', e);
}
