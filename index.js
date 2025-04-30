require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const QRCode = require('qrcode');
const path = require('path');
const { analisarMensagem } = require('./utils/analyzeGPT');
const { estáNoHorárioComercial } = require('./utils/timeUtils');

const app = express();
const PORT = process.env.PORT || 8080;

let base64Qr = '';

// 1) Inicia o cliente WPPConnect e captura o QR
create({
  session: 'lumieregyn',
  puppeteerOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  }
})
  .then(client => {
    console.log('✅ WhatsApp client inicializado');

    client.on('qr', async qr => {
      base64Qr = await QRCode.toDataURL(qr);
      console.log('🔍 QR gerado');
    });

    client.on('message', msg => {
      // toda a lógica de IA, checklist e alertas
      analisarMensagem(msg).catch(console.error);
    });
  })
  .catch(err => console.error('Erro ao iniciar o cliente WPP:', err));

// 2) Serve o frontend (se existir)
app.use('/public', express.static(path.join(__dirname, 'public')));

// 3) Rota para pegar o QR Code
app.get('/qr', (req, res) => {
  if (!base64Qr) {
    return res.status(503).send('QR ainda não pronto, aguarde...');
  }
  const img = Buffer.from(base64Qr.split(',')[1], 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });
  res.end(img);
});

// 4) Webhook para receber logs da SURI
app.post('/conversa', express.json(), async (req, res) => {
  try {
    await analisarMensagem(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
