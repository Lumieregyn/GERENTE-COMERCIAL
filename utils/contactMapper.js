const contacts = {
  "Cindy Loren": "6294671766",
  "Ana Clara": "6291899053",
  "Emily": "62981704171",
  "Fernando": "62985293035",
  "Marcelle": "62985299728"
};

function getPhoneByName(name) {
  return contacts[name];
}

module.exports = { getPhoneByName };
