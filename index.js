require('dotenv').config();
const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');
const { create } = require('@wppconnect-team/wppconnect');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 8080;
const WEBHOOK_URL = process.env.SURI_WEBHOOK_URL;

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Falta a variável OPENAI_API_KEY');
  process.exit(1);
}
if (!WEBHOOK_URL) {
  console.error('❌ Falta a variável SURI_WEBHOOK_URL');
  process.exit(1);
}

// inicializa cliente OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

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
          '--single-process'
        ]
      },
      qrCallback: (base64Qr) => {
        qrBase64 = base64Qr;
        console.log('📸 QR recebido');
      }
    });

    console.log('✅ Cliente WPP iniciado');

    client.onMessage(async (message) => {
      // envia payload pra SURI
      try {
        await axios.post(WEBHOOK_URL, message);
      } catch (err) {
        console.error('❌ Erro no webhook:', err.message);
      }

      // **AQUI** sua lógica de IA / checklist pós-fechamento
      // Exemplo simples:
      // if (message.body.toLowerCase().includes('fechar')) {
      //   const prompt = `Avalie se posso fechar o pedido: "${message.body}"`;
      //   const resp = await openai.createChatCompletion({
      //     model: 'gpt-4',
      //     messages: [{ role: 'user', content: prompt }]
      //   });
      //   const resposta = resp.data.choices[0].message.content;
      //   await client.sendText(message.from, resposta);
      // }
    });

  } catch (err) {
    console.error('❌ Erro ao iniciar o cliente WPP:', err.message);
    process.exit(1);
  }
}

app.use(express.json());

// rota para servir o QR
app.get('/qr', async (req, res) => {
  if (!qrBase64) {
    return res.send('QR ainda não pronto, aguarde...');
  }
  try {
    const dataUrl = await QRCode.toDataURL(qrBase64);
    res.send(`<html><body><img src="${dataUrl}" /></body></html>`);
  } catch (err) {
    res.status(500).send('Erro ao gerar QR');
  }
});

// rota que a SURI vai chamar
app.post('/conversa', (req, res) => {
  console.log('> Payload SURI:', JSON.stringify(req.body));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🌐 Server rodando na porta ${PORT}`);
  startWhatsApp();
});
