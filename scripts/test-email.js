const { Resend } = require('resend');

const apiKey = 're_5tBeeisN_J3hvpxEacYYdwmfE9wqiJqcT'; // Hardcoded for test
const resend = new Resend(apiKey);

async function sendTest() {
  try {
    console.log('Sending test email...');
    const data = await resend.emails.send({
      from: 'THE FORGE <onboarding@resend.dev>',
      to: 'oezguer.azap@web.de', // Using one of your approved emails
      subject: 'Resend Debug Test',
      html: '<strong>It works!</strong>',
    });

    console.log('Success:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTest();
