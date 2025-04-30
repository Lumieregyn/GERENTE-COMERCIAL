
require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const analyzeMessage = require('./utils/analyzeGPT');
const isBusinessHour = require('./utils/timeUtils');
const app = express();
const PORT = process.env.PORT || 3000;

let clientInstance = null;
let qrCodeData = '';
let grupoGestoresID = '120363188388792500@g.us';

app.use(express.json());

create({
  session: 'lumieregyn',
  catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
    qrCodeData = base64Qr;
    console.log('[QR] Código gerado. Escaneie com o celular.');
  },
  puppeteerOptions: {
    args: ['--no-sandbox']
  }
}).then(client => {
  clientInstance = client;
  console.log('✅ WhatsApp conectado.');
  startWebhookListener();
}).catch(error => {
  console.error('Erro ao iniciar o cliente WPP:', error);
});

function startWebhookListener() {
  app.post('/conversa', async (req, res) => {
    try {
      const payload = req.body;
      console.log('Payload recebido:', JSON.stringify(payload, null, 2));

      const response = await analyzeMessage(payload);
      if (response && response.alerta) {
        const numeroDestino = response.enviarParaGrupo ? grupoGestoresID : response.telefoneVendedor;
        await clientInstance.sendText(numeroDestino, response.mensagem);
        console.log('✅ Alerta enviado para', numeroDestino);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Erro no webhook /conversa:', error);
      res.sendStatus(500);
    }
  });

  app.get('/qr', (req, res) => {
    res.send(qrCodeData ? `<img src="${qrCodeData}" />` : 'QR Code ainda não gerado.');
  });

  app.get('/', (req, res) => {
    res.send('Servidor rodando com sucesso!');
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}
