const wppconnect = require('wppconnect');
let client;

async function startWhatsAppSession() {
  client = await wppconnect.create({
    session: 'sessionName',
    catchQR: (base64Qr) => `data:image/png;base64,${base64Qr}`,
    statusFind: (statusSession) => console.log('Status da sessão:', statusSession),
    updatesLog: true,
    headless: true,
    useChrome: true
  });
  return 'QR code gerado!';
}

async function sendMessage(to, message) {
  if (client) {
    await client.sendText(to, message);
  }
}

async function createGroupAndSend(name, participants, message) {
  if (client) {
    const group = await client.createGroup(name, participants);
    await client.sendText(group.id._serialized, message);
    return group.id._serialized;
  }
}

module.exports = { startWhatsAppSession, sendMessage, createGroupAndSend };
