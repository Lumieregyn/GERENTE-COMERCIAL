# Gerente Comercial IA

Projeto para monitoramento de conversas via WhatsApp, com IA para geração de alertas e checklists.

## Instalação

1. Clone este repositório.
2. Rode `npm install`.
3. Configure o webhook em sua plataforma (ex: Suri) apontando para `/conversa`.
4. Faça deploy (e.g., Railway) e aguarde geração do QR code em `/`.

## Uso

- Acesse a rota `/` para escanear o QR code e conectar o WhatsApp.
- Webhook `/conversa` recebe os logs e processa a lógica de alertas.
- Ajuste a lógica no `index.js` conforme suas regras aprovadas.

## Dependências

- Node.js 18
- @wppconnect-team/wppconnect v1.9.3 (versão do WhatsApp Web forçada para 2.2407.3)
- Express
- QRCode
