const fs = require("fs");

global.thumbnail = "https://g.top4top.io/p_3635g6w6v1.jpg"
global.ownerUsername = "Caynnmac"
global.ownerId = "7691095744"
global.domain = "https://caynnpanel-site.jkt48.my.id"
global.plta = "ptla_jyB6sAVWX6Fy4Pf9tjPwgtw4vpLGm4dR7oVlAWjAh9Q"
global.pltc = "ptlc_W9AZbpqkGepdSuFwA0JD28uExw8YeditJWXadFr0eCn"
global.loc = "1"
global.eggs = "15"
global.nests = "5"

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`• File update: ${__filename}`);
  delete require.cache[file];
  require(file);
});