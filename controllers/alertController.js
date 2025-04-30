const { sendMessage } = require('../services/whatsappService');

async function sendFirstAlert(phone) {
  await sendMessage(phone, '⏳ Alerta: Orçamento Atrasado (6h)\nGentileza priorizar esse atendimento.');
}

async function sendSecondAlert(phone) {
  await sendMessage(phone, '⚠️ Alerta: Orçamento Atrasado (12h)\nO cliente ainda aguarda resposta.');
}

async function sendLastWarning(phone) {
  await sendMessage(phone, '🚨 Último Alerta: Risco de Transferência\nVocê tem 10 minutos para justificar o atraso.');
}

module.exports = { sendFirstAlert, sendSecondAlert, sendLastWarning };
