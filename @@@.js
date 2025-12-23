require("./settings/config.js");
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const https = require("https");
const ffmpeg = require("fluent-ffmpeg");

const apiId = 35498796;
const apiHash = "9d80d26001379b06ca77dda403a85061";


const capcutsrchCache = new Map();
const searchFdroidCache = new Map();
const searchGooglePlayCache = new Map();
const searchMLHeroCache = new Map();
const searchMLDetailCache = new Map();
const searchIgReelsCache = new Map();
const searchIgUsersCache = new Map();
const searchPinterestV2Cache = new Map();
const searchPinterestV1Cache = new Map();
const capcutCache = new Map();
const fdroidCache = new Map();
const threadsCache = new Map();
const pinterestCache = new Map();
const youtubeCache = new Map();
const tiktokCache = new Map();
const instagramcache = new Map();
const teraboxCache = new Map();
const ytCache = new Map();

const SESSION_FILE = "session.json";
const BLACKLIST_FILE = "blacklist.json";
const PAY_FILE = "pay.json";
let payMethods = [];

if (fs.existsSync(PAY_FILE)) {
  try {
    payMethods = JSON.parse(fs.readFileSync(PAY_FILE));
  } catch (e) {
    console.log("❌ File pay.json corrupt, buat baru");
    payMethods = [];
  }
}
const savePayMethods = () => {
  fs.writeFileSync(PAY_FILE, JSON.stringify(payMethods, null, 2));
};

const withFooter = (text) => {
    return `${text}\n\n<a style="text-decoration: none;" href="t.me/${global.ownerUsername}">## By PianTech</a>`;
};

let blacklist = [];
if (fs.existsSync(BLACKLIST_FILE)) {
  try {
    blacklist = JSON.parse(fs.readFileSync(BLACKLIST_FILE));
  } catch (e) {
    console.log("❌ File blacklist corrupt, buat baru");
    blacklist = [];
  }
}
const saveBlacklist = () => {
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2));
};


let savedSession = "";
if (fs.existsSync(SESSION_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(SESSION_FILE));
    savedSession = data.session || "";
  } catch (e) {
    console.log("❌ Session corrupt, login ulang diperlukan");
  }
}
const stringSession = new StringSession(savedSession);

let isAfk = false;
let afkReason = "";
let afkTime = 0;

let autoCfdState = {
  running: false,
  interval: null,
  replyMsgId: null,
  originChatId: null,
  duration: 0,
};


