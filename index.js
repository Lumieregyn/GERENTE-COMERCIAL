// index.js

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const wppconnect = require('@wppconnect-team/wppconnect');
const { OpenAI } = require('openai'); // v4: usa a classe OpenAI diretamente

// Inicializa a API da OpenAI
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const app = express();
app.use(bodyParser.json());

// Monta cliente WhatsApp
wppconnect
  .create({
    session: 'gerente-comercial',
    headless: true,
    puppeteerOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })
  .then(client => {
    // Gera QR dinâmico
    client.onQr(qr => {
      QRCode.toDataURL(qr).then(url => {
        app.get('/qr', (req, res) => {
          res.send(`
            <h3>Escaneie o QR com o WhatsApp:</h3>
            <img src="${url}" />
          `);
        });
      });
    });

    // Quando conectado
    client.onStateChanged(state => {
      if (state === 'CONNECTED') {
        console.log('✅ WhatsApp conectado.');
        // QR já não precisa mais ficar disponível
        app.get('/qr', (req, res) => res.send('<h3>WhatsApp já conectado!</h3>'));
      }
    });

    // Endpoint para receber payload do webhook Suri
    app.post('/conversa', async (req, res) => {
      const payload = req.body;
      console.log('📥 Payload recebido:', JSON.stringify(payload, null, 2));

      // Extrai texto, anexos, vendedor, cliente etc...
      const texto = payload.payload.Mensagem.text || '';
      const anexos = payload.payload.Mensagem.anexos || [];
      const vendedorTel = payload.atendente.Telefone || payload.atendente.Id;
      const cliente = payload.payload.user.Nome;

      // Chama a OpenAI para analisar checklist
      const prompt = `
Você é o Gerente Comercial IA. Avalie esta conversa:
Cliente: "${texto}"
Anexos: ${anexos.map(a => a.tipo).join(', ')}
Responda quais pontos de checklist faltam: produto, cor, medidas, tensão, prazo e confirmação de fechamento.
`;
      const chat = await ai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      const analise = chat.choices[0].message.content;
      console.log('🤖 Análise IA:', analise);

      // Lógica de alertas baseada na análise e no tempo de espera já registrada por seu sistema
      // (implemente aqui sua lógica de horas: 6h/12h/18h e envio p/ vendedores ou grupo)

      // Exemplo simples de envio de mensagem de alerta ao vendedor
      await client.sendText(vendedorTel, `⚠️ Alerta de checklist:\n${analise}`);

      res.sendStatus(200);
    });

    // Sobe o servidor HTTP
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Erro ao iniciar o cliente WPP:', err);
    process.exit(1);
  });
