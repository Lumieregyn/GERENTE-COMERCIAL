// index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const { create } = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const moment = require('moment-business-time');

//
// ————————————————————————————————————————————————————————————————————————
// Configuration
// ————————————————————————————————————————————————————————————————————————

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // configure no .env
const MGMT_GROUP = process.env.MGMT_GROUP_PHONE;   // ex: '55XXXXXXXXXXX-YYYYYYYY@g.us'

const VENDORS = {
  'Cindy Loren': '5562994671766',
  'Ana Clara Martins': '5562991899053',
  'Emily':           '5562981704171'
};

// configure business hours: Mon–Fri 08:00–19:00
moment.updateLocale('en', {
  workinghours: {
    0: null,
    1: ['08:00:00', '19:00:00'],
    2: ['08:00:00', '19:00:00'],
    3: ['08:00:00', '19:00:00'],
    4: ['08:00:00', '19:00:00'],
    5: ['08:00:00', '19:00:00'],
    6: null
  },
  holidays: [],           // adicionar feriados no formato 'YYYY-MM-DD'
  holidayFormat: 'YYYY-MM-DD'
});

// in-memory store for orçamentos pendentes
const budgets = {};
// budgets[convId] = {
//   clientName: string,
//   vendorPhone: string,
//   createdAt: moment,
//   alertsSent: [6,12,18],
//   responded: boolean
// }

//
// ————————————————————————————————————————————————————————————————————————
// WhatsApp Client + Dynamic QR
// ————————————————————————————————————————————————————————————————————————

let wppClient = null;
let lastQr = null;

// Inicializa sessão WhatsApp
create({
  session: 'gerente-comercial',
  puppeteerOptions: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
})
.then(client => {
  wppClient = client;
  console.log('✅ WhatsApp client ready');
  client.onStateChange(state => {
    // evita conflito de sessão
    if (state === 'CONFLICT' || state === 'UNPAIRED') {
      client.forceRefocus();
    }
  });
  client.onQr(qr => {
    lastQr = qr;
    console.log('🔄 QR code updated');
  });
})
.catch(err => console.error('❌ Erro ao iniciar o cliente WPP:', err));