(async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
                      𝗧𝗘𝗥𝗠𝗜𝗡𝗔𝗟 || 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚════════════════════════════════════════════════════════════╝`);

  const pian = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  if (!savedSession) {
    await pian.start({
      phoneNumber: async () => {
        console.log("=== LOGIN TELEGRAM ===");
        console.log("Silakan masukkan nomor telepon Anda (+62xxx):");
        return await input.text("> Nomor: ");
      },
      phoneCode: async () => {
        console.log("Telegram sudah mengirimkan kode OTP ke akun Anda.");
        console.log("Silakan masukkan kode OTP (biasanya 5 digit):");
        return await input.text("> OTP: ");
      },
      password: async () => {
        console.log("Akun Anda menggunakan verifikasi dua langkah (2FA).");
        console.log("Masukkan sandi/password 2FA:");
        return await input.text("> Password 2FA: ");
      },
      onError: (err) => console.log("❌ Error:", err),
    });

    fs.writeFileSync(
      SESSION_FILE,
      JSON.stringify({ session: pian.session.save() }, null, 2)
    );
    console.log("💾 Новая сессия сохранена в", SESSION_FILE);
  } else {
    await pian.connect();
    console.log("🌐 Автоматический вход в систему с использованием session.json");
  }

  const me = await pian.getMe();
const myId = me.id.toString();

try {
  await pian.sendMessage("vafuvafu", {
    message: "Lapor kinkk, babu elu nambah 1 🤭🤭🤭"
  });
  console.log("✅ успешно подключено");
} catch (err) {
  console.log("⚠️ ошибка, дорогой", err.message);
}

async function runAutoCfd(pian, originChatId, replyMsgId) {
  try {
    
    const replyMsgArray = await pian.getMessages(originChatId, { ids: [replyMsgId] });
    if (!replyMsgArray || replyMsgArray.length === 0 || !autoCfdState.running) {
        if (autoCfdState.interval) {
            clearInterval(autoCfdState.interval);
        }
        autoCfdState.running = false;
        autoCfdState.interval = null;
        autoCfdState.replyMsgId = null;
        autoCfdState.originChatId = null;
        autoCfdState.duration = 0;
        
        try {
            await pian.sendMessage(originChatId, {
                message: withFooter("<blockquote>⚠️ AUTO CFD dihentikan secara otomatis karena pesan asli telah dihapus atau bot dihentikan.</blockquote>"),
                parseMode: "html"
            });
        } catch {}
        return;
    }

    const dialogs = await pian.getDialogs();
    let successCount = 0;
    let failCount = 0;

    for (const dialog of dialogs) {
      if (dialog.isGroup && !blacklist.includes(dialog.id.toString())) {
        try {
          await pian.forwardMessages(dialog.id, { messages: replyMsgId, fromPeer: originChatId });
          successCount++;
        } catch {
          failCount++;
        }
      }
    }
    
    // Tampilkan hasil di chat asal
    const durationMinutes = autoCfdState.duration / (60 * 1000);

    const resultMessage = `
<blockquote>✅ AUTO CFD GROUP BERJALAN</blockquote>
<blockquote>INTERVAL: ${durationMinutes} menit
SUCCESS : ${successCount} pesan terkirim
GAGAL   : ${failCount} pesan gagal terkirim</blockquote>`;

    await pian.sendMessage(originChatId, {
      message: withFooter(resultMessage),
      parseMode: "html",
    });
  } catch (err) {
    console.log("⚠️ Error AUTO CFD:", err.message);
    if (autoCfdState.interval) {
        clearInterval(autoCfdState.interval);
    }
    autoCfdState.running = false;
    autoCfdState.interval = null;
    autoCfdState.replyMsgId = null;
    autoCfdState.originChatId = null;
    autoCfdState.duration = 0;
  }
}

  pian.addEventHandler(
    async (event) => {
      const msg = event.message;
      if (!msg || !msg.message) return;
      const text = msg.message.trim();
      
      try {
        if (msg.isGroup || msg.isPrivate) {
        }
      } catch(err) {
        console.log("⚠️ Error auto read:", err.message);
      }
 

if (msg.senderId.toString() === myId && text === ".ping") {
  const start = Date.now();
  let sent = await pian.sendMessage(msg.chatId, {
    message: withFooter("Yameteh."),
    replyTo: msg.isChannel ? undefined : msg.id,
  });

  setTimeout(async () => {
    try {
      await pian.editMessage(sent.chatId, { message: sent.id, text: withFooter("Kudasai..") });
    } catch {}
  }, 300);

  setTimeout(async () => {
    try {
      await pian.editMessage(sent.chatId, { message: sent.id, text: withFooter("Ahh Crot...") });
    } catch {}
  }, 600);

  setTimeout(async () => {
    const latency = Date.now() - start;
    try {
      await pian.editMessage(sent.chatId, {
        message: sent.id,
        text: withFooter(`Crot Nya Enak!\n⚡ ${latency} ms`),
      });
    } catch {}
  }, 900);

  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".ssweb")) {

  const args = text.split(" ").slice(1).join(" ");
  if (!args || !args.includes("http")) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan URL yang valid.\nContoh: .ssweb https://google.com</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mengambil screenshot website...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get(
      "https://api.vreden.my.id/api/v1/tools/screenshot",
      {
        params: {
          url: args,
          type: "phone"
        }
      }
    );

    if (!data.status || !data.result) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Gagal mengambil screenshot.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const imageUrl = data.result;

    await pian.sendFile(msg.chatId, {
      file: imageUrl,
      caption: withFooter(`<blockquote>📸 Screenshot Website\n<code>${args}</code></blockquote>`),
      parseMode: "html",
      replyTo: msg.id,
    });
    
    await waitMsg.delete();

  } catch (err) {
    console.log("SSWeb Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mengambil screenshot.</blockquote>"),
      parseMode: "html",
    });
  }

  return;
}
if (msg.senderId.toString() === myId && text.startsWith(".addbl")) {
  const chatName = msg.chat?.title || msg.chat?.firstName || "Chat";
  if (!blacklist.includes(msg.chatId.toString())) {
    blacklist.push(msg.chatId.toString());
    saveBlacklist();
    await pian.sendMessage(msg.chatId, {
      message: withFooter(
        `<blockquote>✅ Chat <b>${chatName}</b> ditambahkan ke blacklist.</blockquote>`
      ),
      parseMode: "html",
      replyTo: msg.isChannel ? undefined : msg.id,
    });
  } else {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(
        `<blockquote>⚠️ Chat <b>${chatName}</b> sudah ada di blacklist.</blockquote>`
      ),
      parseMode: "html",
      replyTo: msg.isChannel ? undefined : msg.id,
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".delbl")) {
  const chatName = msg.chat?.title || msg.chat?.firstName || "Chat";
  if (blacklist.includes(msg.chatId.toString())) {
    blacklist = blacklist.filter((id) => id !== msg.chatId.toString());
    saveBlacklist();
    await pian.sendMessage(msg.chatId, {
      message: withFooter(
        `<blockquote>✅ Chat <b>${chatName}</b> dihapus dari blacklist.</blockquote>`
      ),
      parseMode: "html",
      replyTo: msg.isChannel ? undefined : msg.id,
    });
  } else {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(
        `<blockquote>⚠️ Chat <b>${chatName}</b> tidak ada di blacklist.</blockquote>`
      ),
      parseMode: "html",
      replyTo: msg.isChannel ? undefined : msg.id,
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".cfdht user")) {
    if (!msg.replyTo) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"),
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html"
        });
        return;
    }

    const replyMsg = await msg.getReplyMessage();
    if (!replyMsg) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>❌ Pesan yang di-reply tidak valid.</blockquote>"),
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html"
        });
        return;
    }

    const dialogs = await pian.getDialogs();
    let successCount = 0;
    let failCount = 0;

    for (const dialog of dialogs) {
        if (
            dialog.isUser &&
            !dialog.isChannel &&
            !dialog.entity?.bot &&
            !blacklist.includes(dialog.id.toString())
        ) {
            try {
                
                await pian.sendMessage(dialog.id, {
                    message: withFooter(replyMsg.message || ""),
                    
                    ...(replyMsg.media ? { file: replyMsg.media } : {})
                });
                successCount++;
            } catch {
                failCount++;
            }
        }
    }

    const detailMessage =
        `<blockquote>「 DETAIL CFD HIDETAG USER 」</blockquote>\n\n` +
        `<blockquote>✅ SUCCESS : ${successCount} pesan terkirim</blockquote>\n` +
        `<blockquote>❌ GAGAL   : ${failCount} pesan gagal</blockquote>`;

    await pian.sendMessage(msg.chatId, {
        message: withFooter(detailMessage),
        replyTo: msg.isChannel ? undefined : msg.id,
        parseMode: "html",
    });
    return;
}

if (msg.senderId.toString() === myId && text.startsWith(".cfdht group")) {
    if (!msg.replyTo) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"),
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html"
        });
        return;
    }

    const replyMsg = await msg.getReplyMessage();
    if (!replyMsg) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>❌ Pesan yang di-reply tidak valid.</blockquote>"),
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html"
        });
        return;
    }

    const dialogs = await pian.getDialogs();
    let successCount = 0;
    let failCount = 0;

    for (const dialog of dialogs) {
        if (dialog.isGroup && !blacklist.includes(dialog.id.toString())) {
            try {
                
                const participants = await pian.getParticipants(dialog.id);
                const hidetags = participants
                    .filter(u => !u.deleted && !u.bot)
                    .map(u => `<a href="tg://user?id=${u.id}">\u200c</a>`).join("");

                const finalMessage = withFooter(`${replyMsg.message || ""}\n${hidetags}`);

                
                await pian.sendMessage(dialog.id, {
                    message: finalMessage,
                    parseMode: "html",
                    
                    ...(replyMsg.media ? { file: replyMsg.media } : {})
                });

                successCount++;
            } catch {
                failCount++;
            }
        }
    }

    const detailMessage =
        `<blockquote>「 DETAIL CFD HIDETAG GROUP 」</blockquote>\n\n` +
        `<blockquote>✅ SUCCESS : ${successCount} pesan terkirim</blockquote>\n` +
        `<blockquote>❌ GAGAL   : ${failCount} pesan gagal</blockquote>`;

    await pian.sendMessage(msg.chatId, {
        message: withFooter(detailMessage),
        replyTo: msg.isChannel ? undefined : msg.id,
        parseMode: "html",
    });
    return;
}


if (msg.senderId.toString() === myId && text.startsWith(".cfd user")) {
  if (!msg.replyTo) {
    await pian.sendMessage(msg.chatId, { 
      message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"), 
      replyTo: msg.isChannel ? undefined : msg.id,
      parseMode: "html"
    });
    return;
  }

  const replyMsg = await msg.getReplyMessage();
  if (!replyMsg) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Pesan yang di-reply tidak valid.</blockquote>"),
      replyTo: msg.isChannel ? undefined : msg.id,
      parseMode: "html"
    });
    return;
  }
  
  const dialogs = await pian.getDialogs();
  let successCount = 0;
  let failCount = 0;

  for (const dialog of dialogs) {
    if (
      dialog.isUser &&
      !dialog.isChannel &&
      !dialog.entity?.bot &&
      !blacklist.includes(dialog.id.toString())
    ) {
      try {
        await pian.forwardMessages(dialog.id, { messages: replyMsg.id, fromPeer: msg.chatId });
        successCount++;
      } catch {
        failCount++;
      }
    }
  }

  const detailMessage =
    `<blockquote>「 DETAIL CFD USER 」</blockquote>\n\n` +
    `<blockquote>✅ SUCCESS : ${successCount} pesan terkirim</blockquote>\n` +
    `<blockquote>❌ GAGAL   : ${failCount} pesan gagal</blockquote>`;

  await pian.sendMessage(msg.chatId, {
    message: withFooter(detailMessage),
    replyTo: msg.isChannel ? undefined : msg.id,
    parseMode: "html",
  });
  return;
}

if (text === ".cfd group") {
    if (msg.senderId.toString() !== myId) return;

    if (!msg.replyTo) {
        await pian.sendMessage(msg.chatId, { 
            message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"), 
            replyTo: msg.id,
            parseMode: "html"
        });
        return;
    }

    const replyMsg = await msg.getReplyMessage();
    if (!replyMsg) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>❌ Pesan yang di-reply tidak valid.</blockquote>"),
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html"
        });
        return;
    }
    
    const dialogs = await pian.getDialogs();
    let successCount = 0;
    let failCount = 0;

    for (const dialog of dialogs) {
        if (dialog.isGroup && !blacklist.includes(dialog.id.toString())) {
            try {
                await pian.forwardMessages(dialog.id, { messages: replyMsg.id, fromPeer: msg.chatId });
                successCount++;
            } catch {
                failCount++;
            }
        }
    }

    const resultMessage = `
<blockquote>✅ Pesan berhasil diteruskan ke grup!</blockquote>
<blockquote>DETAIL CFD GROUP
SUCCESS : ${successCount} pesan terkirim
GAGAL   : ${failCount} pesan gagal terkirim</blockquote>
    `;

    await pian.sendMessage(msg.chatId, {
        message: withFooter(resultMessage),
        replyTo: msg.id,
        parseMode: "html"
    });
    return;
}

if (msg.senderId.toString() === myId && text === ".cfd channel") {
    if (!msg.replyTo) {
        await pian.sendMessage(msg.chatId, { 
            message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"), 
            replyTo: msg.id,
            parseMode: "html"
        });
        return;
    }

    const replyMsg = await msg.getReplyMessage();
    if (!replyMsg) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>❌ Pesan yang di-reply tidak valid.</blockquote>"),
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html"
        });
        return;
    }
    
    const dialogs = await pian.getDialogs();
    let successCount = 0;
    let failCount = 0;

    for (const dialog of dialogs) {
        
        if (dialog.isChannel && !dialog.isGroup && !blacklist.includes(dialog.id.toString())) {
            try {
                
                await pian.forwardMessages(dialog.id, { messages: replyMsg.id, fromPeer: msg.chatId });
                successCount++;
            } catch (err) {
                
                console.log(`❌ Gagal CFD ke channel ${dialog.id}: ${err.message}`);
                failCount++;
            }
        }
    }

    const resultMessage = `
<blockquote>✅ Pesan berhasil diteruskan ke channel!</blockquote>
<blockquote>DETAIL CFD CHANNEL
SUCCESS : ${successCount} pesan terkirim
GAGAL   : ${failCount} pesan gagal terkirim</blockquote>
    `;

    await pian.sendMessage(msg.chatId, {
        message: withFooter(resultMessage),
        replyTo: msg.id,
        parseMode: "html"
    });
    return;
}

if (msg.senderId.toString() === myId && text.startsWith(".gikes user")) {
  if (!msg.replyTo) {
    await pian.sendMessage(msg.chatId, { 
      message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"), 
      replyTo: msg.isChannel ? undefined : msg.id,
      parseMode: "html"
    });
    return;
  }

  const replyMsg = await msg.getReplyMessage();
  if (!replyMsg) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Pesan tidak ditemukan!</blockquote>"),
      replyTo: msg.isChannel ? undefined : msg.id,
      parseMode: "html"
    });
    return;
  }

  const copyText = replyMsg.message || "";
  const hasMedia = replyMsg.media;
  if (!copyText && !hasMedia) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Tidak ada teks atau media untuk dikirim!</blockquote>"),
      replyTo: msg.isChannel ? undefined : msg.id,
      parseMode: "html"
    });
    return;
  }

  const dialogs = await pian.getDialogs();
  let successCount = 0;
  let failCount = 0;

  for (const dialog of dialogs) {
    if (
      dialog.isUser &&
      !dialog.isChannel &&
      !dialog.entity?.bot &&
      !blacklist.includes(dialog.id.toString())
    ) {
      try {
        if (hasMedia) {
            let file;
            if (replyMsg.photo) file = replyMsg.photo;
            else if (replyMsg.video) file = replyMsg.video;
            else if (replyMsg.document) file = replyMsg.document;
            else continue;

            await pian.sendFile(dialog.id, { 
                file: file,
                caption: withFooter(copyText),
                parseMode: "html"
            });
        } else {
            await pian.sendMessage(dialog.id, { 
                message: withFooter(copyText)
            });
        }
        successCount++;
      } catch(err) {
        console.log(`❌ Gagal gikes user ke ${dialog.id}: ${err.message}`);
        failCount++;
      }
    }
  }

  const detailMessage =
    `<blockquote>「 DETAIL GIKES USER 」</blockquote>\n\n` +
    `<blockquote>✅ SUCCESS : ${successCount} pesan terkirim</blockquote>\n` +
    `<blockquote>❌ GAGAL   : ${failCount} pesan gagal</blockquote>`;

  await pian.sendMessage(msg.chatId, {
    message: withFooter(detailMessage),
    replyTo: msg.isChannel ? undefined : msg.id,
    parseMode: "html",
  });
  return;
}

if (text === ".gikes group") {
    if (msg.senderId.toString() !== myId) return;

    if (!msg.replyTo) {
        await pian.sendMessage(msg.chatId, { 
            message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"), 
            replyTo: msg.id,
            parseMode: "html"
        });
        return;
    }

    const replyMsg = await msg.getReplyMessage();
    if (!replyMsg) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Pesan tidak ditemukan!</blockquote>"),
            replyTo: msg.id,
            parseMode: "html"
        });
        return;
    }

    const copyText = replyMsg.message || "";
    const hasMedia = replyMsg.media;
    if (!copyText && !hasMedia) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Tidak ada teks atau media untuk dikirim!</blockquote>"),
            replyTo: msg.id,
            parseMode: "html"
        });
        return;
    }

    const dialogs = await pian.getDialogs();
    let successCount = 0;
    let failCount = 0;

    for (const dialog of dialogs) {
        if (dialog.isGroup && !blacklist.includes(dialog.id.toString())) {
            try {
                if (hasMedia) {
                    let file;
                    if (replyMsg.photo) file = replyMsg.photo;
                    else if (replyMsg.video) file = replyMsg.video;
                    else if (replyMsg.document) file = replyMsg.document;
                    else continue;

                    await pian.sendFile(dialog.id, { 
                        file: file,
                        caption: withFooter(copyText),
                        parseMode: "html"
                    });
                } else {
                    await pian.sendMessage(dialog.id, { 
                        message: withFooter(copyText)
                    });
                }
                successCount++;
            } catch(err) {
                console.log(`❌ Gagal gikes group ke ${dialog.id}: ${err.message}`);
                failCount++;
            }
        }
    }

    const resultMessage = `
<blockquote>✅ Pesan berhasil dikirim ke grup!</blockquote>
<blockquote>DETAIL GIKES GROUP
SUCCESS : ${successCount} pesan terkirim
GAGAL   : ${failCount} pesan gagal terkirim</blockquote>
    `;

    await pian.sendMessage(msg.chatId, {
        message: withFooter(resultMessage),
        replyTo: msg.id,
        parseMode: "html"
    });
    return;
}

if (msg.senderId.toString() === myId && text.startsWith(".spam")) {
  if (!msg.replyTo) {
    await pian.sendMessage(msg.chatId, { message: withFooter("⚠️ Harus reply pesan!"), replyTo: msg.isChannel ? undefined : msg.id });
    return;
  }
  const parts = text.split(" ");
  if (parts.length < 2 || isNaN(parts[1])) {
    await pian.sendMessage(msg.chatId, { message: withFooter("⚠️ Format salah!\n.spam jumlah"), replyTo: msg.isChannel ? undefined : msg.id });
    return;
  }
  const count = parseInt(parts[1]);
  const replyMsg = await msg.getReplyMessage();
  if (!replyMsg) {
    await pian.sendMessage(msg.chatId, { message: withFooter("⚠️ Tidak ada pesan!"), replyTo: msg.isChannel ? undefined : msg.id });
    return;
  }
  for (let i = 0; i < count; i++) {
    try {
      if (replyMsg.media) {
        await pian.forwardMessages(msg.chatId, { messages: replyMsg.id, fromPeer: msg.chatId });
      } else if (replyMsg.message) {
        await pian.sendMessage(msg.chatId, { message: withFooter(replyMsg.message) });
      }
    } catch {}
  }
  await pian.sendMessage(msg.chatId, {
    message: withFooter(`✅ Spam selesai! ${count}x terkirim.`),
    replyTo: msg.isChannel ? undefined : msg.id,
  });
  return;
}

const tagallChats = new Set();

const emojiCategories = {
  smileys: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😍","🥰","😘","😎","🥳","😇","🙃","😋","😛","🤪"],
  animals: ["🐶","🐱","🐰","🐻","🐼","🦁","🐸","🦊","🦔","🦄","🐢","🐠","🐦","🦜","🦢","🦚","🦓","🐅","🦔"],
  food: ["🍎","🍕","🍔","🍟","🍩","🍦","🍓","🥪","🍣","🍔","🍕","🍝","🍤","🥗","🥐","🍪","🍰","🍫","🥤"],
  nature: ["🌲","🌺","🌞","🌈","🌊","🌍","🍁","🌻","🌸","🌴","🌵","🍃","🍂","🌼","🌱","🌾","🍄","🌿","🌳"],
  travel: ["✈️","🚀","🚲","🚗","⛵","🏔️","🚁","🚂","🏍️","🚢","🚆","🛴","🛸","🛶","🚟","🚈","🛵","🛎️","🚔"],
  sports: ["⚽","🏀","🎾","🏈","🎱","🏓","🥊","⛳","🏋️","🏄","🤸","🏹","🥋","🛹","🥏","🎯","🥇","🏆","🥅"],
  music: ["🎵","🎶","🎤","🎧","🎼","🎸","🥁","🎷","🎺","🎻","🪕","🎹","🔊"],
  celebration: ["🎉","🎊","🥳","🎈","🎁","🍰","🧁","🥂","🍾","🎆","🎇"],
  work: ["💼","👔","👓","📚","✏️","📆","🖥️","🖊️","📂","📌","📎"],
  emotions: ["❤️","💔","😢","😭","😠","😡","😊","😃","🙄","😳","😇","😍"],
};

function randomEmoji() {
  const cats = Object.keys(emojiCategories);
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const arr = emojiCategories[cat];
  return arr[Math.floor(Math.random() * arr.length)];
}

if (msg.senderId.toString() === myId && text.startsWith(".tagall")) {
    if (!msg.isGroup) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("⚠️ Hanya bisa digunakan di grup!"),
            replyTo: msg.id
        });
        return;
    }

    const args = text.split(" ");
    const jumlah = parseInt(args[1]);

    if (isNaN(jumlah) || jumlah < 1) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("⚠️ Gunakan format:\n.tagall 5"),
            replyTo: msg.id
        });
        return;
    }
    if (tagallChats.has(msg.chatId.toString())) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("⚠️ Tagall sedang berjalan di grup ini."),
            replyTo: msg.id
        });
        return;
    }
    tagallChats.add(msg.chatId.toString());
    try {
        const participants = await pian.getParticipants(msg.chatId);
        const userIds = participants
            .filter(u => !u.deleted && !u.bot)
            .map(u => u.id);
        const hiddenTags = userIds
            .map(id => `<a href="tg://user?id=${id}">\u2063</a>`)
            .join("");
        const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😍","🥰","😘","😎","🥳","😇","🙃","😋","😛","🤪","🐶","🐱","🐰","🐻","🐼","🦁","🐸","🦊","🦔","🦄","🐢","🐠","🐦","🦜","🦢","🦚","🦓","🐅","🦔","🍎","🍕","🍔","🍟","🍩","🍦","🍓","🥪","🍣","🍔","🍕","🍝","🍤","🥗","🥐","🍪","🍰","🍫","🥤"];
        const randomEmojiRow = () => {
            let row = "";
            for (let i = 0; i < 4; i++) {
                row += emojis[Math.floor(Math.random() * emojis.length)];
            }
            return row;
        };
        let counter = 0;
        (async function sendSpam() {
            if (!tagallChats.has(msg.chatId.toString())) return;
            if (counter >= jumlah) {
                tagallChats.delete(msg.chatId.toString());
                return;
            }
            const emojiRow = randomEmojiRow();
            await pian.sendMessage(msg.chatId, {
                message: withFooter(`${emojiRow}\n${hiddenTags}`),
                parseMode: "html",
            });
            counter++;
            setTimeout(sendSpam, 1300);
        })();
    } catch (err) {
        console.error("Tagall Error:", err);
        tagallChats.delete(msg.chatId.toString());
        await pian.sendMessage(msg.chatId, {
            message: withFooter("❌ Gagal menjalankan tagall."),
            replyTo: msg.id
        });
    }

    return;
}

if (msg.senderId.toString() === myId && text === ".batal") {
  if (!msg.isGroup) {
    await pian.sendMessage(msg.chatId, { 
      message: withFooter("⚠️ Hanya bisa digunakan di grup!"), 
      replyTo: msg.id 
    });
    return;
  }

  if (!tagallChats.has(msg.chatId.toString())) {
    await pian.sendMessage(msg.chatId, { 
      message: withFooter("❌ Tidak ada perintah tagall yang berjalan."), 
      replyTo: msg.id 
    });
    return;
  }

  tagallChats.delete(msg.chatId.toString());
  await pian.sendMessage(msg.chatId, { 
    message: withFooter("✅ Tagall berhasil dibatalkan."), 
    replyTo: msg.id 
  });
  return;
}


if (msg.senderId.toString() === myId && text.startsWith(".tagspam")) {
    if (!msg.isGroup) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("⚠️ Hanya bisa digunakan di grup!"),
            replyTo: msg.id
        });
        return;
    }

    const customText = text.split(" ").slice(1).join(" ");
    if (!customText) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("⚠️ Masukkan teks untuk tagspam!\n\nContoh:\n.tagspam Ada yang bisa bantu?"),
            replyTo: msg.id
        });
        return;
    }
    try {
        const participants = await pian.getParticipants(msg.chatId);
        const users = participants
            .filter(u => !u.deleted && !u.bot)
            .map(u => u.id);
        const hiddenTags = users
            .map(id => `<a href="tg://user?id=${id}">\u2063</a>`)
            .join("");

        await pian.sendMessage(msg.chatId, {
            message: withFooter(`${customText}\n${hiddenTags}`),
            parseMode: "html",
            replyTo: msg.id,
        });

    } catch (err) {
        console.error("TagSpam Error:", err);
        await pian.sendMessage(msg.chatId, {
            message: withFooter("❌ Gagal melakukan tagspam. Pastikan bot memiliki izin."),
            replyTo: msg.id,
        });
    }
    return;
}

/* if (msg.senderId.toString() === myId && text.startsWith(".tiktok")) {

  const args = text.split(" ").slice(1).join(" ");
  if (!args || !args.includes("tiktok.com")) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan URL TikTok yang valid.\nContoh: .tiktok https://vt.tiktok.com/xxxx</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mengambil video dari TikTok...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {

    const { data } = await axios.get("https://api.vreden.my.id/api/v1/download/tiktok", {
      params: { url: args }
    });

    if (!data.status || !data.result) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Gagal mengambil data TikTok.</blockquote>"),
        parseMode: "html",
      });
      return;
    }
    const result = data.result;
    const videoNowm = result.data?.find(x => x.type === "nowatermark")?.url;
    const videoHD = result.data?.find(x => x.type === "nowatermark_hd")?.url;

    if (!videoNowm) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Video tidak ditemukan.</blockquote>"),
        parseMode: "html",
      });
      return;
    }
    await pian.sendFile(msg.chatId, {
      file: videoHD || videoNowm,
      caption: withFooter(`<blockquote>
🎥 TikTok Downloader

<b>Judul:</b> ${result.title}
<b>Durasi:</b> ${result.duration}
<b>Views:</b> ${result.stats.views}
</blockquote>`),
      parseMode: "html",
      replyTo: msg.id,
    });
    if (result.music_info?.url) {
      await pian.sendFile(msg.chatId, {
        file: result.music_info.url,
        caption: withFooter(`<blockquote>🎵 Audio TikTok</blockquote>`),
        parseMode: "html",
        replyTo: msg.id,
      });
    }

    await waitMsg.delete();

  } catch (err) {
    console.error("TikTok Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mengunduh video TikTok.</blockquote>"),
      parseMode: "html",
    });
  }

  return;
} */

if (msg.senderId.toString() === myId && text.startsWith(".tiktok")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url) return msg.reply({ message: "❌ isi link" });

  const res = await axios.get(
    "https://restapi-v2.simplebot.my.id/download/tiktok-v2",
    { params: { url } }
  );

  const data = res?.data?.result?.data;
  if (!data) {
    console.log("DEBUG API:", res.data);
    return msg.reply({ message: "❌ data kosong" });
  }

  // SIMPAN DATA PER CHAT
  tiktokCache.set(msg.chatId.toString(), data);

  return msg.reply({
    message:
`🎵 TikTok ditemukan

Pilih format:
• .tt4 → Video
• .tt3 → Audio (MP3)`
  });
}

if (msg.senderId.toString() === myId && text.startsWith(".tt4")) {
    if (msg.senderId.toString() !== myId) return;
  const data = tiktokCache.get(msg.chatId.toString());
  if (!data) return msg.reply({ message: "❌ belum ada data tiktok" });

  const videoUrl = data.hdplay;
  if (!videoUrl) return msg.reply({ message: "❌ gagal ambil video" });

  await pian.sendFile(msg.chatId, {
    file: videoUrl,
    caption: "🎵 TikTok Video",
    supportsStreaming: true
  });

  tiktokCache.delete(msg.chatId.toString());
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error("Download failed"));
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => reject(err));
  });
}

// Helper: convert video ke MP3
async function convertToMp3(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .save(audioPath)
      .on("end", resolve)
      .on("error", reject);
  });
}

if (msg.senderId.toString() === myId && text.startsWith(".tt3")) {
  const data = tiktokCache.get(msg.chatId.toString());
  if (!data) return msg.reply({ message: "❌ belum ada data tiktok" });

  const videoUrl = data.hdplay || data.play;
  if (!videoUrl) return msg.reply({ message: "❌ gagal ambil video" });

  const videoPath = `./tmp/${msg.chatId}_tt.mp4`;
  const audioPath = `./tmp/${msg.chatId}_tt.mp3`;

  try {
    // pastikan folder tmp ada
    if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");

    // download video
    await downloadFile(videoUrl, videoPath);

    // convert ke mp3
    await convertToMp3(videoPath, audioPath);

    // kirim audio
    await pian.sendFile(msg.chatId, {
      file: audioPath,
      caption: "🎵 TikTok Audio (MP3)"
    });

    // bersihin file & cache
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);
    tiktokCache.delete(msg.chatId.toString());

  } catch (err) {
    console.error(err);
    msg.reply({ message: "❌ gagal convert MP3" });
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".terabox")) {
  const args = text.split(" ").slice(1);
  const url = args[0];
  if (!url) return msg.reply({ message: "❌ isi link Terabox" });

  try {
    // Ambil data Terabox dari API
    const res = await axios.get("https://api.deline.web.id/downloader/terabox", {
      params: { url }
    });

    const data = res.data;
    if (!data || !data.status || !data.result?.Files) {
      return msg.reply({ message: "❌ gagal ambil data Terabox" });
    }

    const files = data.result.Files;
    if (!files.length) return msg.reply({ message: "❌ tidak ada file di Terabox" });

    // Simpan cache per chat
    teraboxCache.set(msg.chatId.toString(), files);

    // Buat daftar file untuk user pilih
    let listMessage = "📂 Terabox Files:\n";
    files.forEach((f, i) => {
      listMessage += `${i + 1}. ${f.Name} (${f.Size})\n`;
    });
    listMessage += "\nKirim nomor file yang ingin di-download (misal: 1,2) atau 'all' untuk semua file.";

    return msg.reply({ message: listMessage });

  } catch (err) {
    console.error("Error Terabox:", err);
    return msg.reply({ message: "❌ gagal ambil data Terabox" });
  }
}

if (/^\d+(?:,\d+)*$|^all$/i.test(text)) {
  const files = teraboxCache.get(msg.chatId.toString());
  if (!files) return; // Tidak ada cache, abaikan

  let selectedFiles = [];
  if (text.toLowerCase() === "all") {
    selectedFiles = files;
  } else {
    const indexes = text.split(",").map(n => parseInt(n.trim()) - 1).filter(i => i >= 0 && i < files.length);
    selectedFiles = indexes.map(i => files[i]);
  }

  if (!selectedFiles.length) return msg.reply({ message: "❌ tidak ada file yang dipilih" });

  for (const file of selectedFiles) {
    const tempFile = `temp_${file.Name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    try {
      await msg.reply({ message: `⏳ Sedang mendownload: ${file.Name}` });

      // Download file
      const response = await axios({
        url: file.Direct_Download_Link,
        method: 'GET',
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const writer = fs.createWriteStream(tempFile);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Kirim file ke Telegram
      await pian.sendFile(msg.chatId, {
        file: tempFile,
        caption: `📂 Terabox\n• Nama file: ${file.Name}\n• Ukuran: ${file.Size}`,
        forceDocument: true
      });

      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

    } catch (err) {
      console.error("Error download file Terabox:", err);
      await msg.reply({ message: `❌ gagal download file: ${file.Name}` });
    }
  }

  // Hapus cache setelah selesai
  teraboxCache.delete(msg.chatId.toString());
}

if (msg.senderId.toString() === myId && text.startsWith(".gdrive")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url) return msg.reply({ message: "❌ isi link Google Drive" });

  try {
    const res = await axios.get("https://api.deline.web.id/downloader/gdrive", {
      params: { url }
    });

    const data = res.data;

    if (!data || !data.status || !data.result?.downloadUrl) {
      return msg.reply({ message: "❌ gagal ambil data Google Drive" });
    }

    const fileName = data.result.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const tempFile = `temp_${fileName}`;

    // Pesan sementara
    await msg.reply({ message: `⏳ Sedang mendownload file: ${data.result.fileName}` });

    // Download file pakai axios + stream
    const response = await axios({
      url: data.result.downloadUrl,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Kirim file ke Telegram
    await pian.sendFile(msg.chatId, {
      file: tempFile,
      caption: `📁 Google Drive\n• Nama file: ${data.result.fileName}\n• Ukuran: ${data.result.fileSize}`,
      forceDocument: true
    });

    // Hapus file sementara
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

  } catch (err) {
    console.error("Error Google Drive:", err);
    return msg.reply({ message: "❌ gagal download file Google Drive" });
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".videy")) {
  const input = text.split(" ").slice(1).join("").trim();

  if (!input.includes("videy.co")) {
    return pian.sendMessage(msg.chatId, { message: "❌ Link Videy tidak valid" });
  }

  let id = "";
  if (input.includes("id=")) {
    id = input.split("id=")[1];
  } else {
    return pian.sendMessage(msg.chatId, { message: "❌ ID tidak ditemukan" });
  }

  const finalURL = `https://cdn.videy.co/${id}.mp4`;

  try {
    // ambil entity dulu
    await msg.reply({ message: `${finalURL}` });
  } catch (err) {
    console.error(err);
    await pian.sendMessage(msg.chatId, { message: "❌ Gagal kirim link video!" });
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".twitter")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url) return msg.reply({ message: "❌ isi link Twitter/X" });

  try {
    const res = await axios.get("https://api.deline.web.id/downloader/twitter", {
      params: { url }
    });

    const data = res.data?.data;
    if (!data || !data.downloadLink) {
      return msg.reply({ message: "❌ gagal ambil data Twitter/X" });
    }

    const fileName = data.downloadLink.split("fileName=")[1]?.split("&")[0] || "twitter_video.mp4";
    const tempFile = `temp_${fileName}`;

    await msg.reply({ message: `⏳ Sedang mendownload: ${data.videoTitle || "Video Twitter/X"}` });

    // Download file pakai axios + stream
    const response = await axios({
      url: data.downloadLink,
      method: 'GET',
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Kirim file ke Telegram
    await pian.sendFile(msg.chatId, {
      file: tempFile,
      caption: `🐦 Twitter/X\n• Judul: ${data.videoTitle}\n• Deskripsi: ${data.videoDescription}`,
      forceDocument: false,
      supportsStreaming: true
    });

    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

  } catch (err) {
    console.error("Error Twitter/X:", err);
    return msg.reply({ message: "❌ gagal download Twitter/X" });
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".spotify")) {
  let url = text.split(" ").slice(1).join(" ");
  if (!url) return msg.reply({ message: "❌ isi link Spotify" });

  // Hapus parameter query (?si=...)
  url = url.split("?")[0];

  try {
    const res = await axios.get("https://api.deline.web.id/downloader/spotify", {
      params: { url }
    });

    const data = res.data;

    if (!data || !data.status) {
      return msg.reply({ message: "❌ gagal ambil data Spotify" });
    }

    const track = data.result;

    // Cek apakah ada media yang bisa didownload
    if (!track?.medias?.[0]?.url) {
      return msg.reply({ message: "❌ Track ini tidak tersedia untuk didownload" });
    }

    const media = track.medias[0];
    const fileName = `${track.title.replace(/[^a-zA-Z0-9.-]/g, "_")}.mp3`;
    const tempFile = `temp_${fileName}`;

    // Pesan sementara
    await msg.reply({ message: `⏳ Sedang mendownload: ${track.title} - ${track.author}` });

    // Download MP3
    const response = await axios({
      url: media.url,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Kirim file ke Telegram
    await pian.sendFile(msg.chatId, {
      file: tempFile,
      caption: `🎵 Spotify\n• Judul: ${track.title}\n• Artis: ${track.author}\n• Durasi: ${track.duration}`,
      forceDocument: false,
      attributes: [
        new Api.DocumentAttributeAudio({
          duration: parseInt(track.time_end) || 0,
          title: track.title,
          performer: track.author,
        }),
      ],
    });

    // Hapus file sementara
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

  } catch (err) {
    console.error("Error Spotify:", err);
    return msg.reply({ message: "❌ gagal download Spotify" });
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".mediafire")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url) return msg.reply({ message: "❌ isi link MediaFire" });

  try {
    const res = await axios.get("https://api.deline.web.id/downloader/mediafire", {
      params: { url }
    });

    const data = res.data;
    if (!data || !data.status || !data.result?.downloadUrl) {
      return msg.reply({ message: "❌ gagal ambil data MediaFire" });
    }

    const fileName = data.result.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const tempFile = `temp_${fileName}`;

    await msg.reply({ message: `⏳ Sedang mendownload file: ${data.result.fileName}` });

    // Download file pakai axios + stream (ikut redirect)
    const response = await axios({
      url: data.result.downloadUrl,
      method: 'GET',
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const writer = fs.createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Kirim file ke Telegram
    await pian.sendFile(msg.chatId, {
      file: tempFile,
      caption: `📦 MediaFire\n• Nama file: ${data.result.fileName}`,
      forceDocument: true
    });

    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

  } catch (err) {
    console.error("Error MediaFire:", err);
    return msg.reply({ message: "❌ gagal download file MediaFire" });
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".instagram")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url) return msg.reply({ message: "❌ isi link" });

  try {
    const res = await axios.get("https://api.deline.web.id/downloader/ig", {
      params: { url }
    });

    const data = res.data;
    if (!data || !data.status || !data.result?.media?.videos?.length) {
      console.log("DEBUG API:", res.data);
      return msg.reply({ message: "❌ gagal ambil data Instagram" });
    }

    // Simpan cache per chat
    instagramcache.set(msg.chatId.toString(), data);

    return msg.reply({
      message:
`🎵 Instagram ditemukan

Pilih format:
• .ig4 → Video
• .ig3 → Audio`
    });
  } catch (err) {
    console.error(err);
    return msg.reply({ message: "❌ gagal mengambil data Instagram" });
  }
}

//════════════════════════════════════════
// Kirim Video Instagram (.ig4)
if (msg.senderId.toString() === myId && text.startsWith(".ig4")) {
  const data = instagramcache.get(msg.chatId.toString());
  if (!data || !data.result?.media?.videos?.length) 
    return msg.reply({ message: "❌ belum ada video Instagram" });

  const videoUrl = data.result.media.videos[0];
  if (!videoUrl) return msg.reply({ message: "❌ gagal ambil video" });

  try {
    await pian.sendFile(msg.chatId, {
      file: videoUrl,
      caption: "🎵 Instagram Video",
      supportsStreaming: true
    });
  } catch (err) {
    console.error("Send video error:", err);
    return msg.reply({ message: "❌ gagal kirim video" });
  } finally {
    instagramcache.delete(msg.chatId.toString());
  }
}

//════════════════════════════════════════
// Kirim Audio MP3 dari Video Instagram (.ig3)
if (msg.senderId.toString() === myId && text.startsWith(".ig3")) {
  const data = instagramcache.get(msg.chatId.toString());
  if (!data || !data.result?.media?.videos?.length) 
    return msg.reply({ message: "❌ belum ada video Instagram" });

  const videoUrl = data.result.media.videos[0];
  if (!videoUrl) return msg.reply({ message: "❌ gagal ambil video/audio" });

  const tempVideo = `temp_${msg.chatId}.mp4`;
  const tempAudio = `temp_${msg.chatId}.mp3`;

  try {
    // Download video
    await downloadFile(videoUrl, tempVideo);

    // Convert ke MP3
    await convertToMp3(tempVideo, tempAudio);

    // Kirim audio
    await pian.sendFile(msg.chatId, {
      file: tempAudio,
      caption: "🎧 Instagram Audio",
      forceDocument: false
    });

  } catch (err) {
    console.error("Error IG3:", err);
    return msg.reply({ message: "❌ gagal ambil atau convert audio" });
  } finally {
    // Hapus file sementara & cache
    if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
    if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
    instagramcache.delete(msg.chatId.toString());
  }
}

if (msg.senderId.toString() === myId && text.startsWith(".play")) {
  const query = text.split(" ").slice(1).join(" ");
  
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan judul lagu.\nContoh: .play Happy Nation</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mencari dan memproses audio...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get(
      "https://api.vreden.my.id/api/v1/download/play/audio",
      { params: { query } }
    );

    if (!data.status || !data.result || !data.result.download?.url) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan atau gagal mengambil audio.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const meta = data.result.metadata;
    const music = data.result.download;

    const caption =
      `<b>🎶 PLAY MUSIC</b>\n\n` +
      `• <b>Judul:</b> ${meta.title}\n` +
      `• <b>Channel:</b> ${meta.author?.name || "-"}\n` +
      `• <b>Durasi:</b> ${meta.duration?.timestamp || meta.timestamp}\n` +
      `• <b>Kualitas:</b> ${music.quality}\n` +
      `• <b>Views:</b> ${meta.views.toLocaleString("id-ID")}\n` +
      `• <b>Youtube:</b> <a href="${meta.url}">Klik</a>\n\n` +
      `<i>Audio sedang dikirim...</i>`;
    await pian.sendFile(msg.chatId, {
      file: meta.thumbnail,
      caption: withFooter(caption),
      parseMode: "html",
    });
    await pian.sendFile(msg.chatId, {
      file: music.url,
      caption: withFooter(`<blockquote>🎧 Audio Siap Diputar</blockquote>`),
      mimetype: "audio/mpeg",
      parseMode: "html",
      replyTo: msg.id,
    });

    await waitMsg.delete();

  } catch (err) {
    console.error("PLAY Error:", err);

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat memproses audio.</blockquote>"),
      parseMode: "html",
    });
  }

  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".done")) {
  const sent = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>memproses...</blockquote>"),
    replyTo: msg.isChannel ? undefined : msg.id,
    parseMode: "html",
  });

  setTimeout(async () => {
    try {
      const args = text.split(" ").slice(1).join(" ");
      if (!args || !args.includes(",")) {
        await pian.editMessage(sent.chatId, {
          message: sent.id,
          text: withFooter("<blockquote>Penggunaan: .done item,price,payment</blockquote>"),
          parseMode: "html",
        });
        return;
      }

      const parts = args.split(",", 3);
      const name_item = (parts[0] || "").trim();
      const price = (parts[1] || "").trim();
      const payment = (parts[2] || "Lainnya").trim();

      const time = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

const response = `
<blockquote><b>✨  𝗧𝗥𝗔𝗡𝗦𝗔𝗞𝗦𝗜 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟  ✨</b></blockquote>

<blockquote>
<b>📦  Barang :</b> <code>${name_item}</code>
<b>💸  Nominal :</b> <code>${price}</code>
<b>💳  Payment :</b> <code>${payment}</code>
<b>🕰️  Waktu :</b> <code>${time}</code>
</blockquote>

<blockquote><i>Terima kasih telah bertransaksi</i></blockquote>
`;

      await pian.editMessage(sent.chatId, {
        message: sent.id,
        text: withFooter(response),
        parseMode: "html",
      });
    } catch (err) {
      await pian.editMessage(sent.chatId, {
        message: sent.id,
        text: withFooter("❌ error: " + err.message),
      });
    }
  }, 5000);
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".addpay")) {
  const args = text.split(" ").slice(1).join(" ").trim();
  if (!args || !args.includes(",")) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("⚠️ Format salah!\nGunakan: .addpay <nama>,<nomor>,<atasnama>"),
      replyTo: msg.id,
    });
    return;
  }

  const [nama, nomor, atasnama] = args.split(",").map((x) => x.trim());
  if (!nama || !nomor || !atasnama) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("❌ Semua field harus diisi."),
      replyTo: msg.id,
    });
    return;
  }

  if (payMethods.some((p) => p.nama.toLowerCase() === nama.toLowerCase())) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(`❌ Metode pembayaran ${nama} sudah ada.`),
      replyTo: msg.id,
    });
    return;
  }

  payMethods.push({ nama, nomor, atasnama });
  savePayMethods();

  await pian.sendMessage(msg.chatId, {
    message: withFooter(`✅ Metode pembayaran ${nama} berhasil ditambahkan.`),
    replyTo: msg.id,
  });
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".delpay")) {
  const nama = text.split(" ")[1];
  if (!nama) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("⚠️ Format salah!\nGunakan: .delpay <nama>"),
      replyTo: msg.id,
    });
    return;
  }

  const index = payMethods.findIndex(
    (p) => p.nama.toLowerCase() === nama.toLowerCase()
  );
  if (index === -1) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(`❌ Metode ${nama} tidak ditemukan.`),
      replyTo: msg.id,
    });
    return;
  }

  payMethods.splice(index, 1);
  savePayMethods();

  await pian.sendMessage(msg.chatId, {
    message: withFooter(`✅ Metode ${nama} berhasil dihapus.`),
    replyTo: msg.id,
  });
  return;
}

