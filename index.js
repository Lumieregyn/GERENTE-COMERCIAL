// index.js
require('dotenv').config();
const express = require('express');
const wppconnect = require('@wppconnect-team/wppconnect');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
let client = null;

// Captura qualquer rejeição não tratada
process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Rejection:', reason);
});

async function initWhatsApp() {
  const baseOpts = {
    session: 'GerenteComercialIA',
    headless: true,
    logQR: false,
    puppeteerOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    useChrome: false,
    catchQR: (base64Qrimg /*, asciiQR, attempts */) => {
      console.log('⏳ QRCode (base64):', base64Qrimg.slice(0, 50) + '...');
    },
    statusFind: (statusSession, session) => {
      console.log(`🔄 Status [${session}]:`, statusSession);
    },
  };

  try {
    // Primeiro, tenta sem forçar versão
    client = await wppconnect.create(baseOpts);
    console.log('✅ WPPConnect iniciado (auto-version)');
  } catch (err) {
    if (
      err.message &&
      err.message.includes('Version not available')
    ) {
      console.warn(
        '⚠️ Versão detectada não disponível, fazendo retry com fallback...'
      );
      // Retry com versão estável
      client = await wppconnect.create({
        ...baseOpts,
        version: '2.2407.3', // fallback comprovado
      });
      console.log('✅ WPPConnect iniciado (fallback 2.2407.3)');
    } else {
      console.error('❌ Erro ao iniciar WPPConnect:', err);
      throw err;
    }
  }
}

// Rota para exibir QR code em HTML
app.get('/qr', async (req, res) => {
  if (!client) {
    return res.status(503).send('🔴 WhatsApp não iniciado ainda.');
  }
  try {
    const qr = await client.getQrCode();
    const img = await qrcode.toDataURL(qr);
    res.send(`
      <html><body style="display:flex;align-items:center;justify-content:center;height:100vh">
        <img src="${img}" alt="QR Code" />
      </body></html>
    `);
  } catch (err) {
    console.error('❌ Falha ao gerar QR:', err);
    res.status(500).send('Erro ao gerar QR code');
  }
});

// Webhook de logs da Suri
app.post('/conversa', async (req, res) => {
  console.log('📥 Payload /conversa:', JSON.stringify(req.body, null, 2));

  // TODO: aqui injete sua lógica de IA para checklists, alertas, etc.
  // Exemplo de alertar vendedor:
  // await client.sendText(vendedorPhone, '🚨 [Alerta] ...');

  res.sendStatus(200);
});

// Inicia tudo
app.listen(PORT, async () => {
  console.log(`🚀 Servidor ouvindo na porta ${PORT}`);
  await initWhatsApp();
});
