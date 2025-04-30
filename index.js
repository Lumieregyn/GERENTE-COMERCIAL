require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const { analyzeMessage } = require('./utils/analyzeGPT');
const { isBusinessHour } = require('./utils/timeUtils');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

create({
  session: 'lumieregyn',
  catchQR: (base64Qr, asciiQR, attempt) => {
    console.log("QR Code gerado:", asciiQR);
  },
  puppeteerOptions: { args: ['--no-sandbox'] }
}).then(client => {
  console.log("✅ WhatsApp conectado.");
  client.onMessage(async (message) => {
    console.log("Mensagem recebida:", message.body);
  });
});

app.post('/conversa', (req, res) => {
  const payload = req.body;
  console.log("📩 Payload recebido:", payload);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
