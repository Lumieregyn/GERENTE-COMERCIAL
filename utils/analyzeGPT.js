
module.exports = async function analyzeMessage(text) {
  // Simula inteligência: procura sinais de fechamento
  const sinais = ["quero fechar", "pode gerar", "fechado", "vamos fechar", "quero esse"];
  const normalizado = text.toLowerCase();
  return {
    fechamento: sinais.some(s => normalizado.includes(s)),
    original: text
  };
}