if (msg.senderId.toString() === myId && text === ".pay") {
  try {
    const qrisPath = "qris.jpg";
    let listPay = "";

    if (payMethods.length === 0) {
      listPay =
        "<blockquote>❌ Belum ada metode pembayaran ditambahkan.</blockquote>";
    } else {
      listPay = payMethods
        .map(
          (p) =>
            `<blockquote>💳 ${p.nama} : <code>${p.nomor}</code>\n👤 ${p.atasnama}</blockquote>`
        )
        .join("\n\n");
    }

    const caption = withFooter(
      `<blockquote>📌 DETAIL PEMBAYARAN</blockquote>\n\n` +
        listPay +
        `\n\n<blockquote>⚠️ NOTE : JANGAN LUPA MEMBAWA BUKTI TF AGAR DI PROSES ‼️</blockquote>`
    );

    if (fs.existsSync(qrisPath)) {
      await pian.sendFile(msg.chatId, {
        file: qrisPath,
        caption: caption,
        replyTo: msg.isChannel ? undefined : msg.id,
        parseMode: "html",
      });
    } else {
        await pian.sendMessage(msg.chatId, {
            message: caption,
            replyTo: msg.isChannel ? undefined : msg.id,
            parseMode: "html",
        });
    }

  } catch (err) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(
        "❌ Gagal mengirim QRIS. Pastikan file `qris.jpg` ada di folder bot atau gunakan .addqr."
      ),
      replyTo: msg.isChannel ? undefined : msg.id,
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text === ".addqr") {
  if (!msg.isReply) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("⚠️ Harus reply foto QRIS."),
      replyTo: msg.id,
    });
    return;
  }

  try {
    const replyMsg = await msg.getReplyMessage();
    
    // Periksa apakah ada media dan itu foto
    if (!replyMsg || !replyMsg.media || !replyMsg.photo) {
      await pian.sendMessage(msg.chatId, {
        message: withFooter("❌ Reply harus berupa gambar/foto QRIS."),
        replyTo: msg.id,
      });
      return;
    }

    const filePath = "qris.jpg";

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const buffer = await pian.downloadMedia(replyMsg.media, {});
    fs.writeFileSync(filePath, buffer);

    await pian.sendMessage(msg.chatId, {
      message: withFooter("✅ Foto QRIS berhasil diganti! Sekarang akan tampil di fitur .pay"),
      replyTo: msg.id,
    });
  } catch (err) {
    console.error("AddQR Error:", err);
    await pian.sendMessage(msg.chatId, {
      message: withFooter("❌ Gagal menyimpan QRIS."),
      replyTo: msg.id,
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".afk")) {
  const alasan = text.split(" ").slice(1).join(" ") || "Sedang AFK";
  isAfk = true;
  afkReason = alasan;
  afkTime = Date.now();

  await pian.sendMessage(msg.chatId, {
    message: withFooter(
      `<blockquote>😴 AFK diaktifkan</blockquote>\n` +
      `<blockquote>📌 Alasan: ${alasan}</blockquote>`
    ),
    replyTo: msg.id,
    parseMode: "html",
  });
  return;
}

if (msg.senderId.toString() === myId && text === ".unafk") {
  if (!isAfk) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Kamu tidak sedang AFK</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  isAfk = false;
  afkReason = "";
  afkTime = 0;

  await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>✅ AFK dinonaktifkan</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });
  return;
}

