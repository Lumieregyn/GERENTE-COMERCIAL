require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const { create } = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const moment = require('moment-business-time');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 8080;
const MGMT_GROUP = process.env.MGMT_GROUP_ID; // ex: '55XXXXX-YYYY@g.us'
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const VENDORS = {
  'Cindy Loren':    '5562994671766',
  'Ana Clara Martins':'5562991899053',
  'Emily':          '5562981704171'
};

moment.updateLocale('en', {
  workinghours: {
    0: null,
    1: ['08:00:00','19:00:00'],
    2: ['08:00:00','19:00:00'],
    3: ['08:00:00','19:00:00'],
    4: ['08:00:00','19:00:00'],
    5: ['08:00:00','19:00:00'],
    6: null
  },
  holidays: [],
  holidayFormat: 'YYYY-MM-DD'
});

let wpp, lastQr;
create({
  session: 'gerente-comercial',
  puppeteerOptions: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
})
.then(c => {
  wpp = c;
  c.onQr(qr => lastQr = qr);
  c.onStateChange(s => (s==='CONFLICT'||s==='UNPAIRED') && c.forceRefocus());
})
.catch(e => console.error('WPP init error', e));

app.get('/qr', async (req, res) => {
  if (!lastQr) return res.send('QR ainda não pronto, aguarde...');
  const img = await QRCode.toDataURL(lastQr);
  res.send(`
    <html><body style="text-align:center">
      <h3>Gerente Comercial IA</h3>
      <img src="${img}"/><p>Atualiza em 60s</p>
      <script>setTimeout(()=>location.reload(),60000)</script>
    </body></html>`);
});

const budgets = {}; 
// budgets[convId] = { client, vendor, created: moment, sent:[6,12,18], answered:bool }

app.post('/conversa', async (req, res) => {
  res.send('OK');
  const p = req.body;
  if (p.type !== 'message-received') return;
  const txt = p.payload.message?.text || '';
  const user = p.payload.user;
  const vendorName = p.payload.atendente?.Nome;
  const vendor = VENDORS[vendorName];
  const clientName = user.Name;
  const convId = `${user.ChatbotId}:${user.Session.Id}`;

  if (/orcament/i.test(txt) && !budgets[convId]) {
    budgets[convId] = { client: clientName, vendor, created: moment(), sent: [], answered: false };
  }

  if (await detectClose(txt)) {
    const b = budgets[convId];
    if (b) b.answered = true;
    const { missing, suggestion } = await runChecklist(p.payload);
    await wpp.sendText(vendor, missing.length ? suggestion : '✅ Tudo confirmado. Gerando pedido...');
  }
});

setInterval(() => {
  const now = moment();
  Object.values(budgets).forEach(b => {
    if (b.answered) return;
    const h = now.businessDiff(b.created, 'hours');
    [6,12,18].forEach(th => {
      if (h >= th && !b.sent.includes(th)) {
        alertBudget(b, th);
        b.sent.push(th);
      }
    });
  });
}, 60_000);

async function alertBudget(b, th) {
  const { client, vendor } = b;
  if (th === 6)
    await wpp.sendText(vendor, `⚠️ Cliente ${client} aguardando orçamento há 6h úteis.`);
  if (th === 12)
    await wpp.sendText(vendor, `⚠️ Cliente ${client} aguardando orçamento há 12h úteis.`);
  if (th === 18) {
    await wpp.sendText(vendor, `🚨 Cliente ${client} há 18h úteis sem orçamento. Você tem 10min para responder.`);
    setTimeout(async () => {
      if (!b.answered) {
        await wpp.sendText(MGMT_GROUP, `🚨 ${client} ficou 18h sem orçamento e sem resposta.`);
      }
    }, 10*60_000);
  }
}

async function detectClose(text) {
  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/completions',
      { model:'text-davinci-003', prompt:`Fecha? "${text}"`, max_tokens:3 },
      { headers:{ Authorization:`Bearer ${OPENAI_KEY}` } }
    );
    return resp.data.choices[0].text.trim().toLowerCase()==='yes';
  } catch { return false; }
}

async function runChecklist(payload) {
  const convo = JSON.stringify(payload.message || payload);
  const sys = `Verifique se tem produto, cor, medidas, qtd, tensão e prazo. Retorne JSON {missing:[], suggestion:"msg"}.`;
  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model:'gpt-4o-mini', messages:[{role:'system',content:sys},{role:'user',content:convo}] },
      { headers:{ Authorization:`Bearer ${OPENAI_KEY}` } }
    );
    return JSON.parse(resp.data.choices[0].message.content);
  } catch { return { missing:[], suggestion:'Erro no checklist.' }; }
}

app.listen(PORT, () => console.log(`🚀 Porta ${PORT}`));
