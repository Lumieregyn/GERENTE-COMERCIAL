// index.js
require('dotenv').config();
const express       = require('express');
const bodyParser    = require('body-parser');
const qrcode        = require('qrcode');
const wppconnect    = require('@wppconnect-team/wppconnect');
const { Configuration, OpenAIApi } = require('openai');

const app       = express();
const PORT      = process.env.PORT || 8080;
const SURI_HOOK = process.env.SURI_WEBHOOK_URL;        // ex: https://webhook-suri-agent.onrender.com/conversa
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GROUP_ID   = process.env.WHATSAPP_GROUP_ID;      // ID do grupo “Gerente Comercial IA”

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Armazena o último QR gerado
let latestQr = null;

// Instância do cliente WhatsApp
let waClient = null;

// Configura OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: OPENAI_KEY
}));

// 1) Inicia o cliente WPPConnect
wppconnect.create({
  session: 'gerente-comercial',
  headless: true,            // ou false, se quiser ver o browser
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  }
})
.then(client => {
  waClient = client;

  // QR Code
  waClient.on('qr', qr => {
    console.log('QR recebido:', qr);
    latestQr = qr;
  });

  waClient.on('ready', () => {
    console.log('✅ WhatsApp pronto!');
  });

  // Mensagens diretas (não notificações de sistema)
  waClient.on('message', async msg => {
    try {
      await processIncoming(msg);
    } catch (e) {
      console.error('Erro no processIncoming:', e);
    }
  });

})
.catch(err => console.error('❌ Erro iniciando WPPConnect:', err));

// 2) Rota para exibir QR dinâmico
app.get('/qr', async (req, res) => {
  if (!latestQr) {
    return res.send('QR ainda não pronto, aguarde...');
  }
  try {
    const dataUrl = await qrcode.toDataURL(latestQr);
    res.send(`
      <html>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;">
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Erro gerando imagem do QR:', err);
    res.status(500).send('Erro interno');
  }
});

// 3) Webhook da Suri para receber logs em tempo real
app.post('/conversa', async (req, res) => {
  const payload = req.body;
  console.log('📌 Payload recebido:', JSON.stringify(payload, null, 2));
  try {
    await handleSuriPayload(payload);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ handleSuriPayload:', err);
    res.sendStatus(500);
  }
});

// 4) Processa cada mensagem recebida via webhook
async function handleSuriPayload(log) {
  // Exemplo de trigger: só inicia check se detectar intenção de fechamento
  const text = log.payload?.Mensagem?.text?.toLowerCase() || '';
  const intentClose = text.includes('fechar') || text.includes('quero fechar') || text.includes('fechamento');

  if (!intentClose) {
    // Sem sinal de fechamento, não dispara IA nem alertas
    return;
  }

  // Monta prompt para OpenAI baseado no checklist aprovado
  const systemPrompt = `
Você é o Gerente Comercial IA. Dado o histórico da conversa abaixo, identifique se faltam:
- Produto
- Cor
- Medidas
- Quantidade
- Tensão (110/220v)
- Prazo de produção ou disponibilidade + prazo de envio

Se faltar algo, gere uma SUGESTÃO de mensagem para o vendedor confirmar. 
Caso esteja tudo OK, não gere alerta.
Formato de resposta JSON:
{
  "alert": true|false,
  "missing": [ ...itens faltantes... ],
  "suggestion": "Texto da sugestão ao vendedor"
}
`;

  const userPrompt = `Histórico (última mensagem): "${log.payload.Mensagem.text}"`;

  // Chama OpenAI
  const chat = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.2
  });

  const result = JSON.parse(chat.data.choices[0].message.content);

  if (result.alert) {
    // Envia sugestão ao vendedor
    const vendedorPhone = log.payload.user.Telefone;                  // ex: "5562985299728"
    await waClient.sendText(vendedorPhone, `❗ Atenção: ${result.suggestion}`);

    // Se for alerta final (faltou em 18h ou caso crítico), notifica o grupo
    if (shouldNotifyGroup(log)) {
      await waClient.sendText(GROUP_ID, `🚨 Alerta crítico para ${log.payload.user.Nome}: ${result.suggestion}`);
    }
  }
}

// 5) Lógica para decidir se dispara alerta no grupo
function shouldNotifyGroup(log) {
  // Aqui você implementa a verificação de tempo (6h,12h,18h) e o estado atual
  // Exemplo simplificado (deixe como stub ou implemente seu scheduler):
  return false;
}

// 6) Processamento de mensagens diretas (via WPPConnect)
async function processIncoming(msg) {
  // Aqui você pode encaminhar ao mesmo handleSuriPayload ou implementar lógica similar
  // Por simplicidade, vamos transformar em payload e chamar handleSuriPayload:
  const fauxLog = {
    payload: {
      user: {
        Telefone: msg.from.replace('@c.us',''),
        Nome: msg.sender.pushname || msg.from
      },
      Mensagem: { text: msg.body }
    }
  };
  await handleSuriPayload(fauxLog);
}

// 7) Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
