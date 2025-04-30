const { analyzeMessage } = require('../utils/checklistAnalyzer');

async function handleIncomingMessage(message) {
  const analysis = await analyzeMessage(message);
  console.log('Resultado da análise:', analysis);
}

module.exports = { handleIncomingMessage };
