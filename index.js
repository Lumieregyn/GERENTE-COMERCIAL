require('dotenv').config();
const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');
const { create } = require('@wppconnect-team/wppconnect');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 8080;
const WEBHOOK_URL = process.env.SURI_WEBHOOK_URL;

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

let qrBase64 = '';

async function startWhatsApp() {
  try {
    const client = await create({
      session: 'gerente-comercial',
      authTimeout: 0,
      autoClose: false,
      logQR: false,
      disableSpins: true,
      useChrome: false,
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      },
      qrCallback: base64Qr => {
        qrBase64 = base64Qr;
        console.log('📸 QR recebido');
      },
    });

    console.log('✅ Cliente WPP iniciado');

    client.onMessage(async message => {
      try {
        await axios.post(WEBHOOK_URL, message);
      } catch (e) {
        console.error('❌ Erro no webhook:', e.message);
      }

      // Aqui entra sua lógica de IA / checklist pós-fechamento
      // Exemplo:
      // const result = await openai.createChatCompletion({ ... })
      // if (result.something) client.sendText(...)
    });

  } catch (err) {
    console.error('❌ Erro ao iniciar o cliente WPP:', err.message);
    process.exit(1);
  }
}

app.use(express.json());

app.get('/qr', async (req, res) => {
  if (!qrBase64) {
    return res.send('QR ainda não pronto, aguarde...');
  }
  try {
    const dataUrl = await QRCode.toDataURL(qrBase64);
    res.send(`<img src="${dataUrl}" />`);
  } catch {
    res.status(500).send('Erro ao gerar QR');
  }
});

app.post('/conversa', (req, res) => {
  console.log('> Payload SURI:', req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🌐 Server rodando na porta ${PORT}`);
  startWhatsApp();
});
