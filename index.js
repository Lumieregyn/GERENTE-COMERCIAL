require('dotenv').config();
const express = require('express');
const { create, Whatsapp } = require('@wppconnect-team/wppconnect');
const QRCode = require('qrcode');
const axios = require('axios');
const schedule = require('node-schedule');
// importe aqui seus utils: analyzeGPT, timeUtils, etc.

const app = express();
app.use(express.json());

let client;               // instância WPPConnect
let qrImage;              // QR em Base64
const WEBHOOK_URL = process.env.SURI_WEBHOOK_URL;
const GRUPO_GESTORES = process.env.GRUPO_GESTORES_ID;
const VENDEDORES = {
  "Cindy": "5562994671766",
  "Ana Clara": "556291899053",
  "Emily": "556281704171"
  // ...
};

// 1) Inicializa WPPConnect
create({
  session: 'lumieregyn',
  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})
  .then(async (clientInstance) => {
    client = clientInstance;

    client.onStateChange((state) => {
      console.log('Estado WPP:', state);
      // se perder conexão, trate reconexão
    });

    // captura QR e converte em Base64
    client.onQRCode(async (base64Qr) => {
      qrImage = base64Qr;
    });

    // quando pronto
    client.onReady(() => {
      console.log('✅ WhatsApp conectado');
    });

    // roteador de mensagens
    client.onMessage(async (msg) => {
      // envie o payload para SURI
      await axios.post(WEBHOOK_URL, msg);
      // aplique sua lógica de IA, checklist, alertas, etc.
    });
  })
  .catch(err => console.error('Erro ao iniciar WPP:', err));

// 2) Rota para servir o QR dinâmico
app.get('/qr', async (req, res) => {
  if (!qrImage) {
    return res.status(503).send('QR ainda não disponível');
  }
  const img = Buffer.from(qrImage.split(',')[1], 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.send(img);
});

// 3) Rota webhook (SURI → aqui chega payload de conversa)
app.post('/conversa', async (req, res) => {
  const payload = req.body;
  console.log('Payload recebido:', payload);
  // aqui dispare sua análise e alertas
  res.sendStatus(200);
});

// 4) Exemplo de agendamento de alerta
// dispara às 14:00 todo dia útil:
schedule.scheduleJob(
  { hour: 14, minute: 0, dayOfWeek: new schedule.Range(1,5) },
  () => {
    // verifique orçamentos pendentes e envie alerta
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