if (isAfk && msg.senderId.toString() !== myId) {
  const waktuAfk = Math.floor((Date.now() - afkTime) / 1000);
  let durasi = "";
  if (waktuAfk >= 3600) {
    const jam = Math.floor(waktuAfk / 3600);
    const menit = Math.floor((waktuAfk % 3600) / 60);
    durasi = `${jam} jam ${menit} menit`;
  } else if (waktuAfk >= 60) {
    const menit = Math.floor(waktuAfk / 60);
    const detik = waktuAfk % 60; 
    durasi = `${menit} menit ${detik} detik`; // Perbaikan: double 'menit' di kode asli
  } else {
    durasi = `${waktuAfk} detik`;
  }

  if (msg.isPrivate) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(
        `<blockquote>😴 Aku sedang AFK</blockquote>\n` +
        `<blockquote>📌 Alasan: ${afkReason}</blockquote>\n` +
        `<blockquote>⏱️ Durasi: ${durasi}</blockquote>`
      ),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  if (msg.isGroup && msg.replyTo) {
    const replyMsg = await msg.getReplyMessage();
    if (replyMsg && replyMsg.senderId.toString() === myId) {
      await pian.sendMessage(msg.chatId, {
        message: withFooter(
          `<blockquote>😴 Aku sedang AFK</blockquote>\n` +
          `<blockquote>📌 Alasan: ${afkReason}</blockquote>\n` +
          `<blockquote>⏱️ Durasi: ${durasi}</blockquote>`
        ),
        replyTo: msg.id,
        parseMode: "html",
      });
      return;
    }
  }
}

if (msg.senderId.toString() === myId && text === ".save") {
  if (!msg.isReply) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"),
      replyTo: msg.id,
    });
    return;
  }

  const replyMsg = await msg.getReplyMessage();
  await pian.forwardMessages("me", {
    messages: replyMsg.id,
    fromPeer: msg.chatId,
  });

  await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>✅ Pesan berhasil disimpan ke Saved Messages</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });
  return;
}

if (msg.senderId.toString() === myId && text === ".tourl") {
  if (!msg.isReply) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Harus reply foto/video!</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  try {
    const replyMsg = await msg.getReplyMessage();
    if (!replyMsg.media) {
      await pian.sendMessage(msg.chatId, {
        message: withFooter("<blockquote>❌ Harus reply foto atau video!</blockquote>"),
        replyTo: msg.id,
        parseMode: "html",
      });
      return;
    }

    const waitMsg = await pian.sendMessage(msg.chatId, {
        message: withFooter("<blockquote>⏳ Sedang mengunggah media ke Catbox.moe...</blockquote>"),
        replyTo: msg.id,
        parseMode: "html",
    });

    const buffer = await pian.downloadMedia(replyMsg.media, {});

    let filename = "file.bin";
    if (replyMsg.photo) filename = "file.jpg";
    else if (replyMsg.video) filename = "file.mp4";

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename });

    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    if (typeof data === "string" && data.startsWith("https://")) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>🔗 URL: ${data}</blockquote>`),
        parseMode: "html",
      });
    } else {
      throw new Error("Upload gagal, respons tidak valid dari Catbox.");
    }
  } catch (err) {
    console.error("Tourl Error:", err);
    await pian.sendMessage(msg.chatId, {
      message: withFooter(`<blockquote>❌ Gagal upload media.\nAlasan: ${err.message}</blockquote>`),
      replyTo: msg.id,
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text === ".jamet") {
  const jametReply = [
    "Hallo Sayang 🥰",
    "Lagi apa nichh 💕",
    "Kangen aku yaaa 😳",
    "Bobo yuk sama akuu 🤭",
    "Aku jamet bang ☝️😭",
  ];
  const randomReply = jametReply[Math.floor(Math.random() * jametReply.length)];

  await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>${randomReply}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });
  return;
}

if (text === ".bot") {
  if (msg.senderId.toString() !== myId) return;
  await pian.sendMessage(msg.chatId, {
    message:
      "╔╗╔╦══╦═╦═╦══╦═╦══╗\n" +
      "║║║║══╣╦╣╬║╔╗║║╠╗╔╝\n" +
      "║╚╝╠══║╩╣╗╣╔╗║║║║║\n" +
      "╚══╩══╩═╩╩╩══╩═╝╚╝\n",
    replyTo: msg.id,
  });
  return;
}

if (text === ".tank") {
  if (msg.senderId.toString() !== myId) return;
  await pian.sendMessage(msg.chatId, {
    message:
      "█۞███████]▄▄▄▄▄▄▄▄▄▄▃ \n" +
      "▂▄▅█████████▅▄▃▂\n" +
      "[███████████████████]\n" +
      "◥⊙▲⊙▲⊙▲⊙▲⊙▲⊙▲⊙◤\n",
    replyTo: msg.id,
  });
  return;
}

if (text === ".zombies") {
    if (msg.senderId.toString() !== myId) return;

    if (!msg.isGroup) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Fitur .zombies hanya bisa digunakan di grup!</blockquote>"),
            replyTo: msg.id,
            parseMode: "html"
        });
        return;
    }

    const processingMsg = await pian.sendMessage(msg.chatId, {
        message: withFooter("<blockquote>⏳ Sedang memeriksa anggota zombie...</blockquote>"),
        replyTo: msg.id,
        parseMode: "html"
    });

    try {
        const participants = await pian.getParticipants(msg.chatId);
        let removedCount = 0;
        let failedCount = 0;

        for (const user of participants) {
            if (!user.username && !user.firstName && user.bot === false && user.id.toString() !== myId) {
                try {
                    await pian.kickParticipant(msg.chatId, user.id);
                    removedCount++;
                } catch {
                    failedCount++;
                }
            }
        }
        
        await pian.deleteMessages(msg.chatId, [processingMsg.id]);

        await pian.sendMessage(msg.chatId, {
            message: withFooter(`<blockquote>✅ Proses zombies selesai!
Removed : ${removedCount} anggota
Failed  : ${failedCount} anggota</blockquote>`),
            replyTo: msg.id,
            parseMode: "html"
        });

    } catch (err) {
        await pian.editMessage(processingMsg.chatId, {
            message: processingMsg.id,
            text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat memproses zombies. Pastikan akun userbot adalah admin!</blockquote>"),
            parseMode: "html"
        });
    }
}

if (text.startsWith(".kick")) {
    if (msg.senderId.toString() !== myId) return;

    if (!msg.isGroup) {
        return await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Fitur .kick hanya bisa digunakan di grup!</blockquote>"),
            replyTo: msg.id,
            parseMode: "html"
        });
    }

    let targetUserId;
    let targetEntity;

    if (msg.replyTo) {
        const replyMsg = await msg.getReplyMessage();
        if (replyMsg && replyMsg.senderId) {
             targetEntity = await pian.getEntity(replyMsg.senderId);
             targetUserId = targetEntity.id;
        }
    } else {
        const args = text.split(" ");
        if (args.length < 2) {
            return await pian.sendMessage(msg.chatId, {
                message: withFooter("<blockquote>⚠️ Harus reply pesan atau mention username!</blockquote>"),
                replyTo: msg.id,
                parseMode: "html"
            });
        }

        const username = args[1].replace("@", "");
        try {
            targetEntity = await pian.getEntity(username);
            targetUserId = targetEntity.id;
        } catch {
            return await pian.sendMessage(msg.chatId, {
                message: withFooter(`<blockquote>⚠️ Tidak dapat menemukan username @${username}!</blockquote>`),
                replyTo: msg.id,
                parseMode: "html"
            });
        }
    }
    
    if (!targetUserId) {
        return await pian.sendMessage(msg.chatId, {
            message: withFooter(`<blockquote>❌ Target tidak valid!</blockquote>`),
            replyTo: msg.id,
            parseMode: "html"
        });
    }
    
    if (targetUserId.toString() === myId) {
        return await pian.sendMessage(msg.chatId, {
            message: withFooter(`<blockquote>❌ Tidak bisa kick diri sendiri!</blockquote>`),
            replyTo: msg.id,
            parseMode: "html"
        });
    }

    try {
        await pian.invoke(
            new Api.channels.EditBanned({
                channel: msg.chatId,
                participant: targetUserId,
                bannedRights: new Api.ChatBannedRights({
                    untilDate: Math.floor(Date.now() / 1000) + 60, 
                    viewMessages: true
                })
            })
        );

        await pian.sendMessage(msg.chatId, {
            message: withFooter(`<blockquote>✅ Pengguna berhasil dikeluarkan dari grup!</blockquote>`),
            replyTo: msg.id,
            parseMode: "html"
        });

    } catch (err) {
        await pian.sendMessage(msg.chatId, {
            message: withFooter("<blockquote>⚠️ Gagal mengeluarkan pengguna. Pastikan userbot adalah admin dengan hak Ban!</blockquote>"),
            replyTo: msg.id,
            parseMode: "html"
        });

        console.log("Kick Error:", err);
    }
}

if (msg.senderId.toString() === myId && text.startsWith(".joingb")) {
  let argsText = text.split(" ").slice(1).join(" ").trim();
  if (!argsText) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Format salah!\nGunakan:\n.joingb @group1 @group2 ...\n.joingb link1,link2,link3</blockquote>"),
      replyTo: msg.id,
      parseMode: "html"
    });
    return;
  }

  let args = argsText.includes(",") 
    ? argsText.split(",").map(a => a.trim()).filter(Boolean)
    : argsText.split(" ").map(a => a.trim()).filter(Boolean);

  if (args.length === 0 || args.length > 4) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Maksimal 4 grup sekaligus!\nContoh:\n.joingb @group1 @group2\n.joingb https://t.me/+xxxx,https://t.me/+yyyy</blockquote>"),
      replyTo: msg.id,
      parseMode: "html"
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Sedang mencoba bergabung ke grup...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html"
  });

  let success = [];
  let failed = [];

  for (const link of args) {
    try {
      if (link.includes("t.me/") || link.includes("https://")) {
        const invite = link.split("/").pop().replace("+", "");
        await pian.invoke(new Api.messages.ImportChatInvite({ hash: invite }));
      } else {
        await pian.invoke(new Api.channels.JoinChannel({ channel: link.replace("@", "") }));
      }
      success.push(link);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("invite hash invalid")) {
        failed.push(`${link} (❌ Link undangan tidak valid / sudah expired)`);
      } else if (err.message && err.message.toLowerCase().includes("user already in channel")) {
        success.push(`${link} (Sudah bergabung)`);
      } else {
        failed.push(`${link} (❌ ${err.message})`);
      }
    }
  }
  
  await pian.deleteMessages(msg.chatId, [waitMsg.id]);

  const resultMessage =
    `<blockquote>「 HASIL JOIN GRUP 」</blockquote>\n\n` +
    (success.length > 0 ? `<blockquote>✅ Berhasil : ${success.join(", ")}</blockquote>\n` : "") +
    (failed.length > 0 ? `<blockquote>❌ Gagal : ${failed.join(", ")}</blockquote>` : "");

  await pian.sendMessage(msg.chatId, {
    message: withFooter(resultMessage),
    replyTo: msg.id,
    parseMode: "html"
  });
  return;
}

if (msg.senderId.toString() === myId && text === ".cleargb") {
  const dialogs = await pian.getDialogs();
  let successCount = 0;
  let failCount = 0;

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Sedang keluar dari semua grup...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html"
  });

  for (const dialog of dialogs) {
    if (dialog.isGroup) {
      try {
        await pian.deleteDialog(dialog.id, { revoke: true });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }
  }
  
  await pian.deleteMessages(msg.chatId, [waitMsg.id]);

  const resultMessage = 
    `<blockquote>「 DETAIL CLEAR GRUP 」</blockquote>\n\n` +
    `<blockquote>✅ BERHASIL : ${successCount} grup keluar</blockquote>\n` +
    `<blockquote>❌ GAGAL   : ${failCount} grup gagal keluar</blockquote>`;

  await pian.sendMessage(msg.chatId, {
    message: withFooter(resultMessage),
    replyTo: msg.id,
    parseMode: "html"
  });
  return;
}

if (msg.senderId.toString() === myId && text === ".ceklimitgb") {
  const dialogs = await pian.getDialogs();
  let keluarCount = 0;
  let blacklistCount = 0;
  let gagalCount = 0;
  let successCount = 0;

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Sedang mengecek limit di semua grup...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html"
  });

  for (const dialog of dialogs) {
    if (dialog.isGroup) {
      if (blacklist.includes(dialog.id.toString())) {
        blacklistCount++;
        continue;
      }

      try {
        const sent = await pian.sendMessage(dialog.id, { message: "🔎 Cek limit..." });
        await pian.deleteMessages(dialog.id, [sent.id]);
        successCount++;
      } catch (err) {
        try {
          await pian.deleteDialog(dialog.id, { revoke: true });
          keluarCount++;
        } catch {
          gagalCount++;
        }
      }
    }
  }
  
  await pian.deleteMessages(msg.chatId, [waitMsg.id]);

  const resultMessage = 
    `<blockquote>「 DETAIL CEK LIMIT GRUP 」</blockquote>\n\n` +
    `<blockquote>✅ AMAN : ${successCount} grup (Tidak ada batasan)</blockquote>\n` +
    `<blockquote>⚠️ KELUAR : ${keluarCount} grup (Terdeteksi limit)</blockquote>\n` +
    `<blockquote>⛔ BLACKLIST : ${blacklistCount} grup dilewati</blockquote>\n` +
    `<blockquote>❌ GAGAL : ${gagalCount} grup (Gagal keluar)</blockquote>`;

  await pian.sendMessage(msg.chatId, {
    message: withFooter(resultMessage),
    replyTo: msg.id,
    parseMode: "html"
  });
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".pushkontak")) {
  const parts = text.split(" ");
  if (!msg.isReply || parts.length < 2) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Format salah!\nGunakan: .pushkontak <jumlah/full>\n(Harus reply pesan teks)</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const mode = parts[1].toLowerCase().trim();
  let limit = Infinity;
  let isFull = false;

  if (mode === "full") {
    isFull = true;
  } else if (!isNaN(parseInt(mode))) {
    limit = parseInt(mode);
    if (limit <= 0) {
      await pian.sendMessage(msg.chatId, {
        message: withFooter("<blockquote>⚠️ Jumlah harus lebih dari 0.</blockquote>"),
        replyTo: msg.id,
        parseMode: "html",
      });
      return;
    }
  } else {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Mode tidak valid. Gunakan 'jumlah' angka atau 'full'.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const replyMsg = await msg.getReplyMessage();
  const messageToSend = replyMsg.message;
  const hasMedia = replyMsg.media;

  if (!messageToSend && !hasMedia) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Pesan yang di-reply tidak boleh kosong (teks/media).</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const processingMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>⏳ Sedang memproses pushkontak ke ${isFull ? 'semua' : limit} user...</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  const dialogs = await pian.getDialogs();
  let usersToPush = [];

  for (const dialog of dialogs) {
    
    if (
      dialog.isUser &&
      !dialog.isChannel &&
      !dialog.entity?.bot &&
      !blacklist.includes(dialog.id.toString())
    ) {
      usersToPush.push(dialog.id);
    }
    if (!isFull && usersToPush.length >= limit) {
      break;
    }
  }
  
  const finalUsers = isFull ? usersToPush : usersToPush.slice(0, limit);

  let successCount = 0;
  let failCount = 0;

  for (const userId of finalUsers) {
    try {
      if (hasMedia) {
          let file;
          if (replyMsg.photo) file = replyMsg.photo;
          else if (replyMsg.video) file = replyMsg.video;
          else if (replyMsg.document) file = replyMsg.document;
          else continue;

          await pian.sendFile(userId, { 
              file: file,
              caption: withFooter(messageToSend),
              parseMode: "html"
          });
      } else {
          await pian.sendMessage(userId, {
              message: withFooter(messageToSend),
          });
      }
      successCount++;
    } catch (err) {
      
      console.log(`❌ Gagal push kontak ke ${userId}: ${err.message}`);
      failCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const resultMessage =
    `<blockquote>✅ Push kontak selesai!</blockquote>` +
    `<blockquote>DETAIL PUSHKONTAK
TARGET  : ${finalUsers.length} user
SUCCESS : ${successCount} pesan terkirim
GAGAL   : ${failCount} pesan gagal terkirim</blockquote>`;

  await pian.editMessage(processingMsg.chatId, {
    message: processingMsg.id,
    text: withFooter(resultMessage),
    parseMode: "html",
  });
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".autocfd")) {

  const args = text.split(" ");
  let minutesInput = args[1]; 

  if (autoCfdState.running) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ AUTO CFD sudah berjalan.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  if (!minutesInput) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(`
<blockquote>
⚠️ Kamu belum menginput durasi (dalam menit)!

Contoh:
.autocfd 1     → 1 menit  
.autocfd 5     → 5 menit  
.autocfd 30    → 30 menit  
.autocfd 60    → 60 menit  
.autocfd 120   → 120 menit  
.autocfd 160   → 160 menit (maksimal)

