require('dotenv').config({ path: '.env.local' });

const url = process.env.MODAL_PREFETCH_URL;

if (!url) {
  console.error('MODAL_PREFETCH_URL is not set.');
  process.exit(1);
}

const token = process.env.MODAL_API_KEY;
const modelsArg = process.argv.find((arg) => arg.startsWith('--models='));
const models = modelsArg ? modelsArg.replace('--models=', '').split(',').map((m) => m.trim()).filter(Boolean) : undefined;

(async () => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ models })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Warmup failed:', data.error || res.statusText);
    process.exit(1);
  }

  console.log('Warmup complete:', data);
})();
