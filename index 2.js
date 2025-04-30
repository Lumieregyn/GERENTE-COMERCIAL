
import express from 'express';
import { create } from '@wppconnect-team/wppconnect';

const app = express();
const port = process.env.PORT || 8080;

let qrCodeBase64 = '';

create({
  session: 'lumieregyn',
  catchQR: (base64Qr) => {
    qrCodeBase64 = base64Qr;
    console.log('QR Code atualizado.');
  },
  headless: true,
  devtools: false,
  useChrome: false,
  debug: false,
  logQR: false,
  browserArgs: ['--no-sandbox'],
})
.then((client) => {
  console.log('✅ WhatsApp conectado e pronto para uso.');
})
.catch((error) => console.error(error));

app.get('/qr', (req, res) => {
  if (!qrCodeBase64) {
    return res.status(404).send('QR Code ainda não gerado.');
  }
  const imgTag = `<img src="${qrCodeBase64}" alt="QR Code" />`;
  res.send(`<html><body>${imgTag}</body></html>`);
});

app.get('/health', (req, res) => {
  res.send('Servidor ativo!');
});

app.listen(port, () => {
  console.log(`🚀 Servidor Express iniciado na porta ${port}`);
});
