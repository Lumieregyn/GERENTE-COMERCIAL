# Gerente Comercial

Projeto para monitoramento e alertas via WhatsApp utilizando WPPConnect e IA.

## Estrutura

- `index.js` - ponto de entrada do servidor express + WPPConnect.
- `utils/analyzeGPT.js` - lógica de análise de mensagens via OpenAI.
- `utils/timeUtils.js` - utilitário para verificar horário comercial.
- `public/index.html` - visualização do QR Code.

## Docker

```bash
docker build -t gerente-comercial .
docker run -p 8080:8080 --env-file .env gerente-comercial
```

## Variáveis de ambiente

- `OPENAI_API_KEY` - chave da API OpenAI.
- `WPP_SESSION_NAME` - nome da sessão WPPConnect (opcional).
