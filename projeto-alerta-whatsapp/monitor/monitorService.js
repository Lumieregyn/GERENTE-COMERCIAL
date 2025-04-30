const { sendMessage } = require('../services/whatsappService');

function startMonitoring() {
  console.log('Monitoramento contínuo iniciado...');
  // Simulação de análise de tempo
  setInterval(() => {
    console.log('Verificando atrasos...');
    // Aqui virá a lógica real de verificação de atrasos
  }, 3600000); // 1 hora
}

module.exports = { startMonitoring };
