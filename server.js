require('dotenv').config();
const express = require('express');
const { startWhatsAppSession } = require('./services/whatsappService');
const { startMonitoring } = require('./monitor/monitorService');

const app = express();
const port = process.env.PORT || 3000;

app.get('/health', (req, res) => res.send('OK'));

app.get('/qr', async (req, res) => {
  const qrData = await startWhatsAppSession();
  res.send(`<img src="${qrData}" />`);
});

startMonitoring();

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
