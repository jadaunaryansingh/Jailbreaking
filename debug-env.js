import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Raw content length:', content.length);
    console.log('First 50 chars:', JSON.stringify(content.substring(0, 50)));
    
    const parsed = dotenv.parse(content);
    console.log('Dotenv parsed keys:', Object.keys(parsed));
    console.log('VITE_FIREBASE_API_KEY from parse:', parsed.VITE_FIREBASE_API_KEY ? 'FOUND' : 'MISSING');
} else {
    console.log('File DOES NOT exist at expected path.');
    // List directory
    console.log('Directory listing:');
    fs.readdirSync(process.cwd()).forEach(file => {
        if (file.startsWith('.env')) console.log(' - ' + file);
    });
}
