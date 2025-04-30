require('dotenv').config();
const express = require('express');
const { create } = require('@wppconnect-team/wppconnect');
const { analyzeMessage } = require('./utils/analyzeGPT');
const { isBusinessHours } = require('./utils/timeUtils');
const app = express();
const PORT = process.env.PORT || 3000;
let clientInstance = null;
let qrCodeData = '';
let grupoGestoresID = null;

app.use(express.json());

create({
  session: 'lumieregyn',
  catchQR: (base64Qr, asciiQR, attempt) => {
    qrCodeData = base64Qr;
    console.log('🔄 QR Code capturado - tentativa', attempt);
  },
  puppeteerOptions: {
    args: ['--no-sandbox'],
    protocolTimeout: 120000
  },
  autoClose: 0,
  maxAttempts: 0
}).then(async (client) => {
  clientInstance = client;
  console.log('✅ WhatsApp conectado.');

  // Adicionar delay para capturar o grupo
  setTimeout(async () => {
    const chats = await client.listChats();
    const grupo = chats.find(chat => chat.name && chat.name.includes('Gerente Comercial IA'));
    if (grupo) {
      grupoGestoresID = grupo.id._serialized;
      console.log('🎯 Grupo de gestores encontrado:', grupoGestoresID);
    } else {
      console.log('⚠️ Grupo de gestores "Gerente Comercial IA" não encontrado mesmo após timeout.');
    }
  }, 8000);

}).catch((error) => {
  console.error('Erro ao iniciar sessão:', error);
});

app.get('/health', (req, res) => res.send('Servidor ativo!'));

app.get('/qr', (req, res) => {
  if (!qrCodeData) return res.status(404).send('QR Code ainda não disponível.');
  res.send('<html><body><h2>Escaneie o QR Code:</h2><img src="' + qrCodeData + '" style="width:300px;height:300px;" /></body></html>');
});

app.post('/alerta', async (req, res) => {
  try {
    const { numero, mensagem } = req.body;
    if (!clientInstance) return res.status(500).send('Cliente não inicializado.');
    await clientInstance.sendText(numero + '@c.us', mensagem);
    res.send({ status: 'Mensagem enviada!' });
  } catch (error) {
    console.error('Erro ao enviar:', error);
    res.status(500).send('Erro ao enviar mensagem.');
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const { numero, texto } = req.body;
    if (!clientInstance) return res.status(500).send('Cliente não inicializado.');

    console.log('📥 Nova mensagem recebida para análise:', texto);
    const analise = await analyzeMessage(texto);

    if (analise && analise.choices && analise.choices[0].message.content.includes('faltam informações')) {
      console.log('⚠️ Faltam informações importantes, enviando alerta!');
      if (grupoGestoresID) {
        await clientInstance.sendText(grupoGestoresID, '🚨 ALERTA: Conversa detectada sem todas as informações obrigatórias.');
      }
    }

    res.send({ status: 'Mensagem analisada.' });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro no webhook.');
  }
});

setInterval(async () => {
  if (!clientInstance) return;
  if (!isBusinessHours()) return;
  console.log('⏰ Verificando atrasos...');
  const simulatedMessage = "Estou aguardando orçamento!";
  const analysis = await analyzeMessage(simulatedMessage);
  console.log('📊 Análise da IA:', analysis);
  const sellerNumber = "6294671766";
  await clientInstance.sendText(sellerNumber + '@c.us', '⏳ Alerta automático: cliente aguardando orçamento.');
}, 600000);

app.listen(PORT, () => {
  console.log('🚀 Servidor rodando na porta ' + PORT);
});
