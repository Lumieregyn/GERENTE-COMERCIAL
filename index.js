const express = require('express');
const bodyParser = require('body-parser');
const qrcode = require('qrcode');
const wppconnect = require('@wppconnect-team/wppconnect');

const app = express();
app.use(bodyParser.json());

let client;
let qrCodeDataUrl = '';

// Initialize WhatsApp client
async function startWhatsApp() {
  client = await wppconnect.create({
    session: 'GerenteComercialIA',
    headless: true,
    logQR: false,
    version: '2.2407.3',
    useChrome: false,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    puppeteerOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    catchQR: (base64Qr) => {
      qrcode.toDataURL(base64Qr, (err, url) => {
        if (err) console.error(err);
        else qrCodeDataUrl = url;
      });
    },
    statusFind: (statusSession, session) => {
      console.log(`Session ${session} status: ${statusSession}`);
    },
  });
}

// Serve dynamic QR code
app.get('/', (req, res) => {
  if (!qrCodeDataUrl) {
    return res.send('Aguardando QR Code...');
  }
  res.send(\
    <html>
      <body>
        <img src="\${qrCodeDataUrl}" alt="QR Code"/>
        <script>
          setTimeout(() => location.reload(), 60000);
        </script>
      </body>
    </html>
  \`);
});

// Webhook endpoint for incoming messages
app.post('/conversa', (req, res) => {
  console.log('Payload recebido:', JSON.stringify(req.body, null, 2));
  // TODO: implementar lógica de checklist, alertas, análise de imagem/audio
  res.sendStatus(200);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(\`Servidor rodando na porta \${PORT}\`);
  startWhatsApp();
});
