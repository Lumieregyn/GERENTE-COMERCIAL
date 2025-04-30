// index.js
require('dotenv').config();
const express = require('express');
const wppconnect = require('@wppconnect-team/wppconnect');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
let client = null;

/**
 * Inicializa o cliente WhatsApp via WPPConnect
 * com fallback de versão para não dar erro "Version not available".
 */
async function initWhatsApp() {
  try {
    client = await wppconnect.create({
      session: 'GerenteComercialIA',          // nome da sessão
      catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
        console.log('⏳ QRCode gerado (base64):', base64Qrimg.slice(0,50) + '...');
      },
      statusFind: (statusSession, session) => {
        console.log(`🔄 Status de sessão (${session}):`, statusSession);
      },
      headless: true,
      logQR: false,
      puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      useChrome: false,
      version: '2.2407.3'                     // <== fallback estável
    });
    console.log('✅ Cliente WPPConnect iniciado com sucesso');
  } catch (err) {
    console.error('❌ Falha ao iniciar o cliente WPPConnect:', err);
  }
}

// Rota para exibir QR code em uma página HTML simples
app.get('/qr', async (req, res) => {
  if (!client) {
    return res.status(503).send('Cliente WhatsApp ainda não iniciado.');
  }
  try {
    const qrCode = await client.getQrCode();
    const img = await qrcode.toDataURL(qrCode);
    res.send(`
      <html><body style="display:flex;align-items:center;justify-content:center;padding:50px">
        <img src="${img}" alt="QR Code WhatsApp" />
      </body></html>
    `);
  } catch (err) {
    console.error('Erro ao gerar QR code:', err);
    res.status(500).send('Erro ao gerar QR code');
  }
});

// Webhook que a Suri envia para /conversa com o payload completo
app.post('/conversa', async (req, res) => {
  const payload = req.body;
  console.log('📥 Payload recebido em /conversa:', JSON.stringify(payload, null, 2));

  // TODO: aqui entra sua lógica de IA (checklists, alertas, etc.)
  // ex. analisar payload.mensagem.text ou payload.mensagem.anexos
  // e disparar alertas via client.sendText(...)
  
  res.sendStatus(200);
});

// Inicia o servidor e o WhatsApp
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  await initWhatsApp();
});
