require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const QRCode = require('qrcode');
const axios = require('axios');
const schedule = require('node-schedule');
const { analyzeMessage } = require('./utils/analyzeGPT');
const { isBusinessHour } = require('./utils/timeUtils');

const app = express();
app.use(express.json());

let client, latestQr;
const { SURI_WEBHOOK_URL, GRUPO_GESTORES_ID, PORT } = process.env;
const VENDEDORES = {
  Cindy: '5562994671766',
  'Ana Clara': '556291899053',
  Emily: '556281704171'
};

create({
  session: 'lumieregyn',
  puppeteerOptions: {
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
})
  .then(c => {
    client = c;
    client.onQRCode(qr => { latestQr = qr; });
    client.onReady(() => console.log('✅ WhatsApp pronto'));
    client.onMessage(async msg => {
      await axios.post(SURI_WEBHOOK_URL, msg).catch(console.error);
      const alert = await analyzeMessage(msg);
      if (alert && isBusinessHour()) {
        const to = VENDEDORES[msg.senderName] || null;
        if (alert.level === 'grave') {
          await client.sendText(GRUPO_GESTORES_ID, alert.text);
        } else if (to) {
          await client.sendText(to, alert.text);
        }
      }
    });
  })
  .catch(console.error);

app.get('/qr', (req, res) => {
  if (!latestQr) return res.status(503).send('QR não disponível');
  const img = Buffer.from(latestQr.split(',')[1], 'base64');
  res.setHeader('Content-Type','image/png');
  res.send(img);
});

app.post('/conversa', (req, res) => {
  console.log('📬 Payload SURI:', req.body);
  res.sendStatus(200);
});

schedule.scheduleJob({ hour: 8, minute: 0, dayOfWeek: new schedule.Range(1,5) }, () => {
  console.log('🔔 Job diário de lembrete rodando…');
});

const serverPort = PORT || 3000;
app.listen(serverPort, () =>
  console.log(`🚀 Servidor rodando na porta ${serverPort}`)
);
