const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function analyzeMensagem(payload) {
  // TODO: implement ChatGPT analysis logic
  return {};
}

module.exports = { analyzeMensagem };
