const { createGroupAndSend } = require('../services/whatsappService');

async function escalateToManagers(managersNumbers, clientInfo) {
  const groupId = await createGroupAndSend('Gerente Comercial IA', managersNumbers, `Alerta 🚨: Cliente aguardando resposta: ${clientInfo}`);
  return groupId;
}

module.exports = { escalateToManagers };
