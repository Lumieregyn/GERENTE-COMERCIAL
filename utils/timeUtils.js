function isBusinessHour() {
  const d = new Date();
  const h = d.getHours();
  const dow = d.getDay();
  return dow >= 1 && dow <= 5 && h >= 8 && h < 19;
}
module.exports = { isBusinessHour };
