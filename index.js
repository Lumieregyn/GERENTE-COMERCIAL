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

// 1) Monta cliente WPPConnect, captura o QR Code como string
create({
  session: 'lumieregyn',
  puppeteerOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  }
})
  .then(client => {
    client.on('qr', async qr => {
      // converte o ASCII QR para imagem PNG em base64
      base64Qr = await QRCode.toDataURL(qr);
      console.log('🔍 QR gerado');
    });

    client.on('message', async msg => {
      // aqui dispara a lógica de checklist, IA, alertas, etc.
      await analisarMensagem(msg);
    });

    console.log(`✅ WhatsApp client inicializado`);
  })
  .catch(err => console.error('Erro ao iniciar o cliente WPP:', err));

// 2) Serve estáticos (caso tenha frontend)
app.use('/public', express.static(path.join(__dirname, 'public')));

// 3) Rota que retorna o QR Code
app.get('/qr', (req, res) => {
  if (!base64Qr) {
    return res.status(503).send('QR não está pronto, aguarde...');
  }
  // devolve o PNG decodificado
  const img = Buffer.from(base64Qr.split(',')[1], 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });
  res.end(img);
});

// 4) Rota de webhook para receber os logs da SURI
app.post('/conversa', express.json(), async (req, res) => {
  const payload = req.body;
  // dispara a análise de mensagens, imagens, PDFs e áudios
  await analisarMensagem(payload);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
