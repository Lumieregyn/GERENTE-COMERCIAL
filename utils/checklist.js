
module.exports = function checklist(analise) {
  if (!analise.fechamento) return ['Cliente ainda não sinalizou fechamento'];
  return [];
}
