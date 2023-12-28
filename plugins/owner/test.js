export default {
	name: ["test"],
	command: ["test", "bot", "tesbot"],
	tags: ["owner"],
	run: async (m, { conn }) => {
		return m.reply("The Bot s Active ⚡")
	}
};