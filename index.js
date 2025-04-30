
require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const analyzeMessage = require('./utils/analyzeGPT');
const checklist = require('./utils/checklist');
const { isBusinessHour } = require('./utils/timeUtils');

const app = express();
const PORT = process.env.PORT || 8080;

let clientInstance = null;
let qrCodeData = '';
let grupoGestoresID = '120363025438726456@g.us';

app.use(express.json());

create({
  session: 'lumieregyn',
  catchQR: (base64Qr, asciiQR, attempts) => {
    qrCodeData = base64Qr;
    console.log('QR Code capturado - tentativa', attempts);
  },
  puppeteerOptions: {
    args: ['--no-sandbox'],
  },
}).then((client) => {
  clientInstance = client;
  console.log('✅ WhatsApp conectado.');
}).catch((error) => {
  console.error('Erro ao iniciar o cliente WPP:', error);
});

app.get('/qr', (_, res) => {
  res.send(`<html><body><img src="${qrCodeData ? 'data:image/png;base64,' + qrCodeData : ''}" /></body></html>`);
});

app.post('/conversa', async (req, res) => {
  const payload = req.body.payload || req.body;
  const text = payload?.Message?.text || '';
  const phone = payload?.user?.Phone || '';
  const vendedor = payload?.attendant?.Name || 'Vendedor';

  if (!text || !phone) return res.status(400).send('Payload incompleto.');

  const analise = await analyzeMessage(text);
  const checklistPendencias = checklist(analise);

  if (checklistPendencias?.length > 0) {
    const mensagem = `⚠️ Prezado(a) ${vendedor}, faltam confirmações importantes: ${checklistPendencias.join(', ')}`;
    if (clientInstance) {
      await clientInstance.sendText(phone, mensagem);
      await clientInstance.sendText(grupoGestoresID, mensagem);
    }
  }

  res.send('Analisado');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
