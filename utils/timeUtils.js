function isBusinessHour(date = new Date()) {
  const day = date.getDay(); // 0 Sunday, 6 Saturday
  const hour = date.getHours();
  if (day === 0 || day === 6) return false;
  return hour >= 8 && hour < 19;
}

module.exports = { isBusinessHour };
module.exports.estáNoHorárioComercial = function estáNoHorárioComercial() {
  const now = new Date();
  const day = now.getDay(); // 0=dom,6=sáb
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 19;
};
