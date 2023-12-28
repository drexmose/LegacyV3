export default {
	name: ["ai", "blackbox", "bard", "pizza"],
	command: ["ai", "blackbox", "bard", "pizza"],
	tags: ["ai"],
	use: "Yes can I help you?",
	run: async (m, { conn, command }) => {
		try {
			let response 
			switch (command) {
				case "blackbox": 
				  response = await Func.axios.get(global.API("rull", "/api/tools/blackbox", { query: m.text }, "apikey"))
				  break;
				case "bard": 
				  response = await Func.axios.get(global.API("rull", "/api/tools/gbard", { query: m.text }, "apikey"))
				  break;
				case "pizza": 
				  response = await Func.axios.get(global.API("rull", "/api/tools/pizzagpt", { query: m.text }, "apikey"))
				  break;
				  default: 
			}
			response = response.data
			if (response.status !== 200) return m.reply(Func.format(response))
			await m.reply(response.result)
		} catch (e) {
			console.error(e)
			await m.reply(config.msg.error) 
		}
	}
};