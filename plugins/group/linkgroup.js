export default {
	name: "linkgc",
	command: ["linkgc"],
	tags: ["group"],
	run: async (m, { conn }) => {
		await m.reply("https://chat.whatsapp.com/" + await conn.groupInviteCode(m.from))
	},
	admin: true,
  group: true,
};