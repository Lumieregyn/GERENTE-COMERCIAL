const axios = require('axios');
async function analyzeMessage(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Analise a mensagem: \"" + text + "\". Existe intenção de fechar o pedido? Faltam informações como produto, cor, quantidade, medidas, tensão ou prazo?" }]
    }, {
      headers: {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro na análise GPT-4o:', error.response?.data || error.message);
    return null;
  }
}
module.exports = { analyzeMessage };
