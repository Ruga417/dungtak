const fs = require("fs");

global.thumbnail = "https://g.top4top.io/p_3635g6w6v1.jpg"
global.ownerUsername = "Caynnmac"
global.ownerId = "7691095744"
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`• File update: ${__filename}`);
  delete require.cache[file];
  require(file);
});