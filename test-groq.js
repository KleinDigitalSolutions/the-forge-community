require('dotenv').config({ path: '.env.local' });

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log('Testing Groq Key:', apiKey ? 'Present' : 'Missing');

  if (!apiKey) return;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama-3.3-70b-versatile',
      }),
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Success:', data.choices[0].message.content);
    } else {
        const err = await response.text();
        console.log('Error:', response.status, err);
    }
  } catch (e) {
    console.log('Fetch error:', e.message);
  }
}

testGroq();