// rota para exibir QR (atualiza a cada 60s)
app.get('/qr', async (req, res) => {
  if (!lastQr) {
    return res.send('<h3>QR code ainda não disponível, aguarde...</h3>');
  }
  const dataUrl = await QRCode.toDataURL(lastQr);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Scan QR</title></head>
      <body style="text-align:center;font-family:sans-serif;">
        <h2>WhatsApp Web — Gerente Comercial IA</h2>
        <img src="${dataUrl}" />
        <p>(Atualiza a cada 60s)</p>
        <script>setTimeout(()=>location.reload(),60000)</script>
      </body>
    </html>
  `);
});

//
// ————————————————————————————————————————————————————————————————————————
// Scheduler de Alertas de Orçamento
// ————————————————————————————————————————————————————————————————————————

setInterval(() => {
  const now = moment();
  for (const convId in budgets) {
    const b = budgets[convId];
    if (b.responded) continue;
    const diff = now.businessDiff(b.createdAt, 'hours');
    [6, 12, 18].forEach(th => {
      if (diff >= th && !b.alertsSent.includes(th)) {
        sendBudgetAlert(b, th);
        b.alertsSent.push(th);
      }
    });
  }
}, 60_000);

async function sendBudgetAlert(b, threshold) {
  const { clientName, vendorPhone } = b;
  let text;
  if (threshold === 6) {
    text = `⚠️ Prezado(a) [Vendedor], o cliente ${clientName} encontra-se há 6 horas úteis aguardando o orçamento. Por favor, conclua o atendimento o quanto antes.`;
    await wppClient.sendText(vendorPhone, text);
  }
  else if (threshold === 12) {
    text = `⚠️ Prezado(a) [Vendedor], reforçamos que ${clientName} permanece aguardando seu orçamento há 12 horas úteis. Providencie urgência.`;
    await wppClient.sendText(vendorPhone, text);
  }
  else if (threshold === 18) {
    text = `🚨 Prezado(a) [Vendedor], ${clientName} está há 18 horas úteis aguardando o orçamento. Você tem 10 minutos para responder. Caso contrário, será transferido à Gerência Comercial IA.`;
    await wppClient.sendText(vendorPhone, text);
    // escalona para grupo caso não responda em 10'
    setTimeout(async () => {
      if (!b.responded) {
        const grpMsg = `🚨 Atenção Gerência Comercial IA:\nO cliente ${clientName} ficou 18h sem orçamento e o vendedor não respondeu. Ação requerida.`;
        await wppClient.sendText(MGMT_GROUP, grpMsg);
      }
    }, 10 * 60_000);
  }
}

//
// ————————————————————————————————————————————————————————————————————————
// Webhook de Logs (/conversa)
// ————————————————————————————————————————————————————————————————————————

app.post('/conversa', async (req, res) => {
  const p = req.body;
  console.log('📬 Payload recebido:', JSON.stringify(p, null, 2));
  res.send('OK');

  if (p.type !== 'message-received') return;

  const user    = p.payload.user;
  const msgText = p.payload.message?.text || '';
  const session = user.Session.Id;
  const convId  = `${user.ChatbotId}:${session}`;
  const vendorPhone = p.payload.atendente?.Phone || p.payload.atendente?.Telefone;
  const clientName  = user.Name;

  // 1) Se for pedido de orçamento -> cria tracker
  if (/orcamento|orçamento/i.test(msgText) && !budgets[convId]) {
    budgets[convId] = {
      clientName,
      vendorPhone,
      createdAt: moment(),
      alertsSent: [],
      responded: false
    };
    console.log(`🆕 Budget tracker criado para ${convId}`);
  }

  // 2) Detecta intenção de fechamento
  const isClosure = await detectClosureIntent(msgText);
  if (isClosure) {
    // marca como respondido (cancela futuros alertas)
    if (budgets[convId]) budgets[convId].responded = true;

    // executa checklist de confirmações
    const { missing, suggestion } = await runChecklist(p);
    if (missing.length > 0) {
      // sugere ao vendedor
      await wppClient.sendText(vendorPhone, suggestion);
    } else {
      // tudo ok — (futuro: gerar pedido automaticamente)
      await wppClient.sendText(vendorPhone, `✅ Todos os dados confirmados. Gerando o pedido...`);
    }
  }
});

//
// ————————————————————————————————————————————————————————————————————————
// Funções de IA
// ————————————————————————————————————————————————————————————————————————

async function detectClosureIntent(text) {
  const prompt = `O cliente deseja fechar a compra? Responda apenas "yes" ou "no".\n\nMensagem: "${text}"`;
  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt,
        max_tokens: 3,
        temperature: 0
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );
    const ans = resp.data.choices[0].text.trim().toLowerCase();
    return ans === 'yes';
  } catch (e) {
    console.error('❌ detectClosureIntent error', e);
    return false;
  }
}

async function runChecklist(payload) {
  const convo = JSON.stringify(payload.payload.message || payload.payload, null, 2);
  const system = `Você é um assistente que verifica se a conversa inclui todos os dados obrigatórios: produto, cor, medidas, quantidade, tensão e prazo de entrega. Retorne um JSON com "missing": [itens faltantes] e "suggestion": "mensagem para o vendedor".`;
  const userMsg = `Conversa:\n${convo}`;
  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg }
        ],
        temperature: 0
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );
    const text = resp.data.choices[0].message.content;
    // Ex.: { "missing": ["cor","tensão"], "suggestion": "Por favor confirme cor e tensão antes de gerar." }
    return JSON.parse(text);
  } catch (e) {
    console.error('❌ runChecklist error', e);
    return { missing: [], suggestion: 'Não foi possível rodar o checklist.' };
  }
}

//
// ————————————————————————————————————————————————————————————————————————
// Start Server
// ————————————————————————————————————————————————————————————————————————

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