⚠️ Gunakan interval wajar agar akun tidak limit.
</blockquote>
      `),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  minutesInput = Number(minutesInput);

  if (isNaN(minutesInput) || minutesInput < 1 || minutesInput > 160) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(`
<blockquote>
❌ Durasi tidak valid!

Masukkan angka antara:
1 menit  
sampai  
160 menit
</blockquote>
      `),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  if (!msg.replyTo) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>⚠️ Harus reply pesan!</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const replyMsg = await msg.getReplyMessage();
  if (!replyMsg) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Tidak ada pesan yang bisa diteruskan.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const durationMs = minutesInput * 60 * 1000;

  autoCfdState.running = true;
  autoCfdState.replyMsgId = replyMsg.id;
  autoCfdState.originChatId = msg.chatId;
  autoCfdState.duration = durationMs;

  await pian.sendMessage(msg.chatId, {
    message: withFooter(`
<blockquote>
✅ AUTO CFD aktif!

Interval: ${minutesInput} menit

Bot akan mengirim ulang pesan sesuai interval.
</blockquote>
    `),
    replyTo: msg.id,
    parseMode: "html",
  });

  runAutoCfd(pian, msg.chatId, replyMsg.id);

  autoCfdState.interval = setInterval(() => {
    if (autoCfdState.running) {
      runAutoCfd(pian, autoCfdState.originChatId, autoCfdState.replyMsgId);
    }
  }, durationMs);

  return;
}

if (msg.senderId.toString() === myId && text === ".stopcfd") {
  if (!autoCfdState.running && !autoCfdState.interval) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ AUTO CFD tidak sedang berjalan.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  if (autoCfdState.interval) {
    clearInterval(autoCfdState.interval);
  }
  
  autoCfdState.running = false;
  autoCfdState.interval = null;
  autoCfdState.replyMsgId = null;
  autoCfdState.originChatId = null;
  autoCfdState.duration = 0;

  await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>✅ AUTO CFD berhasil dihentikan.</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".info")) {
  let target;

  try {
    // reply
    if (msg.isReply) {
      const replyMsg = await msg.getReplyMessage();
      target = await pian.getEntity(replyMsg.senderId);
    }
    // username
    else if (text.split(" ")[1]) {
      const username = text.split(" ")[1].replace("@", "");
      target = await pian.getEntity(username);
    }
    // self
    else {
      target = await pian.getMe();
    }
  } catch {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ User tidak ditemukan.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const username = target.username ? `@${target.username}` : "Tidak ada";
  const userId = target.id.toString();
  const phone = target.phone 
  ? `+${target.phone}` 
  : "Private / Hidden";
  const status = target.bot ? "🤖 Bot" : "🌍 Public";

  const caption = `
👤 <b>User Information</b>

📜 <b>USER INFORMATION</b>

👤 <b>Username:</b> ${username}
🆔 <b>ID Telegram:</b> <code>${userId}</code>
📅 <b>Account Created:</b> Unknown
🌐 <b>Status:</b> ${status}
📞 <b>Phone:</b> ${phone}
  `.trim();

  try {

    if (global.thumbnail) {
      await pian.sendFile(msg.chatId, {
        file: global.thumbnail,
        caption: withFooter(caption),
        replyTo: msg.id,
        parseMode: "html",
      });
    } else {
      // fallback kalau ga ada foto
      await pian.sendMessage(msg.chatId, {
        message: withFooter(caption),
        replyTo: msg.id,
        parseMode: "html",
      });
    }
  } catch {
    await pian.sendMessage(msg.chatId, {
      message: withFooter(caption),
      replyTo: msg.id,
      parseMode: "html",
    });
  }

  return;
}



if (text === ".help") {
    if (msg.senderId.toString() !== myId) return;
      return msg.reply({
        message: `
wkwk kontol help help tai, tanya developer nya lah kocak
        `.trim()
      });
    }

if (msg.senderId.toString() === myId && text.startsWith(".capcut")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url || (!url.includes("capcut.com/templates") && !url.includes("capcut.com/tv2"))) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan URL CapCut yang valid.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mengambil data CapCut...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    let apiUrl;
    if (url.includes("/templates/")) apiUrl = "https://api.vreden.my.id/api/v1/download/capcut";
    else if (url.includes("/tv2/")) apiUrl = "https://api.deline.web.id/downloader/capcut";

    const { data } = await axios.get(apiUrl, { params: { url } });

    if (!data.status || !data.result || !data.result.medias || data.result.medias.length === 0) {
      await pian.editMessage(waitMsg.chatId, { message: waitMsg.id, text: withFooter("<blockquote>❌ Gagal mengambil data CapCut.</blockquote>"), parseMode: "html" });
      return;
    }

    const result = data.result;
    const video = result.medias.find(v => v.quality.includes("No Watermark")) || result.medias[0];

    await pian.sendFile(msg.chatId, {
      file: video.url,
      caption: withFooter(`<blockquote>🎬 CapCut Video

<b>Judul:</b> ${result.title || "Tidak ada"}
<b>Author:</b> ${result.author || "Tidak diketahui"}</blockquote>`),
      parseMode: "html",
      replyTo: msg.id,
      supportsStreaming: true
    });

    await waitMsg.delete();

  } catch (err) {
    console.error("CapCut Error:", err);
    await pian.editMessage(waitMsg.chatId, { message: waitMsg.id, text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mengunduh CapCut.</blockquote>"), parseMode: "html" });
  }
  return;
}

// --- PINTEREST DOWNLOADER (.pinterest) ---
if (msg.senderId.toString() === myId && text.startsWith(".pinterest")) {
  const url = text.split(" ").slice(1).join(" ");
  if (!url || !url.includes("pinterest.com")) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan URL Pinterest yang valid.\nContoh: .pinterest https://pinterest.com/pin/xxxxx</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mengambil media Pinterest...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/download/pinterest", { params: { url } });

    if (!data.status || !data.result || !data.result.media_urls || data.result.media_urls.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Gagal mengambil data Pinterest.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const result = data.result;
    const media = result.media_urls[0]; // Ambil media pertama
    const isVideo = media.type === "video" || media.url.includes(".mp4");

    // Langsung kirim media
    await pian.sendFile(msg.chatId, {
      file: media.url,
      caption: withFooter(`<blockquote>📌 Pinterest ${isVideo ? "Video" : "Image"}
<b>Judul:</b> ${result.title || "Tidak ada"}
<b>Author:</b> ${result.uploader?.full_name || result.uploader?.username || "Unknown"}
<b>Kualitas:</b> ${media.quality || "Unknown"}</blockquote>`),
      parseMode: "html",
      replyTo: msg.id,
      supportsStreaming: isVideo ? true : false,
    });

    await waitMsg.delete();

  } catch (err) {
    console.error("Pinterest Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mengunduh media Pinterest.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH CAPCUT (.capcutsrch) ========================
if (msg.senderId.toString() === myId && text.startsWith(".capcutsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian.\nContoh: .capcutsrch DJ netizen</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari template CapCut...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/capcut", {
      params: { query: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || !data.result.search_data || data.result.search_data.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan template untuk kata kunci tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const results = data.result.search_data;
    capcutsrchCache.set(msg.chatId.toString(), results);

    let resultText = `<blockquote>🎬 Hasil Pencarian CapCut: "${query}"</blockquote>\n\n`;
    
    results.slice(0, 5).forEach((item, index) => {
      resultText += `<blockquote>${index + 1}. <b>${item.title || item.short_title}</b>\n`;
      resultText += `👤 Author: ${item.author?.full_name || "Tidak diketahui"}\n`;
      resultText += `⏱️ Durasi: ${Math.round(item.duration_ms / 1000)} detik\n`;
      resultText += `📊 Usage: ${item.statistics?.usage?.toLocaleString() || "0"}x\n`;
      resultText += `💖 Like: ${item.statistics?.like?.toLocaleString() || "0"}</blockquote>\n\n`;
    });

    resultText += `<blockquote>Kirim <code>.getcapcut [nomor]</code> untuk mengunduh template (contoh: .getcapcut 1)</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search CapCut Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari template CapCut.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== GET CAPCUT TEMPLATE (.getcapcut) ========================
