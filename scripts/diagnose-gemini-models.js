import 'dotenv/config';
const key = process.env.VITE_GEMINI_API_KEY;
if (!key) {
  console.error('Missing VITE_GEMINI_API_KEY in .env');
  process.exit(1);
}
async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log('Status:', res.status);
  try {
    const json = JSON.parse(text);
    const names = (json.models || []).map((m) => m.name).slice(0, 20);
    console.log('Models:', names);
  } catch {
    console.log('Body:', text.slice(0, 300));
  }
}
run().catch((e) => {
  console.error('Error:', e.message || String(e));
});
