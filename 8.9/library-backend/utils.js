
const generateAuthorId = () => {
  return makeId(8) + "-" + makeId(4) + "-" + makeId(4) + "-" + makeId(4) + "-" + makeId(12);
};

const makeId = (length) => {
  var result = "";
  var characters =
    "abcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = {
  generateAuthorId,
};
