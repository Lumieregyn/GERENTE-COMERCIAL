require('dotenv').config();
const express = require('express');
const { startWhatsAppSession } = require('./services/whatsappService');
const { startMonitoring } = require('./monitor/monitorService');

const app = express();
const port = process.env.PORT || 3000;

// Health Check
app.get('/health', (req, res) => {
  res.send('OK');
});

// QR Code Route
app.get('/qr', async (req, res) => {
  const qr = await startWhatsAppSession();
  res.send(`<img src="${qr}" />`);
});

// Iniciar Monitoramento
startMonitoring();

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
