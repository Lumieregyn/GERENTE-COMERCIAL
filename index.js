require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const { analyzeMensagem } = require('./utils/analyzeGPT');
const { isBusinessHour } = require('./utils/timeUtils');

const app = express();
app.use(express.json());

let clientInstance;
let qrBase64 = '';

async function init() {
  try {
    create({
      session: process.env.WPP_SESSION_NAME || 'lumieregyn',
      puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox']
      },
      catchQR: (qr) => {
        qrBase64 = qr;
        console.log('QR Code captured');
      },
      logQR: false,
    }).then(client => {
      clientInstance = client;
      console.log('WhatsApp connected');
      client.onMessage(async msg => {
        console.log('Message received', JSON.stringify(msg));
        // TODO: integrate analyzeMensagem, alerts, etc.
      });
    });
  } catch(err) {
    console.error('Error init WPP', err);
  }
}

init();

app.get('/qr', (req, res) => {
  res.send(`<img src="data:image/png;base64,${qrBase64}" />`);
});

app.post('/conversa', async (req, res) => {
  const { payload } = req.body;
  console.log('Payload received:', JSON.stringify(payload));
  // TODO: call analyzeMensagem(payload), check business hours, send alerts.
  res.sendStatus(200);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
