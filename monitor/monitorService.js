const { sendFirstAlert, sendSecondAlert, sendLastWarning } = require('../controllers/alertController');

function startMonitoring() {
  console.log('Iniciando monitoramento contínuo de atrasos...');
  setInterval(async () => {
    console.log('Verificando possíveis atrasos...');
    // Simular lógica de alerta a cada hora (exemplo)
  }, 3600000); // 1h
}

module.exports = { startMonitoring };
