export default {
	name: "join",
	command: ["join"],
	tags: ["group"],
	run: async (m, { conn, text }) => {
    let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})( [0-9]{1,3})?/i
    const isNumber = (x) => (x = parseInt(x), typeof x === 'number' && !isNaN(x))
    let expired = '1'
        if (!m.quoted?.text) return m.reply('Invalid Code')
        let res = await conn.groupAcceptInvite(m.text)
        expired = Math.floor(Math.min(999, Math.max(1, isOwner ? (isNumber(expired) ? parseInt(expired) : 0) : 3)))
        m.reply(`Berhasil join grup ${res}${expired ? ` selama ${expired} hari` : ''}`)
        let chats = global.db.chats[res]
        if (!chats) chats = global.db.chats[res] = {}
        if (expired) chats.expired = +new Date() + expired * 1000 * 60 * 60 * 24
    
	},
	owner: true 
}