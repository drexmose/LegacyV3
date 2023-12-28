export default {
  name: "afk",
  command: ["afk", "ak"], 
  tags: "group",
  run: async (m, { conn, text }) => {
let user = db.users[m.sender]
    user.afk = + new Date
    user.afkReason = text
    m.reply(`${conn.getName(m.sender)} is Now AFK${text ? ': ' + text : ''}`)
    }
  }