function isBusinessHours() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  return (day >= 1 && day <= 5) && (hour >= 8 && hour <= 19);
}
module.exports = { isBusinessHours };
