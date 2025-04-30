function isBusinessHour(date = new Date()) {
  const day = date.getDay(); // 0 Sunday, 6 Saturday
  const hour = date.getHours();
  if (day === 0 || day === 6) return false;
  return hour >= 8 && hour < 19;
}

module.exports = { isBusinessHour };
