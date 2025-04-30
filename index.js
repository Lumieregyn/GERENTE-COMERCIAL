// index.js
require('dotenv').config();
const express = require('express'),
      bodyParser = require('body-parser'),
      qrcode = require('qrcode'),
      wpp = require('@wppconnect-team/wppconnect'),
      { Configuration, OpenAIApi } = require('openai');

const app = express(),
      PORT = process.env.PORT || 8080,
      GROUP_ID = process.env.WHATSAPP_GROUP_ID;

let latestQr = null, client = null;
const ai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

app.use(bodyParser.json());

// 1) Inicia WPPConnect
wpp.create({
  session: 'gc',
  headless: true,
  puppeteerOptions: {
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
  }
})
.then(c => {
  client = c;
  c.on('qr', qr => latestQr = qr);
  c.on('ready', () => console.log('✅ WhatsApp pronto'));
  c.on('message', m => handleIncoming({ from: m.from, body: m.body }));
})
.catch(console.error);

// 2) Rota QR dinâmico
app.get('/qr', (req, res) => {
  if (!latestQr) return res.send('QR ainda não pronto, aguarde...');
  qrcode.toDataURL(latestQr)
    .then(img => res.send(`<img src="${img}" style="display:block;margin:auto;"/>`))
    .catch(() => res.status(500).send('Erro interno'));
});

// 3) Webhook Suri
app.post('/conversa', async (req, res) => {
  try {
    await processLog(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

async function processLog(log) {
  const text = (log.payload?.Mensagem?.text || '').toLowerCase();
  if (!/(fechar|quero fechar|fechamento)/.test(text)) return;
  const system = `
Você é o Gerente Comercial IA. Confira se faltam: Produto, Cor, Medidas, Quantidade, Tensão, Prazos.
Se faltar, responda JSON:
{ "alert": true, "missing": [...], "suggestion": "texto" }
Se estiver ok: { "alert": false }
`;
  const chat = await ai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: system }, { role: 'user', content: text }],
    temperature: 0.2
  });
  const { alert, suggestion } = JSON.parse(chat.data.choices[0].message.content);
  if (alert) {
    const phone = log.payload.user.Telefone;
    await client.sendText(phone, `❗ ${suggestion}`);
    // aqui você insere a lógica de 6h/12h/18h
    // se for crítico:
    // await client.sendText(GROUP_ID, `🚨 ${suggestion}`);
  }
}

function handleIncoming(msg) {
  processLog({
    payload: {
      user: { Telefone: msg.from.replace('@c.us','') },
      Mensagem: { text: msg.body }
    }
  });
}

app.listen(PORT, () => console.log(`🚀 Porta ${PORT}`));
