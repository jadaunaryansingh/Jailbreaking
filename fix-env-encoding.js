import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Reading .env as utf16le...');

try {
    const content = fs.readFileSync(envPath, 'utf16le');
    console.log('First 50 chars:', JSON.stringify(content.substring(0, 50)));
    
    if (content.includes('VITE_FIREBASE_API_KEY')) {
        console.log('SUCCESS: Found key when reading as utf16le');
        // We should convert it
        fs.writeFileSync(envPath, content, 'utf8');
        console.log('CONVERTED .env to UTF-8');
    } else {
        console.log('Still not looking right...');
    }
} catch (e) {
    console.error(e);
}
