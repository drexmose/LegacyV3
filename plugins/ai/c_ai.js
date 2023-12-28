export default {
  name: ["klee", "erza"],
  command: ["klee", "erza"],
  tags: ["ai"],
  use: "Yes, what is up?",
  run: async (m, { command }) => {
    try {
      let response;
      switch (command) {
        case "klee":
          response = await Func.fetchJson(
            global.API("rull", "/api/tools/c-ai",
              {
                model: "Klee",
                query: m.text,
              },
              "apikey",
            ),
          );
          break;
        case "erza":
          response = await Func.fetchJson(
            global.API("rull", "/api/tools/c-ai",
              {
                model: "Erza",
                query: m.text,
              },
              "apikey",
            ),
          );
          break;
        default:
      }
      if (response.status !== 200) return m.reply(Func.format(response.result))
      m.reply(response.result);
    } catch (e) {
      console.error(e);
      m.reply(config.msg.error);
    }
  },
};
