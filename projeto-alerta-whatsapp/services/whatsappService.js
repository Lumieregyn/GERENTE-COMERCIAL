const wppconnect = require('wppconnect');

let client;

async function startWhatsAppSession() {
  client = await wppconnect.create({
    session: 'sessionName',
    catchQR: (base64Qr, asciiQR) => {
      return `data:image/png;base64,${base64Qr}`;
    },
    statusFind: (statusSession) => {
      console.log('Status:', statusSession);
    },
    updatesLog: true,
    headless: true,
    useChrome: true
  });
  return 'QR gerado!';
}

async function sendMessage(to, message) {
  if (client) {
    await client.sendText(to, message);
  }
}

module.exports = { startWhatsAppSession, sendMessage };
