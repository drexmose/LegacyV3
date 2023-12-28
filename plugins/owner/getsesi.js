import fs from 'fs';
import path from 'path';

export default {
  name: "gsesi",
  command: ["gsesi"],
  tags: ["owner"],
  run: async (m, { conn, text}) => {
    
    let sesi = await fs.readFileSync("./system/temp/session/creds.json");

    conn.sendMessage(m.from, {document:sesi, mimetype: 'application/json', fileName: 'creds.json'}, {quoted: m})
    return m.reply('that s my bot session:v')
  },
  owner: true,
};