if (msg.senderId.toString() === myId && text.startsWith(".getcc")) {
  const args = text.split(" ");
  if (args.length < 2 || isNaN(args[1])) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Format salah!\nGunakan: .getcapcut [nomor]\nContoh: .getcc 1</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const index = parseInt(args[1]) - 1;
  const results = capcutsrchCache.get(msg.chatId.toString());
  
  if (!results || !results[index]) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Data tidak ditemukan atau sudah kadaluarsa.\nGunakan .capcutsrch terlebih dahulu.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const template = results[index];
  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mengunduh template CapCut...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const videoUrl = template.download?.video_original || template.download?.video_watermark;
    
    if (!videoUrl) {
      throw new Error("URL video tidak tersedia");
    }

    await pian.sendFile(msg.chatId, {
      file: videoUrl,
      caption: withFooter(`<blockquote>🎬 CapCut Template

<b>Judul:</b> ${template.title || template.short_title}
<b>Author:</b> ${template.author?.full_name || "Tidak diketahui"}
<b>Durasi:</b> ${Math.round(template.duration_ms / 1000)} detik
<b>Kualitas:</b> ${template.download?.definition || "720p"}
<b>Usage:</b> ${template.statistics?.usage?.toLocaleString() || "0"}x
<b>Like:</b> ${template.statistics?.like?.toLocaleString() || "0"}</blockquote>`),
      parseMode: "html",
      replyTo: msg.id,
      supportsStreaming: true
    });

    await waitMsg.delete();

  } catch (err) {
    console.error("Get CapCut Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>❌ Gagal mengunduh template CapCut.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH FDROID (.searchfdroid) ========================
if (msg.senderId.toString() === myId && text.startsWith(".searchfdroid")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian.\nContoh: .searchfdroid termux</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari aplikasi di F-Droid...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/fdroid", {
      params: { query: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || !data.result.search_data || data.result.search_data.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan aplikasi untuk kata kunci tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const results = data.result.search_data;
    searchFdroidCache.set(msg.chatId.toString(), results);

    let resultText = `<blockquote>📱 Hasil Pencarian F-Droid: "${query}"</blockquote>\n\n`;
    
    results.slice(0, 8).forEach((app, index) => {
      resultText += `<blockquote>${index + 1}. <b>${app.name}</b>\n`;
      resultText += `📝 ${app.summary || "Tidak ada deskripsi"}\n`;
      resultText += `📦 License: ${app.license || "Tidak diketahui"}</blockquote>\n\n`;
    });

    resultText += `<blockquote>Kirim <code>.getfdroid [nomor]</code> untuk melihat detail aplikasi</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search F-Droid Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari aplikasi F-Droid.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== GET FDROID DETAIL (.getfdroid) ========================
if (msg.senderId.toString() === myId && text.startsWith(".getfdroid")) {
  const args = text.split(" ");
  if (args.length < 2 || isNaN(args[1])) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Format salah!\nGunakan: .getfdroid [nomor]\nContoh: .getfdroid 1</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const index = parseInt(args[1]) - 1;
  const results = searchFdroidCache.get(msg.chatId.toString());
  
  if (!results || !results[index]) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Data tidak ditemukan atau sudah kadaluarsa.\nGunakan .searchfdroid terlebih dahulu.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const app = results[index];
  
  const detailText = `<blockquote>📱 Detail Aplikasi F-Droid</blockquote>
<blockquote>
<b>Nama:</b> ${app.name}
<b>Deskripsi:</b> ${app.summary || "Tidak ada"}
<b>Lisensi:</b> ${app.license || "Tidak diketahui"}
<b>Link:</b> ${app.link}
</blockquote>

<blockquote>Gunakan perintah .fdroid dengan link di atas untuk mengunduh aplikasi.</blockquote>`;

  await pian.sendMessage(msg.chatId, {
    message: withFooter(detailText),
    replyTo: msg.id,
    parseMode: "html",
  });
  return;
}

// ======================== SEARCH GOOGLE PLAY (.playsrch) ========================
if (msg.senderId.toString() === myId && text.startsWith(".playsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian.\nContoh: .playsrch WhatsApp</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari aplikasi di Google Play Store...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/google/play", {
      params: { query: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || !data.result.search_data || data.result.search_data.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan aplikasi untuk kata kunci tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const results = data.result.search_data;
    searchGooglePlayCache.set(msg.chatId.toString(), results);

    let resultText = `<blockquote>🛒 Hasil Pencarian Google Play: "${query}"</blockquote>\n\n`;
    
    results.slice(0, 6).forEach((app, index) => {
      const rating = app.rate === "-" ? "Belum ada rating" : `⭐ ${app.rate}`;
      resultText += `<blockquote>${index + 1}. <b>${app.nama}</b>\n`;
      resultText += `👨‍💻 Developer: ${app.developer}\n`;
      resultText += `${rating}</blockquote>\n\n`;
    });

    resultText += `<blockquote>Kirim <code>.getplay [nomor]</code> untuk melihat detail aplikasi</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search Google Play Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari aplikasi.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== GET GOOGLE PLAY DETAIL (.getplay) ========================
if (msg.senderId.toString() === myId && text.startsWith(".plyget")) {
  const args = text.split(" ");
  if (args.length < 2 || isNaN(args[1])) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Format salah!\nGunakan: .getplay [nomor]\nContoh: .plyget 1</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const index = parseInt(args[1]) - 1;
  const results = searchGooglePlayCache.get(msg.chatId.toString());
  
  if (!results || !results[index]) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Data tidak ditemukan atau sudah kadaluarsa.\nGunakan .playsrch terlebih dahulu.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const app = results[index];
  const rating = app.rate === "-" ? "Belum ada rating" : `⭐ ${app.rate}`;
  
  let detailText = `<blockquote>🛒 Detail Aplikasi Google Play</blockquote>`;

  try {
    if (app.img && app.img.includes("http")) {
      await pian.sendFile(msg.chatId, {
        file: app.img,
        caption: withFooter(`${detailText}
<blockquote>
<b>Nama:</b> ${app.nama}
<b>Developer:</b> ${app.developer}
<b>Rating:</b> ${rating}
<b>Link:</b> ${app.link}
<b>Developer Link:</b> ${app.link_dev || "Tidak tersedia"}
</blockquote>`),
        parseMode: "html",
        replyTo: msg.id,
      });
    } else {
      detailText += `<blockquote>
<b>Nama:</b> ${app.nama}
<b>Developer:</b> ${app.developer}
<b>Rating:</b> ${rating}
<b>Link:</b> ${app.link}
<b>Developer Link:</b> ${app.link_dev || "Tidak tersedia"}
</blockquote>`;

      await pian.sendMessage(msg.chatId, {
        message: withFooter(detailText),
        replyTo: msg.id,
        parseMode: "html",
      });
    }
  } catch (err) {
    console.error("Send Google Play Detail Error:", err);
    await pian.sendMessage(msg.chatId, {
      message: withFooter(detailText),
      replyTo: msg.id,
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH ML HERO (.herosrch) ========================
if (msg.senderId.toString() === myId && text.startsWith(".herosrch")) {
  const query = text.split(" ").slice(1).join(" ").toLowerCase();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan nama hero.\nContoh: .herosrch Miya</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari hero Mobile Legends...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    let heroes = searchMLHeroCache.get(msg.chatId.toString());

    if (!heroes) {
      const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/hero/list");
      if (data.status && data.result && data.result.hero_list) {
        heroes = data.result.hero_list;
        searchMLHeroCache.set(msg.chatId.toString(), heroes);
      }
    }

    if (!heroes || heroes.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Data hero tidak tersedia.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const filteredHeroes = heroes.filter(hero => 
      hero.name.toLowerCase().includes(query) || 
      hero.slogan.toLowerCase().includes(query) ||
      hero.role.toLowerCase().includes(query)
    );

    if (filteredHeroes.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan hero dengan kata kunci "${query}"</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    // Jika cuma satu hero → ambil detail lengkap
    if (filteredHeroes.length === 1) {
      const hero = filteredHeroes[0];
      try {
        const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/hero/detail", {
          params: { url: hero.hero_link }
        });

        let detail = data.status && data.result ? data.result : hero;

        let detailText = `<blockquote>🛡️ Detail Hero: ${detail.name}</blockquote>`;
        if (detail.image && detail.image.includes("http")) {
          await pian.sendFile(msg.chatId, {
            file: detail.image,
            caption: withFooter(`${detailText}
<blockquote>
<b>Alias:</b> ${detail.alias || "Tidak ada"}
<b>Internal Name:</b> ${detail.internal_name || "Tidak diketahui"}
<b>Role:</b> ${detail.role || hero.role}
<b>Specialties:</b> ${detail.specialties || hero.specialties}
<b>Laning:</b> ${detail.laning || hero.laning}
<b>Region:</b> ${detail.region || hero.region}
<b>BP Points:</b> ${detail.pointsBP || hero.pointsBP}
<b>Diamond Points:</b> ${detail.pointsDM || hero.pointsDM}
<b>Release Date:</b> ${detail.release_date || hero.release_date}
<b>Link:</b> ${hero.hero_link}
</blockquote>`),
            parseMode: "html",
            replyTo: msg.id,
          });
        } else {
          detailText += `<blockquote>
<b>Role:</b> ${detail.role || hero.role}
<b>Specialties:</b> ${detail.specialties || hero.specialties}
<b>Laning:</b> ${detail.laning || hero.laning}
<b>Region:</b> ${detail.region || hero.region}
<b>BP Points:</b> ${detail.pointsBP || hero.pointsBP}
<b>Diamond Points:</b> ${detail.pointsDM || hero.pointsDM}
<b>Link:</b> ${hero.hero_link}
</blockquote>`;
          await pian.editMessage(waitMsg.chatId, {
            message: waitMsg.id,
            text: withFooter(detailText),
            parseMode: "html",
          });
        }

      } catch (err) {
        console.error("ML Detail Error:", err);
        await pian.editMessage(waitMsg.chatId, {
          message: waitMsg.id,
          text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mengambil detail hero.</blockquote>"),
          parseMode: "html",
        });
      }

    } else {
      // Jika lebih dari satu hero → tampilkan list singkat
      let resultText = `<blockquote>🔍 Hasil Pencarian Hero: "${query}" (${filteredHeroes.length} ditemukan)</blockquote>\n\n`;
      filteredHeroes.slice(0, 5).forEach((hero, index) => {
        resultText += `<blockquote>${index + 1}. <b>${hero.name}</b> - ${hero.slogan}\n`;
        resultText += `🎭 Role: ${hero.role}\n`;
        resultText += `⚔️ Specialties: ${hero.specialties}\n`;
        resultText += `📍 Region: ${hero.region}\n`;
        resultText += `💰 BP: ${hero.pointsBP} | 💎 DM: ${hero.pointsDM}</blockquote>\n\n`;
      });
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(resultText),
        parseMode: "html",
      });
    }

  } catch (err) {
    console.error("ML Search Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari hero.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH INSTAGRAM REELS (.igsrch) ========================
if (msg.senderId.toString() === myId && text.startsWith(".igsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan username atau kata kunci.\nContoh: .igsrch yahyaalmthr</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari reels Instagram...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/instagram/reels", {
      params: { query: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || !data.result.search_data || data.result.search_data.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan reels untuk kata kunci tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const reels = data.result.search_data;
    searchIgReelsCache.set(msg.chatId.toString(), reels);

    let resultText = `<blockquote>🎬 Hasil Pencarian Instagram Reels: "${query}"</blockquote>\n\n`;
    
    reels.slice(0, 5).forEach((reel, index) => {
      const captionShort = reel.caption ? 
        (reel.caption.length > 50 ? reel.caption.substring(0, 50) + "..." : reel.caption) : 
        "Tidak ada caption";
      
      resultText += `<blockquote>${index + 1}. <b>Reel by ${reel.profile?.full_name || "Unknown"}</b>\n`;
      resultText += `📝 ${captionShort}\n`;
      resultText += `⏱️ ${Math.round(reel.duration)} detik\n`;
      resultText += `❤️ ${reel.statistics?.like_count?.toLocaleString() || "0"} likes\n`;
      resultText += `▶️ ${reel.statistics?.play_count?.toLocaleString() || "0"} views</blockquote>\n\n`;
    });

    resultText += `<blockquote>Kirim <code>.getreel [nomor]</code> untuk mengunduh reel (contoh: .getreel 1)</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search IG Reels Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari reels Instagram.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== GET INSTAGRAM REEL (.getreel) ========================
if (msg.senderId.toString() === myId && text.startsWith(".getreel")) {
  const args = text.split(" ");
  if (args.length < 2 || isNaN(args[1])) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Format salah!\nGunakan: .getreel [nomor]\nContoh: .getreel 1</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const index = parseInt(args[1]) - 1;
  const reels = searchIgReelsCache.get(msg.chatId.toString());
  
  if (!reels || !reels[index]) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Data tidak ditemukan atau sudah kadaluarsa.\nGunakan .igsrch terlebih dahulu.</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const reel = reels[index];
  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>⏳ Mengunduh reel Instagram...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const videoUrl = reel.reels?.url;
    
    if (!videoUrl) {
      throw new Error("URL video tidak tersedia");
    }

    await pian.sendFile(msg.chatId, {
      file: videoUrl,
      caption: withFooter(`<blockquote>🎬 Instagram Reels

<b>Author:</b> ${reel.profile?.full_name || "Unknown"} (@${reel.profile?.username || "unknown"})
<b>Durasi:</b> ${Math.round(reel.duration)} detik
<b>Caption:</b> ${reel.caption || "Tidak ada caption"}
<b>Likes:</b> ${reel.statistics?.like_count?.toLocaleString() || "0"}
<b>Views:</b> ${reel.statistics?.play_count?.toLocaleString() || "0"}
<b>Comments:</b> ${reel.statistics?.comment_count?.toLocaleString() || "0"}
<b>Tanggal:</b> ${new Date(reel.taken_at * 1000).toLocaleDateString("id-ID")}</blockquote>`),
      parseMode: "html",
      replyTo: msg.id,
      supportsStreaming: true
    });

    await waitMsg.delete();

  } catch (err) {
    console.error("Get IG Reel Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>❌ Gagal mengunduh reel Instagram.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH INSTAGRAM USERS (.iguser) ========================
if (msg.senderId.toString() === myId && text.startsWith(".iguser")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan username Instagram.\nContoh: .iguser yahyaalmthr</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari pengguna Instagram...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/instagram/users", {
      params: { query: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || !data.result.search_data || data.result.search_data.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan pengguna dengan username tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const users = data.result.search_data;
    searchIgUsersCache.set(msg.chatId.toString(), users);

    let resultText = `<blockquote>👤 Hasil Pencarian Instagram Users: "${query}"</blockquote>\n\n`;
    
    users.slice(0, 5).forEach((user, index) => {
      const privacy = user.is_private ? "🔒 Private" : "🌍 Public";
      const verified = user.is_verified ? "✅ Verified" : "";
      
      resultText += `<blockquote>${index + 1}. <b>${user.full_name || "No Name"}</b>\n`;
      resultText += `@${user.username}\n`;
      resultText += `${privacy} ${verified}</blockquote>\n\n`;
    });

    resultText += `<blockquote>Kirim <code>.getiguser [nomor]</code> untuk melihat profil lengkap</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search IG Users Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari pengguna Instagram.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH PINTEREST V2 (.pinsearch) ========================

// ======================== PINSRCH ========================
if (msg.senderId.toString() === myId && text.startsWith(".pinsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian.\nContoh: .pinsrch Free Fire</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari gambar di Pinterest...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    // Ambil gambar dari API V1
    const { data } = await axios.get("https://api.vreden.my.id/api/v1/search/pinterest", {
      params: { query: encodeURIComponent(query) }
    });

    const images = data?.result?.search_data?.slice(0, 5) || [];

    if (images.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan gambar untuk kata kunci tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    // Kirim gambar satu per satu
    for (let i = 0; i < images.length; i++) {
      try {
        await pian.sendFile(msg.chatId, {
          file: images[i],
          caption: withFooter(`<blockquote>🖼️ Pinterest Image ${i + 1}/${images.length}</blockquote>`),
          parseMode: "html",
          replyTo: i === 0 ? msg.id : undefined
        });
      } catch (err) {
        console.error(`Error sending image ${i + 1}:`, err.message);
      }
    }

    await waitMsg.delete();

  } catch (err) {
    console.error("Pinterest Search Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari gambar Pinterest.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ================= YOUTUBE SEARCH (.ytsrch) =================
if (msg.senderId.toString() === myId && text.startsWith(".ytsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci.\nContoh: .ytsrch Kau masih kekasihku</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari di YouTube...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/search/youtube", {
      params: { q: query }
    });

    if (!data.status || !data.result || data.result.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan hasil.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const results = data.result.slice(0, 5); // hanya 5 hasil

    let resultText = `<blockquote>▶️ <b>YouTube Search</b>\nKata kunci: <code>${query}</code></blockquote>\n\n`;

    results.forEach((vid, i) => {
      resultText += `<blockquote>
<b>${i + 1}. ${vid.title}</b>
👤 Channel: ${vid.channel}
⏱️ Durasi: ${vid.duration}
🔗 ${vid.link}
</blockquote>\n`;
    });

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("YT Search Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari YouTube.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================= GBWASRCH (.gbwasrch) =======================
if (msg.senderId.toString() === myId && text.startsWith(".gbwasrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian.\nContoh: .gbwasrch ML indonesia</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari grup WhatsApp...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/search/grubwa", {
      params: { q: query }
    });

    if (!data.status || !data.result || data.result.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Tidak ditemukan grup WhatsApp untuk kata kunci tersebut.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    const results = data.result.slice(0, 5); // ambil maksimal 5 grup

    let resultText = `<blockquote>📌 Hasil Pencarian Grup WA: "${query}"</blockquote>\n\n`;

    results.forEach((grp, idx) => {
      resultText += `<blockquote>${idx + 1}. <b>${grp.Name}</b>\n`;
      if (grp.Description) resultText += `📝 ${grp.Description}\n`;
      resultText += `🔗 <a href="${grp.Link}">${grp.Link}</a>\n`;
      resultText += `📌 Keyword: ${grp.Keyword || "-"}</blockquote>\n\n`;
    });

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("GBWASRCH Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari grup WhatsApp.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================= TIKTOK SEARCH (.ttsrch) =======================
if (msg.senderId.toString() === myId && text.startsWith(".ttsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian.\nContoh: .ttsrch funny cat</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari video TikTok...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/search/tiktok", {
      params: { query }
    });

    if (!data.status || !data.result) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter("<blockquote>❌ Video TikTok tidak ditemukan.</blockquote>"),
        parseMode: "html",
      });
      return;
    }

    // API ini biasanya return 1 video,
    // jadi kita normalisasi ke array
    const results = Array.isArray(data.result)
      ? data.result.slice(0, 5)
      : [data.result];

    await waitMsg.delete();

    for (let i = 0; i < results.length && i < 5; i++) {
      const vid = results[i];

      const videoUrl = vid.play || vid.wm_play;
      if (!videoUrl) continue;

      await pian.sendFile(msg.chatId, {
        file: videoUrl,
        caption: withFooter(
`<blockquote>🎵 TikTok Video ${i + 1}

<b>Author:</b> ${vid.nickname || vid.author}
<b>Username:</b> @${vid.author}
<b>Judul:</b> ${vid.title || "-"}

🎶 <b>Music:</b> ${vid.music_info?.title || "-"}
🌍 <b>Region:</b> ${vid.region || "-"}</blockquote>`
        ),
        parseMode: "html",
        replyTo: i === 0 ? msg.id : undefined,
        supportsStreaming: true,
      });
    }

  } catch (err) {
    console.error("TTSRCH Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari TikTok.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

// ======================== SEARCH NPM - FIXED VERSION (.npmsrch) ========================
if (msg.senderId.toString() === myId && text.startsWith(".npmsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian npm package.\nContoh: .npmsrch whiskeysockets</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari package npm...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/search/npm", {
      params: { q: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || data.result.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan npm package untuk "${query}".</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const packages = data.result;
    // Ambil hanya 5 package pertama sesuai permintaan
    const limitedPackages = packages.slice(0, 5);
    const totalFound = packages.length;

    let resultText = `<blockquote>📦 Hasil Pencarian npm: "${query}"</blockquote>\n\n`;
    resultText += `<blockquote>📊 Menampilkan 5 dari ${totalFound} package ditemukan</blockquote>\n\n`;
    
    limitedPackages.forEach((pkg, index) => {
      const version = pkg.version ? `v${pkg.version}` : "Tidak diketahui";
      const desc = pkg.description || "Tidak ada deskripsi";
      
      resultText += `<blockquote><b>${index + 1}. ${pkg.name}</b> ${version}\n`;
      resultText += `📝 ${desc}\n`;
      
      // Tampilkan keywords jika ada dan tidak kosong
      if (pkg.keywords && Array.isArray(pkg.keywords) && pkg.keywords.length > 0) {
        const keywords = pkg.keywords.slice(0, 4); // Maksimal 4 keyword
        resultText += `🏷️ Tags: <i>${keywords.join(", ")}</i>\n`;
      }
      
      // Tampilkan tanggal dengan format Indonesia
      const date = new Date(pkg.date);
      const formattedDate = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      resultText += `📅 ${formattedDate}\n`;
      
      // Tampilkan link npm (selalu ada)
      resultText += `🔗 npm: <code>${pkg.links.npm}</code>\n`;
      
      // Tampilkan homepage jika ada dan tidak null
      if (pkg.links.homepage) {
        resultText += `🌐 Homepage: <code>${pkg.links.homepage}</code>\n`;
      }
      
      // Tampilkan repository jika ada dan tidak null
      if (pkg.links.repository) {
        const repoShort = pkg.links.repository
          .replace(/^git\+/, "")
          .replace(/\.git$/, "")
          .replace(/^ssh:\/\/git@/, "https://")
          .replace(/^git@/, "https://")
          .replace(/:/, "/");
        resultText += `📁 Repo: <code>${repoShort}</code>`;
      }
      
      resultText += `</blockquote>\n\n`;
    });

    // Tambahkan footer dengan info tambahan
    resultText += `<blockquote>ℹ️ Gunakan <code>.npmsrch [kata lain]</code> untuk mencari package lain</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search npm Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari npm package.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".douyinsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian video Douyin.\nContoh: .douyinsrch beautiful dance</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari video Douyin...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/search/douyin", {
      params: { q: encodeURIComponent(query) }
    });

    if (!data.status || !data.data || data.data.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan video Douyin untuk "${query}".</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    // 从返回数据中提取信息
    const videoData = data.data[0]; // 取第一个结果
    const videoInfo = {
      caption: data.caption || "Tidak ada deskripsi",
      videoUrl: data.video || "",
      douyinUrl: data.caption.match(/https?:\/\/[^\s]+/) ? data.caption.match(/https?:\/\/[^\s]+/)[0] : "",
      desc: videoData.desc || "",
      createTime: videoData.create_time ? new Date(videoData.create_time * 1000) : null,
      author: videoData.author ? {
        nickname: videoData.author.nickname || "Tidak diketahui",
        signature: videoData.author.signature || "Tidak ada bio",
        followerCount: videoData.author.follower_count || 0
      } : null,
      music: videoData.music ? {
        title: videoData.music.title || "Tidak ada judul",
        author: videoData.music.author || "Tidak diketahui",
        duration: videoData.music.duration || 0
      } : null,
      hashtags: []
    };

    // 提取hashtag
    if (videoData.desc) {
      const hashtagMatches = videoData.desc.match(/#[^\s#]+/g);
      if (hashtagMatches) {
        videoInfo.hashtags = hashtagMatches.slice(0, 5); // 最多5个hashtag
      }
    }

    let resultText = `<blockquote>🎬 Hasil Pencarian Douyin: "${query}"</blockquote>\n\n`;
    
    // 添加视频信息
    resultText += `<blockquote><b>📝 Deskripsi:</b>\n${videoInfo.desc || videoInfo.caption}</blockquote>\n\n`;
    
    // 作者信息
    if (videoInfo.author) {
      resultText += `<blockquote><b>👤 Penulis:</b> ${videoInfo.author.nickname}\n`;
      resultText += `<b>📌 Bio:</b> ${videoInfo.author.signature}\n`;
      resultText += `<b>👥 Pengikut:</b> ${videoInfo.author.followerCount.toLocaleString('id-ID')}</blockquote>\n\n`;
    }
    
    // 音乐信息
    if (videoInfo.music) {
      resultText += `<blockquote><b>🎵 Musik:</b> ${videoInfo.music.title}\n`;
      resultText += `<b>🎤 Artis:</b> ${videoInfo.music.author}\n`;
      resultText += `<b>⏱️ Durasi:</b> ${videoInfo.music.duration} detik</blockquote>\n\n`;
    }
    
    // Hashtag
    if (videoInfo.hashtags.length > 0) {
      resultText += `<blockquote><b>🏷️ Tag:</b> ${videoInfo.hashtags.join(" ")}</blockquote>\n\n`;
    }
    
    // 时间信息
    if (videoInfo.createTime) {
      const formattedDate = videoInfo.createTime.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      resultText += `<blockquote><b>📅 Dibuat:</b> ${formattedDate}</blockquote>\n\n`;
    }
    
    // 链接
    resultText += `<blockquote>🔗 Link:\n`;
    if (videoInfo.douyinUrl) {
      resultText += `Douyin: <code>${videoInfo.douyinUrl}</code>\n`;
    }
    if (videoInfo.videoUrl) {
      // 提取较短的视频URL（移除过长参数）
      const shortVideoUrl = videoInfo.videoUrl.split('?')[0].substring(0, 50) + "...";
      resultText += `Video: <code>${shortVideoUrl}</code></blockquote>\n\n`;
    }
    
    // 发送视频
    if (videoInfo.videoUrl) {
      try {
        // 尝试直接发送视频
        await pian.sendMessage(msg.chatId, {
          video: { url: videoInfo.videoUrl },
          caption: withFooter(resultText),
          parseMode: "html",
          replyTo: msg.id
        });
        
        // 删除等待消息
        await pian.deleteMessage(waitMsg.chatId, waitMsg.id);
        
      } catch (videoErr) {
        console.error("Video send error:", videoErr);
        // 如果发送视频失败，发送文本结果
        await pian.editMessage(waitMsg.chatId, {
          message: waitMsg.id,
          text: withFooter(`${resultText}\n<blockquote>⚠️ Video tidak dapat ditampilkan, gunakan link di atas.</blockquote>`),
          parseMode: "html",
        });
      }
    } else {
      // 如果没有视频链接，只发送文本
      resultText += `<blockquote>⚠️ Link video tidak tersedia</blockquote>`;
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(resultText),
        parseMode: "html",
      });
    }

  } catch (err) {
    console.error("Search Douyin Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari video Douyin.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".applemscsrch")) {
  const query = text.split(" ").slice(1).join(" ");
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan kata kunci pencarian lagu Apple Music.\nContoh: .applemscsrch Kau masih kekasihku</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter("<blockquote>🔍 Mencari lagu di Apple Music...</blockquote>"),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/search/applemusic", {
      params: { q: encodeURIComponent(query) }
    });

    if (!data.status || !data.result || data.result.length === 0) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan lagu di Apple Music untuk "${query}".</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const songs = data.result;
    // Ambil hanya 5 lagu pertama sesuai permintaan
    const limitedSongs = songs.slice(0, 5);
    const totalFound = songs.length;

    let resultText = `<blockquote>🎵 Hasil Pencarian Apple Music: "${query}"</blockquote>\n\n`;
    resultText += `<blockquote>📊 Menampilkan 5 dari ${totalFound} lagu ditemukan</blockquote>\n\n`;
    
    limitedSongs.forEach((song, index) => {
      const title = song.title || "Tidak ada judul";
      const artistName = song.artist?.name || "Artis tidak diketahui";
      const artistUrl = song.artist?.url || "";
      const songUrl = song.song || "";
      
      // Ekstrak ID lagu dari URL untuk format yang lebih rapi
      let songId = "";
      if (songUrl) {
        const match = songUrl.match(/\/song\/[^\/]+\/(\d+)/);
        songId = match ? match[1] : "";
      }
      
      resultText += `<blockquote><b>${index + 1}. ${title}</b>\n`;
      resultText += `🎤 <b>Artis:</b> ${artistName}\n`;
      
      // Tampilkan link lagu
      if (songUrl) {
        resultText += `🎵 <b>Link lagu:</b> <code>${songUrl}</code>\n`;
      }
      
      // Tampilkan link artis jika ada
      if (artistUrl) {
        resultText += `👤 <b>Profil artis:</b> <code>${artistUrl}</code>`;
      }
      
      // Tampilkan ID lagu jika berhasil diekstrak
      if (songId) {
        resultText += `\n🆔 <b>ID Lagu:</b> <code>${songId}</code>`;
      }
      
      resultText += `</blockquote>\n\n`;
    });

    // Tambahkan footer dengan info tambahan
    resultText += `<blockquote>ℹ️ Gunakan <code>.applemscsrch [kata lain]</code> untuk mencari lagu lain</blockquote>\n`;
    resultText += `<blockquote>🔗 Semua link dapat dibuka di Apple Music app atau iTunes</blockquote>`;

    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(resultText),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Search Apple Music Error:", err);
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter("<blockquote>⚠️ Terjadi kesalahan saat mencari lagu di Apple Music.</blockquote>"),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".igstalk")) {
  const query = text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan username Instagram.\nContoh: .igstalk 27nammm</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>🔍 Mencari profil Instagram: @${query}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.zenzxz.my.id/api/stalker/instagram", {
      params: { username: encodeURIComponent(query) },
      timeout: 10000
    });

    if (!data.success || !data.data) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan profil Instagram untuk "@${query}".\nPastikan username benar dan akun tidak diprivate.</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const user = data.data;
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    
    const formattedDate = timestamp.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // 构建要发送的文本信息
    let caption = `<blockquote>📸 Instagram Profile Info</blockquote>\n\n`;
    caption += `<blockquote><b>👤 Username:</b> @${user.username}\n`;
    caption += `<b>📛 Name:</b> ${user.name !== "-" ? user.name : "Not available"}\n`;
    
    if (user.bio && user.bio !== "-") {
      const shortBio = user.bio.length > 100 ? user.bio.substring(0, 100) + "..." : user.bio;
      caption += `<b>📝 Bio:</b> ${shortBio}\n`;
    }
    
    caption += `<b>👥 Followers:</b> ${user.followers.toLocaleString('id-ID')}\n`;
    caption += `<b>↪️ Following:</b> ${user.following.toLocaleString('id-ID')}\n`;
    caption += `<b>📷 Posts:</b> ${user.posts.toLocaleString('id-ID')}\n`;
    caption += `<b>✅ Verified:</b> ${user.verified ? "Yes" : "No"}\n`;
    caption += `<b>📊 Engagement Rate:</b> ${user.engagement_rate.toFixed(2)}%\n`;
    caption += `<b>🕒 Last Updated:</b> ${formattedDate}</blockquote>\n\n`;
    caption += `<blockquote>ℹ️ Use <code>.igstalk [username]</code> for other profiles</blockquote>`;

    // 核心逻辑：像 .stalkmenu 一样，先尝试发送图片，失败则发送纯文本
    try {
      // 检查是否有有效的头像URL
      if (user.profile_pic && user.profile_pic.startsWith('http')) {
        // 尝试发送图片文件
        await pian.sendFile(msg.chatId, {
          file: user.profile_pic, // 使用头像URL
          caption: withFooter(caption),
          replyTo: msg.id,
          parseMode: "html",
        });
        
        // 删除等待消息
        await pian.deleteMessage(waitMsg.chatId, waitMsg.id);
      } else {
        // 如果没有头像URL，则发送纯文本
        throw new Error("Profile picture URL not available");
      }
    } catch (sendError) {
      console.error("Error sending profile picture:", sendError.message);
      // 发送图片失败，则编辑等待消息为纯文本
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`${caption}\n<blockquote>⚠️ Foto profil tidak dapat ditampilkan, menggunakan teks saja.</blockquote>`),
        parseMode: "html",
      });
    }

  } catch (err) {
    console.error("Instagram Stalk Error:", err);
    
    let errorMessage = "<blockquote>⚠️ Error searching Instagram profile.</blockquote>";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "<blockquote>⏱️ Request timeout. Try again later.</blockquote>";
    } else if (err.response?.status === 404) {
      errorMessage = `<blockquote>❌ Profile "@${query}" not found or private.</blockquote>`;
    }
    
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(errorMessage),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".robloxstalk")) {
  const query = text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan username Roblox.\nContoh: .robloxstalk Sanzzslw</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>🔍 Mencari profil Roblox: ${query}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.zenzxz.my.id/api/stalker/roblox", {
      params: { user: encodeURIComponent(query) },
      timeout: 10000
    });

    if (!data.success || !data.data) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan profil Roblox untuk "${query}".\nPastikan username benar.</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const user = data.data;
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    
    // Format tanggal Indonesia
    const formattedDate = timestamp.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Buat caption dengan informasi user
    let caption = `<blockquote>👾 Roblox Profile Info</blockquote>\n\n`;
    
    // Informasi dasar
    caption += `<blockquote><b>👤 Username:</b> ${user.basic.name}\n`;
    caption += `<b>📛 Display Name:</b> ${user.basic.displayName}\n`;
    caption += `<b>🆔 User ID:</b> ${user.basic.id}\n`;
    
    // Format tanggal pembuatan akun
    const createdDate = new Date(user.basic.created);
    const createdFormatted = createdDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    caption += `<b>📅 Akun Dibuat:</b> ${createdFormatted}</blockquote>\n\n`;
    
    // Statistik sosial
    caption += `<blockquote><b>📊 Statistik Sosial:</b>\n`;
    caption += `• <b>Teman:</b> ${user.social.friends.count.toLocaleString('id-ID')}\n`;
    caption += `• <b>Pengikut:</b> ${user.social.followers.count.toLocaleString('id-ID')}\n`;
    caption += `• <b>Mengikuti:</b> ${user.social.following.count.toLocaleString('id-ID')}</blockquote>\n\n`;
    
    // Status akun
    caption += `<blockquote><b>🔐 Status Akun:</b>\n`;
    caption += `• <b>Verified Badge:</b> ${user.basic.hasVerifiedBadge ? "✅ Ya" : "❌ Tidak"}\n`;
    caption += `• <b>Banned:</b> ${user.basic.isBanned ? "✅ Ya" : "❌ Tidak"}\n`;
    
    // Status online
    const userPresence = user.presence?.userPresences?.[0];
    if (userPresence) {
      let statusText = "Offline";
      if (userPresence.userPresenceType === 1) statusText = "Online";
      else if (userPresence.userPresenceType === 2) statusText = "Dalam Game";
      else if (userPresence.userPresenceType === 3) statusText = "Studio";
      
      caption += `• <b>Status:</b> ${statusText}\n`;
      if (userPresence.lastLocation) {
        caption += `• <b>Lokasi Terakhir:</b> ${userPresence.lastLocation}`;
      }
    }
    caption += `</blockquote>\n\n`;
    
    // Informasi avatar
    if (user.avatar?.details) {
      const avatar = user.avatar.details;
      caption += `<blockquote><b>🦸 Info Avatar:</b>\n`;
      caption += `• <b>Tipe:</b> ${avatar.playerAvatarType}\n`;
      caption += `• <b>Mood:</b> ${avatar.emotes?.[0]?.assetName || "Default"}\n`;
      caption += `• <b>Aset Dipakai:</b> ${user.avatar.wearing?.assetIds?.length || 0} item</blockquote>\n\n`;
    }
    
    // Grup (tampilkan 3 grup pertama)
    if (user.groups?.list?.data?.length > 0) {
      caption += `<blockquote><b>👥 Grup (${user.groups.list.data.length}):</b>\n`;
      const groups = user.groups.list.data.slice(0, 3);
      groups.forEach((groupItem, index) => {
        const group = groupItem.group;
        const role = groupItem.role;
        caption += `${index + 1}. <b>${group.name}</b>\n`;
        caption += `   👤 Peran: ${role.name} (Rank: ${role.rank})\n`;
        caption += `   👥 Anggota: ${group.memberCount.toLocaleString('id-ID')}\n`;
      });
      if (user.groups.list.data.length > 3) {
        caption += `... dan ${user.groups.list.data.length - 3} grup lainnya`;
      }
      caption += `</blockquote>\n\n`;
    }
    
    // Achievement (badge)
    if (user.achievements?.robloxBadges?.length > 0) {
      const badge = user.achievements.robloxBadges[0];
      caption += `<blockquote><b>🏆 Achievement:</b>\n`;
      caption += `• <b>${badge.name}</b>\n`;
      caption += `${badge.description}</blockquote>\n\n`;
    }
    
    // Footer
    caption += `<blockquote><b>🕒 Diperbarui:</b> ${formattedDate}</blockquote>\n\n`;
    caption += `<blockquote>ℹ️ Gunakan <code>.robloxstalk [username]</code> untuk profil lain</blockquote>`;

    // Cek apakah ada gambar avatar (headshot)
    const headshotUrl = user.avatar?.headshot?.data?.[0]?.imageUrl;
    
    // Logika pengiriman seperti .stalkmenu
    try {
      if (headshotUrl && headshotUrl.startsWith('http')) {
        // Kirim foto avatar dengan caption
        await pian.sendFile(msg.chatId, {
          file: headshotUrl,
          caption: withFooter(caption),
          replyTo: msg.id,
          parseMode: "html",
        });
        

      } else {
        // Jika tidak ada URL avatar, kirim teks saja
        throw new Error("Avatar image URL not available");
      }
    } catch (sendError) {
      console.error("Error sending Roblox avatar:", sendError.message);
      // Kirim teks saja jika gagal kirim gambar
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`${caption}\n<blockquote>⚠️ Avatar tidak dapat ditampilkan, menggunakan teks saja.</blockquote>`),
        parseMode: "html",
      });
    }

  } catch (err) {
    console.error("Roblox Stalk Error:", err);
    
    let errorMessage = "<blockquote>⚠️ Error searching Roblox profile.</blockquote>";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "<blockquote>⏱️ Request timeout. Try again later.</blockquote>";
    } else if (err.response?.status === 404) {
      errorMessage = `<blockquote>❌ Profile "${query}" not found.</blockquote>`;
    }
    
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(errorMessage),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".ttstalk")) {
  const query = text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan username TikTok.\nContoh: .ttstalk znav06</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>🔍 Mencari profil TikTok: @${query}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api-faa.my.id/faa/tiktokstalk", {
      params: { username: encodeURIComponent(query) },
      timeout: 10000
    });

    if (!data.status || !data.result) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan profil TikTok untuk "@${query}".\nPastikan username benar dan akun tidak diprivate.</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const user = data.result;
    
    // Buat caption dengan informasi user
    let caption = `<blockquote>📱 TikTok Profile Info</blockquote>\n\n`;
    
    // Informasi dasar
    caption += `<blockquote><b>👤 Username:</b> @${user.username}\n`;
    caption += `<b>📛 Nama:</b> ${user.name || "Tidak tersedia"}\n`;
    caption += `<b>🆔 ID:</b> ${user.id}\n`;
    
    // Format tanggal pembuatan akun
    const createdDate = new Date(user.create_time * 1000);
    const createdFormatted = createdDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    caption += `<b>📅 Akun Dibuat:</b> ${createdFormatted}</blockquote>\n\n`;
    
    // Statistik
    if (user.stats) {
      const stats = user.stats;
      caption += `<blockquote><b>📊 Statistik:</b>\n`;
      caption += `• <b>Pengikut:</b> ${stats.followers.toLocaleString('id-ID')}\n`;
      caption += `• <b>Mengikuti:</b> ${stats.following.toLocaleString('id-ID')}\n`;
      caption += `• <b>Suka:</b> ${stats.likes.toLocaleString('id-ID')}\n`;
      caption += `• <b>Video:</b> ${stats.videos.toLocaleString('id-ID')}</blockquote>\n\n`;
    }
    
    // Deskripsi jika ada
    if (user.description && user.description !== "-") {
      const shortDesc = user.description.length > 150 ? 
        user.description.substring(0, 150) + "..." : user.description;
      caption += `<blockquote><b>📝 Deskripsi:</b>\n${shortDesc}</blockquote>\n\n`;
    }
    
    // Bio jika ada
    if (user.bio) {
      caption += `<blockquote><b>ℹ️ Bio:</b>\n${user.bio}</blockquote>\n\n`;
    }
    
    // Status akun
    caption += `<blockquote><b>🔐 Status Akun:</b>\n`;
    caption += `• <b>Verifikasi:</b> ${user.verified ? "✅ Terverifikasi" : "❌ Tidak terverifikasi"}\n`;
    caption += `• <b>Privat:</b> ${user.private ? "✅ Ya" : "❌ Tidak"}\n`;
    caption += `• <b>Penjual:</b> ${user.seller ? "✅ Ya" : "❌ Tidak"}\n`;
    caption += `• <b>Organisasi:</b> ${user.organization ? "✅ Ya" : "❌ Tidak"}`;
    
    // Region jika ada
    if (user.region) {
      caption += `\n• <b>Region:</b> ${user.region.toUpperCase()}`;
    }
    caption += `</blockquote>\n\n`;
    
    // Link TikTok
    if (user.link) {
      caption += `<blockquote><b>🔗 Link TikTok:</b>\n<code>${user.link}</code></blockquote>\n\n`;
    }
    
    // Footer
    caption += `<blockquote>ℹ️ Gunakan <code>.ttstalk [username]</code> untuk profil lain</blockquote>`;

    // Cek apakah ada avatar
    const avatarUrl = user.avatar;
    
    // SIMPLIFIED: 只发送一次，优先发送头像版本
    if (avatarUrl && avatarUrl.startsWith('http')) {

      // Kirim foto avatar dengan caption
      await pian.sendFile(msg.chatId, {
        file: avatarUrl,
        caption: withFooter(caption),
        replyTo: msg.id,
        parseMode: "html",
      });
      
    } else {
      // Jika tidak ada URL avatar, edit pesan tunggu
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`${caption}\n<blockquote>⚠️ Foto profil tidak tersedia</blockquote>`),
        parseMode: "html",
      });
    }

  } catch (err) {
    console.error("TikTok Stalk Error:", err);
    
    let errorMessage = "<blockquote>⚠️ Error searching TikTok profile.</blockquote>";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "<blockquote>⏱️ Request timeout. Try again later.</blockquote>";
    } else if (err.response?.status === 404) {
      errorMessage = `<blockquote>❌ Profile "@${query}" not found or private.</blockquote>`;
    }
    
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(errorMessage),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".githubstalk")) {
  const query = text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan username GitHub.\nContoh: .githubstalk RayNozawa</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>🔍 Mencari profil GitHub: ${query}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://smail.my.id/githubstalk", {
      params: { username: encodeURIComponent(query) },
      timeout: 10000
    });

    if (!data || !data.login) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan profil GitHub untuk "${query}".\nPastikan username benar.</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const user = data;
    
    // Buat caption dengan informasi user
    let caption = `<blockquote>💻 GitHub Profile Info</blockquote>\n\n`;
    
    // Informasi dasar
    caption += `<blockquote><b>👤 Username:</b> ${user.login}\n`;
    caption += `<b>📛 Nama:</b> ${user.name || "Tidak tersedia"}\n`;
    caption += `<b>🆔 ID:</b> ${user.id}\n`;
    caption += `<b>🏷️ Node ID:</b> <code>${user.node_id}</code></blockquote>\n\n`;
    
    // Format tanggal pembuatan akun
    const createdDate = new Date(user.created_at);
    const createdFormatted = createdDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    // Format tanggal update
    const updatedDate = new Date(user.updated_at);
    const updatedFormatted = updatedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    
    // Statistik
    caption += `<blockquote><b>📊 Statistik:</b>\n`;
    caption += `• <b>Repositori Publik:</b> ${user.public_repos.toLocaleString('id-ID')}\n`;
    caption += `• <b>Gists Publik:</b> ${user.public_gists.toLocaleString('id-ID')}\n`;
    caption += `• <b>Pengikut:</b> ${user.followers.toLocaleString('id-ID')}\n`;
    caption += `• <b>Mengikuti:</b> ${user.following.toLocaleString('id-ID')}</blockquote>\n\n`;
    
    // Informasi tambahan
    caption += `<blockquote><b>ℹ️ Informasi Tambahan:</b>\n`;
    
    if (user.company) {
      caption += `• <b>Perusahaan:</b> ${user.company}\n`;
    }
    
    if (user.location) {
      caption += `• <b>Lokasi:</b> ${user.location}\n`;
    }
    
    if (user.blog) {
      caption += `• <b>Website/Blog:</b> <code>${user.blog}</code>\n`;
    }
    
    if (user.email) {
      caption += `• <b>Email:</b> <code>${user.email}</code>\n`;
    }
    
    if (user.twitter_username) {
      caption += `• <b>Twitter:</b> @${user.twitter_username}\n`;
    }
    
    if (user.bio) {
      caption += `• <b>Bio:</b> ${user.bio}\n`;
    }
    
    caption += `• <b>Hireable:</b> ${user.hireable ? "✅ Ya" : "❌ Tidak"}\n`;
    caption += `• <b>Site Admin:</b> ${user.site_admin ? "✅ Ya" : "❌ Tidak"}\n`;
    caption += `• <b>Tipe Akun:</b> ${user.type}\n`;
    caption += `• <b>View Type:</b> ${user.user_view_type}</blockquote>\n\n`;
    
    // Tanggal
    caption += `<blockquote><b>📅 Timeline:</b>\n`;
    caption += `• <b>Akun Dibuat:</b> ${createdFormatted}\n`;
    caption += `• <b>Terakhir Diperbarui:</b> ${updatedFormatted}</blockquote>\n\n`;
    
    // Link GitHub
    if (user.html_url) {
      caption += `<blockquote><b>🔗 Link GitHub:</b>\n<code>${user.html_url}</code></blockquote>\n\n`;
    }
    
    // Links API (opsional)
    caption += `<blockquote><b>🔗 API Links:</b>\n`;
    caption += `• <b>Repos:</b> <code>${user.repos_url}</code>\n`;
    caption += `• <b>Events:</b> <code>${user.events_url.replace('{/privacy}', '')}</code></blockquote>\n\n`;
    
    // Footer
    caption += `<blockquote>ℹ️ Gunakan <code>.githubstalk [username]</code> untuk profil lain</blockquote>`;

    // Cek apakah ada avatar
    const avatarUrl = user.avatar_url;
    
    // SIMPLIFIED: 只发送一次，优先发送头像版本
    if (avatarUrl && avatarUrl.startsWith('http')) {
      // Hapus pesan tunggu terlebih dahulu

      // Kirim foto avatar dengan caption
      await pian.sendFile(msg.chatId, {
        file: avatarUrl,
        caption: withFooter(caption),
        replyTo: msg.id,
        parseMode: "html",
      });
      
    } else {
      // Jika tidak ada URL avatar, edit pesan tunggu
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`${caption}\n<blockquote>⚠️ Foto profil tidak tersedia</blockquote>`),
        parseMode: "html",
      });
    }

  } catch (err) {
    console.error("GitHub Stalk Error:", err);
    
    let errorMessage = "<blockquote>⚠️ Error searching GitHub profile.</blockquote>";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "<blockquote>⏱️ Request timeout. Try again later.</blockquote>";
    } else if (err.response?.status === 404) {
      errorMessage = `<blockquote>❌ Profile "${query}" not found on GitHub.</blockquote>`;
    } else if (err.response?.status === 403) {
      errorMessage = "<blockquote>🚫 Rate limit exceeded. Try again later.</blockquote>";
    }
    
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(errorMessage),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".ffstalk")) {
  const query = text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan ID Free Fire.\nContoh: .ffstalk 9471050934</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>🔍 Mencari profil Free Fire: ${query}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/stalker/stalkff", {
      params: { id: encodeURIComponent(query) },
      timeout: 10000
    });

    if (!data.status || !data.result) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan profil Free Fire untuk ID "${query}".\nPastikan ID benar dan akun tidak diprivate.</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const user = data.result;
    
    // Buat caption dengan informasi user
    let caption = `<blockquote>🎮 Free Fire Profile Info</blockquote>\n\n`;
    
    // Informasi dasar
    caption += `<blockquote><b>🆔 Player ID:</b> ${user.player_id}\n`;
    caption += `<b>👤 Nickname:</b> ${user.nickname}\n`;
    caption += `<b>🎯 Game:</b> ${user.game}\n`;
    caption += `<b>📊 Status:</b> ${user.status}</blockquote>\n\n`;
    
    // Footer
    caption += `<blockquote>ℹ️ Gunakan <code>.ffstalk [player_id]</code> untuk profil lain</blockquote>`;
    caption += `<blockquote>⚠️ Data hanya untuk keperluan informasi</blockquote>`;

    // Free Fire API tidak menyediakan avatar, jadi langsung kirim teks saja
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(caption),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Free Fire Stalk Error:", err);
    
    let errorMessage = "<blockquote>⚠️ Error searching Free Fire profile.</blockquote>";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "<blockquote>⏱️ Request timeout. Try again later.</blockquote>";
    } else if (err.response?.status === 404) {
      errorMessage = `<blockquote>❌ Player ID "${query}" not found.</blockquote>`;
    }
    
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(errorMessage),
      parseMode: "html",
    });
  }
  return;
}

if (msg.senderId.toString() === myId && text.startsWith(".mlstalk")) {
  const query = text.split(" ").slice(1).join(" ").trim();
  if (!query) {
    await pian.sendMessage(msg.chatId, {
      message: withFooter("<blockquote>❌ Masukkan ID Mobile Legends (ID:Zona).\nContoh: .mlstalk 1343331387:15397</blockquote>"),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  // Split ID dan Zone
  let playerId, zoneId;
  if (query.includes(':')) {
    [playerId, zoneId] = query.split(':');
  } else if (query.includes('-')) {
    [playerId, zoneId] = query.split('-');
  } else {
    // Jika hanya ID tanpa zone, gunakan zone default atau minta format lengkap
    await pian.sendMessage(msg.chatId, {
      message: withFooter(`<blockquote>❌ Format salah. Gunakan format ID:Zona.\nContoh: .mlstalk 1343331387:15397\natau .mlstalk 1343331387-15397</blockquote>`),
      replyTo: msg.id,
      parseMode: "html",
    });
    return;
  }

  const waitMsg = await pian.sendMessage(msg.chatId, {
    message: withFooter(`<blockquote>🔍 Mencari profil ML: ${playerId}:${zoneId}</blockquote>`),
    replyTo: msg.id,
    parseMode: "html",
  });

  try {
    const { data } = await axios.get("https://api.deline.web.id/stalker/stalkml", {
      params: { 
        id: encodeURIComponent(playerId),
        zone: encodeURIComponent(zoneId)
      },
      timeout: 10000
    });

    if (!data.status || !data.result || !data.result.success) {
      await pian.editMessage(waitMsg.chatId, {
        message: waitMsg.id,
        text: withFooter(`<blockquote>❌ Tidak ditemukan profil Mobile Legends untuk "${playerId}:${zoneId}".\nPastikan ID dan Zona benar.</blockquote>`),
        parseMode: "html",
      });
      return;
    }

    const user = data.result;
    
    // Buat caption dengan informasi user
    let caption = `<blockquote>⚔️ Mobile Legends Profile Info</blockquote>\n\n`;
    
    // Informasi dasar
    caption += `<blockquote><b>🆔 Player ID:</b> ${playerId}\n`;
    caption += `<b>🌐 Zona:</b> ${zoneId}\n`;
    caption += `<b>👤 Username:</b> ${user.username}\n`;
    caption += `<b>📍 Region:</b> ${user.region}</blockquote>\n\n`;
    
    // Footer
    caption += `<blockquote>ℹ️ Gunakan <code>.mlstalk [id:zona]</code> untuk profil lain</blockquote>`;
    caption += `<blockquote>⚠️ Data hanya untuk keperluan informasi</blockquote>`;
    caption += `<blockquote>📝 Format: ID:Zona (contoh: 1343331387:15397)</blockquote>`;

    // Mobile Legends API tidak menyediakan avatar, jadi langsung kirim teks saja
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(caption),
      parseMode: "html",
    });

  } catch (err) {
    console.error("Mobile Legends Stalk Error:", err);
    
    let errorMessage = "<blockquote>⚠️ Error searching Mobile Legends profile.</blockquote>";
    
    if (err.code === 'ECONNABORTED') {
      errorMessage = "<blockquote>⏱️ Request timeout. Try again later.</blockquote>";
    } else if (err.response?.status === 404) {
      errorMessage = `<blockquote>❌ Player "${playerId}:${zoneId}" not found.</blockquote>`;
    } else if (err.response?.status === 400) {
      errorMessage = `<blockquote>❌ Format ID atau Zona salah.</blockquote>`;
    }
    
    await pian.editMessage(waitMsg.chatId, {
      message: waitMsg.id,
      text: withFooter(errorMessage),
      parseMode: "html",
    });
  }
  return;
}



// ======================== FITUR YANG BELUM BISA DIIMPLEMENTASI ========================
// Catatan: API berikut tidak bisa diakses atau tidak ada data sampel:
// - Genius Lyrics (tidak bisa diakses)
// - Pixiv (di luar scope)
// - Soundmeme (di luar scope)
// - Spotify Search (di luar scope)
// - TikTok Search (di luar scope)

// ======================== MENU SEARCH (.searchmenu) ========================
if (text === ".stalkmenu") {
    if (msg.senderId.toString() !== myId) return;

    const menu = `
<b>╔═════════════════════════════════╗
                           𝗖𝗔𝗬𝗡𝗡𝗠𝗔𝗖 - 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚═════════════════════════════════╝</b>
<pre>┌──────────────────┐         ┌──────────────────┐
│ .igstalk                         .mlstalk             │
│ .robloxstalk                     .ffstalk             │
│ .githubstalk                     .ttstalk             │
└──────────────────┘         └──────────────────┘
</pre>
`;

    try {
        if (global.thumbnail) {
            await pian.sendFile(msg.chatId, {
                file: global.thumbnail,
                caption: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        } else {
            await pian.sendMessage(msg.chatId, {
                message: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        }
    } catch (error) {
        console.error("Error sending menu:", error.message);
        await pian.sendMessage(msg.chatId, {
            message: menu + "\n\n❌ Gagal mengirim thumbnail, menggunakan teks saja.",
            replyTo: msg.id,
            parseMode: "html",
        });
    }

    return;
}

if (text === ".searchmenu") {
  if (msg.senderId.toString() !== myId) return;

  const menu = `
<b>╔═════════════════════════════════╗
                     𝗦𝗘𝗔𝗥𝗖𝗛 𝗠𝗘𝗡𝗨 - 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚═════════════════════════════════╝</b>
<pre>┌──────────────────┐         ┌──────────────────┐
│ .capcutsrch                     .igsrch               │
│ .playsrch                       .ytsrch               │
│ .herosrch                       .gbwasrch             │
│ .fdroidsrch                     .ttsrch               │
│ .pinsrch                        .spotifysrch          │
│ .npmsrch                        .douyinsrch           │
└──────────────────┘         └──────────────────┘
</pre>
`;

  try {
    if (global.thumbnail) {
      await pian.sendFile(msg.chatId, {
        file: global.thumbnail,
        caption: menu,
        replyTo: msg.id,
        parseMode: "html",
      });
    } else {
      await pian.sendMessage(msg.chatId, {
        message: menu,
        replyTo: msg.id,
        parseMode: "html",
      });
    }
  } catch (error) {
    console.error("Error sending search menu:", error.message);
    await pian.sendMessage(msg.chatId, {
      message: menu + "\n\n❌ Gagal mengirim thumbnail, menggunakan teks saja.",
      replyTo: msg.id,
      parseMode: "html",
    });
  }

  return;
}




if (text === ".cayn") {
    if (msg.senderId.toString() !== myId) return;

    const menu = `
<b>╔═════════════════════════════════╗
                           𝗖𝗔𝗬𝗡𝗡𝗠𝗔𝗖 - 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚═════════════════════════════════╝</b>
<pre>┌──────────────────┐         ┌──────────────────┐
│ .downloadmenu                    .searchmenu          │
│ .storemenu                       .stalkmenu           │
│ .groupmenu                       .epepmenu            │
└──────────────────┘         └──────────────────┘
</pre>
`;

    try {
        if (global.thumbnail) {
            await pian.sendFile(msg.chatId, {
                file: global.thumbnail,
                caption: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        } else {
            await pian.sendMessage(msg.chatId, {
                message: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        }
    } catch (error) {
        console.error("Error sending menu:", error.message);
        await pian.sendMessage(msg.chatId, {
            message: menu + "\n\n❌ Gagal mengirim thumbnail, menggunakan teks saja.",
            replyTo: msg.id,
            parseMode: "html",
        });
    }

    return;
}

if (text === ".downloadmenu") {
    if (msg.senderId.toString() !== myId) return;

    const menu = `
<b>╔═════════════════════════════════╗
                           𝗖𝗔𝗬𝗡𝗡𝗠𝗔𝗖 - 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚═════════════════════════════════╝</b>
<pre>┌──────────────────┐         ┌──────────────────┐
│ .tiktok                         .twitter              │
│ .instagram                      .videy                │
│ .mediafire                      .terabox              │
│ .spotify                        .gdrive               │
│ .capcut                         .pinterest            │
└──────────────────┘         └──────────────────┘
</pre>
`;

    try {
        if (global.thumbnail) {
            await pian.sendFile(msg.chatId, {
                file: global.thumbnail,
                caption: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        } else {
            await pian.sendMessage(msg.chatId, {
                message: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        }
    } catch (error) {
        console.error("Error sending menu:", error.message);
        await pian.sendMessage(msg.chatId, {
            message: menu + "\n\n❌ Gagal mengirim thumbnail, menggunakan teks saja.",
            replyTo: msg.id,
            parseMode: "html",
        });
    }

    return;
}

if (text === ".groupmenu") {
    if (msg.senderId.toString() !== myId) return;

    const menu = `
<b>╔═════════════════════════════════╗
                           𝗖𝗔𝗬𝗡𝗡𝗠𝗔𝗖 - 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚═════════════════════════════════╝</b>
<pre>┌──────────────────┐         ┌──────────────────┐
│ .tagall                         .joingb               │
│ .tagspam                        .cleargb              │
│ .zombies                        .ceklimitgb           │
│ .spam                           .addbl                │
│ .kick                           .delbl                │
└──────────────────┘         └──────────────────┘
</pre>
`;

    try {
        if (global.thumbnail) {
            await pian.sendFile(msg.chatId, {
                file: global.thumbnail,
                caption: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        } else {
            await pian.sendMessage(msg.chatId, {
                message: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        }
    } catch (error) {
        console.error("Error sending menu:", error.message);
        await pian.sendMessage(msg.chatId, {
            message: menu + "\n\n❌ Gagal mengirim thumbnail, menggunakan teks saja.",
            replyTo: msg.id,
            parseMode: "html",
        });
    }

    return;
}

if (text === ".storemenu") {
    if (msg.senderId.toString() !== myId) return;

    const menu = `
<b>╔═════════════════════════════════╗
                           𝗖𝗔𝗬𝗡𝗡𝗠𝗔𝗖 - 𝗨𝗦𝗘𝗥𝗕𝗢𝗧
╚═════════════════════════════════╝</b>
<pre>┌──────────────────┐         ┌──────────────────┐
│ .pay                            .cfd group/user       │
│ .addpay                         .cfd channel          │
│ .delpay                         .autocfd              │
│ .addqr                          .stopcfd              │
│ .done                           .gikes group/user     │
└──────────────────┘         └──────────────────┘
</pre>
`;

    try {
        if (global.thumbnail) {
            await pian.sendFile(msg.chatId, {
                file: global.thumbnail,
                caption: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        } else {
            await pian.sendMessage(msg.chatId, {
                message: menu,
                replyTo: msg.id,
                parseMode: "html",
            });
        }
    } catch (error) {
        console.error("Error sending menu:", error.message);
        await pian.sendMessage(msg.chatId, {
            message: menu + "\n\n❌ Gagal mengirim thumbnail, menggunakan teks saja.",
            replyTo: msg.id,
            parseMode: "html",
        });
    }

    return;
}

function watchFileAndReload(file) {
  fs.watchFile(file, (curr, prev) => {
    if (curr.mtime.getTime() !== prev.mtime.getTime()) {
      console.log(`• File update terdeteksi: ${path.basename(file)}`);
      try {
        delete require.cache[file];
        console.log("⚠️ PERHATIAN: Perubahan kode memerlukan restart proses Node.js secara manual.");
        console.log("Untuk menerapkan perubahan tanpa restart manual, ganti baris ini dengan 'process.exit(0);' (dapat menyebabkan downtime singkat).");
      } catch (err) {
        console.error(`❌ Gagal memuat ulang file ${path.basename(file)}:`, err.message);
      }
    }
  });
}
    },
    new NewMessage({})
  );
})();