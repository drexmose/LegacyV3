import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import baileys from '@whiskeysockets/baileys';
import Jimp from 'jimp';
import { parsePhoneNumber } from 'libphonenumber-js';
import PhoneNumber from 'awesome-phonenumber';
import Crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

import { writeExif } from './sticker.js';
import config from '../../config.js';
import Function from './function.js';

const {
  jidNormalizedUser,
  proto,
  areJidsSameUser,
  extractMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
  toBuffer,
  getDevice,
} = baileys;

function Client({ conn, store }) {
  delete store.groupMetadata;

  // Combining Store to Client
  for (let v in store) {
    conn[v] = store[v];
  }

  const client = Object.defineProperties(conn, {
    getContentType: {
      value(content) {
        if (content) {
          const keys = Object.keys(content);
          const key = keys.find(
            (k) =>
              (k === "conversation" ||
                k.endsWith("Message") ||
                k.endsWith("V2") ||
                k.endsWith("V3")) &&
              k !== "senderKeyDistributionMessage",
          );
          return key;
        }
      },
      enumerable: true,
    },

    decodeJid: {
      value(jid) {
        if (/:\d+@/gi.test(jid)) {
          const decode = jidNormalizedUser(jid);
          return decode;
        } else return jid;
      },
    },

    generateMessageID: {
      value(id = "3EB0", length = 18) {
        return id + Crypto.randomBytes(length).toString("hex").toUpperCase();
      },
    },

    getName: {
       value(jid) {
          let id = conn.decodeJid(jid)
          let v
          if (id?.endsWith("@g.us")) return new Promise(async (resolve) => {
             v = conn.contacts[id] || conn.messages["status@broadcast"]?.array?.find(a => a?.key?.participant === id)
             if (!(v.name || v.subject)) v = conn.groupMetadata[id] || {}
             resolve(v?.name || v?.subject || v?.pushName || (parsePhoneNumber('+' + id.replace("@g.us", "")).format("INTERNATIONAL")))
          })
          else v = id === "0@s.whatsapp.net" ? {
             id,
             name: "WhatsApp"
          } : id === conn.decodeJid(conn?.user?.id) ?
             conn.user : (conn.contacts[id] || {})
          return (v?.name || v?.subject || v?.pushName || v?.verifiedName || (parsePhoneNumber('+' + id.replace("@s.whatsapp.net", "")).format("INTERNATIONAL")))
       }
    },

    sendContact: {
       async value(jid, number, quoted, options = {}) {
          let list = []
          for (let v of number) {
             list.push({
                displayName: await conn.getName(v),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(v + "@s.whatsapp.net")}\nFN:${await conn.getName(v + "@s.whatsapp.net")}\nitem1.TEL;waid=${v}:${v}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:${config.Exif.packEmail}\nitem2.X-ABLabel:Email\nitem3.URL:${config.Exif.packWebsite}\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
             })
          }
          return conn.sendMessage(jid, {
             contacts: {
                displayName: `${list.length} Contact`,
                contacts: list
             },
             mentions: quoted?.participant ? [conn.decodeJid(quoted?.participant)] : [conn.decodeJid(conn?.user?.id)],
             ...options
          }, { quoted, ...options })
       },
       enumerable: true
    },

    parseMention: {
      value(text) {
        return (
          [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
            (v) => v[1] + "@s.whatsapp.net",
          ) || []
        );
      },
    },

    sendContact2: {
      /**
       * Send Contact
       * @param {String} jid 
       * @param {String[][]|String[]} data
       * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted 
       * @param {Object} options 
       */
      async value(jid, data, quoted, options) {
          if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
          const contacts = []
          for (let [number, name] of data) {
              number = number.replace(/[^0-9]/g, '')
              let njid = number + '@s.whatsapp.net'
              let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {}
              let vcard = `
    BEGIN:VCARD
    VERSION:3.0
    N:;${name.replace(/\n/g, '\\n')};;;
    FN:${name.replace(/\n/g, '\\n')}
    TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `
    X-WA-BIZ-NAME:${(store.getContact(njid)?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
    X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
    `.trim() : ''}
    END:VCARD
    `.trim()
              contacts.push({ vcard, displayName: name })

          }
          return await conn.sendMessage(jid, {
              ...options,
              contacts: {
                  ...options,
                  displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                  contacts,
              }
          }, { quoted, ...options })
      },
      enumerable: true,
      writable: true,
    },


    sendContactArray: {
        async value(jid, data, quoted, options) {
            if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data]
                    let contacts = []
            for (let [number, name, isi, isi1, isi2, isi3, isi4, isi5] of data) {
                number = number.replace(/[^0-9]/g, '')
                let njid = number + '@s.whatsapp.net'
                let biz = await conn.getBusinessProfile(njid).catch(_ => null) || {}
                // N:;${name.replace(/\n/g, '\\n').split(' ').reverse().join(';')};;;
                let vcard = `
    BEGIN:VCARD
    VERSION:3.0
    N:Sy;Bot;;;
    FN:${name.replace(/\n/g, '\\n')}
    item.ORG:${isi}
    item1.TEL;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
    item1.X-ABLabel:${isi1}
    item2.EMAIL;type=INTERNET:${isi2}
    item2.X-ABLabel:📧 Email
    item3.ADR:;;${isi3};;;;
    item3.X-ABADR:ac
    item3.X-ABLabel:📍 Region
    item4.URL:${isi4}
    item4.X-ABLabel:Website
    item5.X-ABLabel:${isi5}
    END:VCARD`.trim()
                contacts.push({ vcard, displayName: name })
            }
            return await conn.sendMessage(jid, {
                contacts: {
                    displayName: (contacts.length > 1 ? `2013 kontak` : contacts[0].displayName) || null,
                    contacts,
                }
            },
            {
                quoted,
                ...options
            })
            }
        },

    
    downloadMediaMessage: {
      async value(message, filename) {
        let mime = {
          imageMessage: "image",
          videoMessage: "video",
          stickerMessage: "sticker",
          documentMessage: "document",
          audioMessage: "audio",
          ptvMessage: "video",
        }[message.type];

        if ("thumbnailDirectPath" in message.msg && !("url" in message.msg)) {
          message = {
            directPath: message.msg.thumbnailDirectPath,
            mediaKey: message.msg.mediaKey,
          };
          mime = "thumbnail-link";
        } else {
          message = message.msg;
        }

        return await toBuffer(await downloadContentFromMessage(message, mime));
      },
      enumerable: true,
    },
    
    updateProfileStatus: {
      async value(status) {
        return conn.query({
          tag: 'iq',
          attrs: {
            to: 's.whatsapp.net',
            type: 'set',
            xmlns: 'status',
          },
          content: [{
            tag: 'status',
            attrs: {},
            content: Buffer.from(status, 'utf-8')
          }]
        })
      }
    },

    sendMedia: {
      async value(jid, url, quoted = "", options = {}) {
        let { mime, data: buffer, ext, size } = await Function.getFile(url);
        mime = options?.mimetype ? options.mimetype : mime;
        let data = { text: "" },
          mimetype = /audio/i.test(mime) ? "audio/mpeg" : mime;
        if (size > 45000000)
          data = {
            document: buffer,
            mimetype: mime,
            fileName: options?.fileName
              ? options.fileName
              : `${conn.user?.name} (${new Date()}).${ext}`,
            ...options,
          };
        else if (options.asDocument)
          data = {
            document: buffer,
            mimetype: mime,
            fileName: options?.fileName
              ? options.fileName
              : `${conn.user?.name} (${new Date()}).${ext}`,
            ...options,
          };
        else if (options.asSticker || /webp/.test(mime)) {
          let pathFile = await writeExif(
            { mimetype, data: buffer },
            { ...options },
          );
          data = {
            sticker: fs.readFileSync(pathFile),
            mimetype: "image/webp",
            ...options,
          };
          fs.existsSync(pathFile) ? await fs.promises.unlink(pathFile) : "";
        } else if (/image/.test(mime))
          data = {
            image: buffer,
            mimetype: options?.mimetype ? options.mimetype : "image/png",
            ...options,
          };
        else if (/video/.test(mime))
          data = {
            video: buffer,
            mimetype: options?.mimetype ? options.mimetype : "video/mp4",
            ...options,
          };
        else if (/audio/.test(mime))
          data = {
            audio: buffer,
            mimetype: options?.mimetype ? options.mimetype : "audio/mpeg",
            ...options,
          };
        else data = { document: buffer, mimetype: mime, ...options };
        let msg = await conn.sendMessage(jid, data, { quoted, ...options });
        return msg;
      },
      enumerable: true,
    },

    resize: {
      value(buffer, ukur1, ukur2) {
        return new Promise(async (resolve, reject) => {
          var baper = await Jimp.read(buffer);
          var ab = await baper
            .resize(ukur1, ukur2)
            .getBufferAsync(Jimp.MIME_JPEG);
          resolve(ab);
        });
      },
    },

    cMod: {
      value(jid, copy, text = "", sender = conn.user.id, options = {}) {
        let mtype = conn.getContentType(copy.message);
        let content = copy.message[mtype];
        if (typeof content === "string") copy.message[mtype] = text || content;
        else if (content.caption) content.caption = text || content.text;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== "string") {
          copy.message[mtype] = { ...content, ...options };
          copy.message[mtype].contextInfo = {
            ...(content.contextInfo || {}),
            mentionedJid:
              options.mentions || content.contextInfo?.mentionedJid || [],
          };
        }
        if (copy.key.participant)
          sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes("@s.whatsapp.net"))
          sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes("@broadcast"))
          sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id);
        return proto.WebMessageInfo.fromObject(copy);
      },
    },

    sendPoll: {
      async value(chatId, name, values, options = {}) {
        let selectableCount = options?.selectableCount
          ? options.selectableCount
          : 1;
        return await conn.sendMessage(
          chatId,
          {
            poll: {
              name,
              values,
              selectableCount,
            },
            ...options,
          },
          { ...options },
        );
      },
      enumerable: true,
    },

    setProfilePicture: {
      async value(jid, media, type = "full") {
        let { data } = await Function.getFile(media);
        if (/full/i.test(type)) {
          data = await Function.resizeImage(media, 720);
          await conn.query({
            tag: "iq",
            attrs: {
              to: await conn.decodeJid(jid),
              type: "set",
              xmlns: "w:profile:picture",
            },
            content: [
              {
                tag: "picture",
                attrs: { type: "image" },
                content: data,
              },
            ],
          });
        } else {
          data = await Function.resizeImage(media, 640);
          await conn.query({
            tag: "iq",
            attrs: {
              to: await conn.decodeJid(jid),
              type: "set",
              xmlns: "w:profile:picture",
            },
            content: [
              {
                tag: "picture",
                attrs: { type: "image" },
                content: data,
              },
            ],
          });
        }
      },
      enumerable: true,
    },

    sendGroupV4Invite: {
      async value(
        jid,
        groupJid,
        inviteCode,
        inviteExpiration,
        groupName,
        jpegThumbnail,
        caption = "Invitation to join my WhatsApp Group",
        options = {},
      ) {
        const media = await prepareWAMessageMedia(
          { image: (await Function.getFile(jpegThumbnail)).data },
          { upload: conn.waUploadToServer },
        );
        const message = proto.Message.fromObject({
          groupJid,
          inviteCode,
          inviteExpiration: inviteExpiration
            ? parseInt(inviteExpiration)
            : +new Date(new Date() + 3 * 86400000),
          groupName,
          jpegThumbnail: media.imageMessage?.jpegThumbnail || jpegThumbnail,
          caption,
        });

        const m = generateWAMessageFromContent(jid, message, {
          userJid: conn.user?.id,
        });
        await conn.relayMessage(jid, m.message, { messageId: m.key.id });

        return m;
      },
      enumerable: true,
    },

    sendFile: {
      async value(
        jid,
        PATH,
        caption = "",
        fileName,
        quoted,
        ptt = false,
        options = {},
      ) {
        let types = await Function.getFile(PATH);
        let { filename, size, ext, mime, data } = types;
        let type = "",
          mimetype = mime,
          pathFile = filename;
        if (options.asDocument) type = "document";
        if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require("./sticker.js");
          let media = { mimetype: mime, data };
          pathFile = await writeExif(media, {
            packname: global.packname,
            author: global.packname,
            categories: options.categories ? options.categories : [],
          });
          await fs.promises.unlink(filename);
          type = "sticker";
          mimetype = "image/webp";
        } else if (/image/.test(mime)) type = "image";
        else if (/video/.test(mime)) type = "video";
        else if (/audio/.test(mime)) type = "audio";
        else type = "document";
        await conn.sendMessage(
          jid,
          {
            [type]: data,
            caption: caption,
            mimetype,
            fileName,
            ...options,
          },
          { quoted, ...options },
        );
      },
    },
  });

  return conn;
}

