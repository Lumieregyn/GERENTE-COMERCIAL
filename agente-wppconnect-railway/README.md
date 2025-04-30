# Agente IA + WhatsApp (WppConnect) para Railway

Este projeto usa GPT-4o e WppConnect para analisar conversas comerciais e disparar alertas automáticos via WhatsApp.

## Como usar

1. Clone o projeto
2. Instale dependências:

```bash
npm install
```

3. Preencha o arquivo `.env` com sua chave OpenAI e número do gestor
4. Rode localmente ou suba para a Railway

Ao iniciar, escaneie o QR Code do seu WhatsApp no terminal.

## Endpoint

- `POST /conversa`: recebe payloads e dispara alerta se faltarem confirmações

Exemplo de payload esperado:

```json
{
  "payload": {
    "user": {
      "Phone": "5562985297035",
      "Name": "Fernando"
    },
    "attendant": {
      "Name": "Vendedor A"
    },
    "Message": {
      "text": "Pode fazer o modelo dourado, 110V, com 3 unidades"
    }
  }
}
```
