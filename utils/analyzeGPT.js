const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function analyzeMensagem(payload) {
  // TODO: implement ChatGPT analysis logic
  return {};
}

module.exports = { analyzeMensagem };
module.exports.analisarMensagem = async function analisarMensagem(payload) {
  // Exemplo mínimo: loga e retorna
  console.log('📌 Analisando payload:', payload);
  // TODO: chamar seu GPT-4, verificar regras aprovadas, enviar alertas via WPPConnect etc.
};