async function serialize(conn, msg) {
  const m = {};
  const botNumber = conn.decodeJid(conn.user?.id);

  if (!msg.message) return; // ignore those that don't contain messages
  if (msg.key && msg.key.remoteJid == "status@broadcast") return; // Ignore messages from status

  m.message = extractMessageContent(msg.message);

  if (msg.key) {
    m.key = msg.key;
    m.from = conn.decodeJid(m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.id = m.key.id;
    m.device = getDevice(m.id);
    m.isBaileys = m.id.startsWith("BAE5");
    m.isGroup = m.from.endsWith("@g.us");
    m.participant = !m.isGroup ? false : m.key.participant;
    m.sender = conn.decodeJid(
      m.fromMe ? conn.user.id : m.isGroup ? m.participant : m.from,
    );
  }

  m.pushName = msg.pushName;
  m.isOwner =
    m.sender &&
    [...config.options.owner, botNumber.split`@`[0]].includes(
      m.sender.replace(/\D+/g, ""),
    );
  if (m.isGroup) {
    m.metadata = await conn.groupMetadata(m.from);
    m.admins = m.metadata.participants.reduce(
      (memberAdmin, memberNow) =>
        (memberNow.admin
          ? memberAdmin.push({ id: memberNow.id, admin: memberNow.admin })
          : [...memberAdmin]) && memberAdmin,
      [],
    );
    m.isAdmin = !!m.admins.find((member) => member.id === m.sender);
    m.isBotAdmin = !!m.admins.find((member) => member.id === botNumber);
  }

  if (m.message) {
    m.type = conn.getContentType(m.message) || Object.keys(m.message)[0];
    m.msg = extractMessageContent(m.message[m.type]) || m.message[m.type];
    m.mentions = m.msg?.contextInfo?.mentionedJid || [];
    m.body =
      m.msg?.text ||
      m.msg?.conversation ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.selectedButtonId ||
      m.msg?.singleSelectReply?.selectedRowId ||
      m.msg?.selectedId ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      m.msg?.name ||
      "";
    m.prefix = config.options.prefix.test(m.body)
      ? m.body.match(config.options.prefix)[0]
      : "#";
    m.command =
      m.body && m.body.replace(m.prefix, "").trim().split(/ +/).shift();
    m.arg =
      m.body
        .trim()
        .split(/ +/)
        .filter((a) => a) || [];
    m.args =
      m.body
        .trim()
        .replace(new RegExp("^" + Function.escapeRegExp(m.prefix), "i"), "")
        .replace(m.command, "")
        .split(/ +/)
        .filter((a) => a) || [];
    m.text = m.args.join(" ");
    m.expiration = m.msg?.contextInfo?.expiration || 0;
    m.timestamp =
      (typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp
        : msg.messageTimestamp.low
          ? msg.messageTimestamp.low
          : msg.messageTimestamp.high) || m.msg.timestampMs * 1000;
    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;
    if (m.isMedia) {
      m.mime = m.msg?.mimetype;
      m.size = m.msg?.fileLength;
      m.height = m.msg?.height || "";
      m.width = m.msg?.width || "";
      if (/webp/i.test(m.mime)) {
        m.isAnimated = m.msg?.isAnimated;
      }
    }
    m.reply = async (text, options = {}) => {
      let chatId = options?.from ? options.from : m.from;
      let quoted = options?.quoted ? options.quoted : m;

      if (
        Buffer.isBuffer(text) ||
        /^data:.?\/.*?;base64,/i.test(text) ||
        /^https?:\/\//.test(text) ||
        fs.existsSync(text)
      ) {
        let data = await Function.getFile(text);
        if (
          !options.mimetype &&
          (/utf-8|json/i.test(data.mime) || data.ext == ".bin" || !data.ext)
        ) {
          return conn.sendMessage(
            chatId,
            {
              text,
              mentions: [m.sender, ...conn.parseMention(text)],
              ...options,
            },
            { quoted, ephemeralExpiration: m.expiration, ...options },
          );
        } else {
          return conn.sendMedia(m.from, data.data, quoted, {
            ephemeralExpiration: m.expiration,
            ...options,
          });
        }
      } else {
        return conn.sendMessage(
          chatId,
          {
            text,
            mentions: [m.sender, ...conn.parseMention(text)],
            ...options,
          },
          { quoted, ephemeralExpiration: m.expiration, ...options },
        );
      }
    };
    m.download = (filepath) => {
      if (filepath) return conn.downloadMediaMessage(m, filepath);
      else return conn.downloadMediaMessage(m);
    };
  }

  // quoted line
  m.isQuoted = false;
  if (m.msg?.contextInfo?.quotedMessage) {
    m.isQuoted = true;
    m.quoted = {};
    m.quoted.message = extractMessageContent(m.msg?.contextInfo?.quotedMessage);

    if (m.quoted.message) {
      m.quoted.type =
        conn.getContentType(m.quoted.message) ||
        Object.keys(m.quoted.message)[0];
      m.quoted.msg =
        extractMessageContent(m.quoted.message[m.quoted.type]) ||
        m.quoted.message[m.quoted.type];
      m.quoted.key = {
        remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
        participant: m.msg?.contextInfo?.remoteJid?.endsWith("g.us")
          ? conn.decodeJid(m.msg?.contextInfo?.participant)
          : false,
        fromMe: areJidsSameUser(
          conn.decodeJid(m.msg?.contextInfo?.participant),
          conn.decodeJid(conn?.user?.id),
        ),
        id: m.msg?.contextInfo?.stanzaId,
      };
      m.quoted.from = m.quoted.key.remoteJid;
      m.quoted.fromMe = m.quoted.key.fromMe;
      m.quoted.id = m.msg?.contextInfo?.stanzaId;
      m.quoted.device = getDevice(m.quoted.id);
      m.quoted.isBaileys = m.quoted.id.startsWith("BAE5");
      m.quoted.isGroup = m.quoted.from.endsWith("@g.us");
      m.quoted.participant = m.quoted.key.participant;
      m.quoted.sender = conn.decodeJid(m.msg?.contextInfo?.participant);

      m.quoted.isOwner =
        m.quoted.sender &&
        [...config.options.owner, botNumber.split`@`[0]].includes(
          m.quoted.sender.replace(/\D+/g, ""),
        );
      if (m.quoted.isGroup) {
        m.quoted.metadata = await conn.groupMetadata(m.quoted.from);
        m.quoted.admins = m.quoted.metadata.participants.reduce(
          (memberAdmin, memberNow) =>
            (memberNow.admin
              ? memberAdmin.push({ id: memberNow.id, admin: memberNow.admin })
              : [...memberAdmin]) && memberAdmin,
          [],
        );
        m.quoted.isAdmin = !!m.quoted.admins.find(
          (member) => member.id === m.quoted.sender,
        );
        m.quoted.isBotAdmin = !!m.quoted.admins.find(
          (member) => member.id === botNumber,
        );
      }

      m.quoted.mentions = m.quoted.msg?.contextInfo?.mentionedJid || [];
      m.quoted.body =
        m.quoted.msg?.text ||
        m.quoted.msg?.caption ||
        m.quoted?.message?.conversation ||
        m.quoted.msg?.selectedButtonId ||
        m.quoted.msg?.singleSelectReply?.selectedRowId ||
        m.quoted.msg?.selectedId ||
        m.quoted.msg?.contentText ||
        m.quoted.msg?.selectedDisplayText ||
        m.quoted.msg?.title ||
        m.quoted?.msg?.name ||
        "";
      m.quoted.prefix = config.options.prefix.test(m.quoted.body)
        ? m.quoted.body.match(config.options.prefix)[0]
        : "#";
      m.quoted.command =
        m.quoted.body &&
        m.quoted.body.replace(m.quoted.prefix, "").trim().split(/ +/).shift();
      m.quoted.arg =
        m.quoted.body
          .trim()
          .split(/ +/)
          .filter((a) => a) || [];
      m.quoted.args =
        m.quoted.body
          .trim()
          .replace(
            new RegExp("^" + Function.escapeRegExp(m.quoted.prefix), "i"),
            "",
          )
          .replace(m.quoted.command, "")
          .split(/ +/)
          .filter((a) => a) || [];
      m.quoted.text = m.quoted.args.join(" ");
      m.quoted.isMedia =
        !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
      if (m.quoted.isMedia) {
        m.quoted.mime = m.quoted.msg?.mimetype;
        m.quoted.size = m.quoted.msg?.fileLength;
        m.quoted.height = m.quoted.msg?.height || "";
        m.quoted.width = m.quoted.msg?.width || "";
        if (/webp/i.test(m.quoted.mime)) {
          m.quoted.isAnimated = m?.quoted?.msg?.isAnimated || false;
        }
      }
      m.quoted.reply = (text, options = {}) => {
        return m.reply(text, { quoted: m.quoted, ...options });
      };
      m.quoted.download = (filepath) => {
        if (filepath) return conn.downloadMediaMessage(m.quoted, filepath);
        else return conn.downloadMediaMessage(m.quoted);
      };
    }
  }

  return m;
}

export {
  Client,
  serialize,
};
