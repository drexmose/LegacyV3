let { getDevice } = require("@whiskeysockets/baileys");

export default {
  name: "device",
  command: ["device"],
  tags: ["tools"],
  run: async (m, { conn }) => {
    m.reply(await getDevice(m.quoted ? m.quoted.id : m.key.id))
  },
  group: true, 
};
 