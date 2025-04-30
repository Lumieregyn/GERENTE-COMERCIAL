async function analyzeMessage(msg) {
  if (/fechar/i.test(msg.text)) {
    return {
      level: 'normal',
      text: `🟢 O cliente sinalizou fechamento: "${msg.text}".`
    };
  }
  return null;
}
module.exports = { analyzeMessage };
