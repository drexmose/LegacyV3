import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from "url";
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import moment from 'moment-timezone';
moment.tz.setDefault("Asia/Jakarta").locale("id")

const sekarang = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')

export default {
	options: {
      public: true,
      antiCall: true, // reject call
      autoread: true, // auto read message
      database: "database.json", // End .json when using JSON database or use Mongo URI
      owner: ["62xxxxxxxxxx"], // set owner number on here
      pairing: "",
      sessionName: "session", // for name session
      prefix: /^[°•π÷×¶∆£¢€¥®™+✓_|/~!?@#%^&.©^]/i,
      pairingNumber: "", // Example Input : 62xxx
      pathPlugins: "plugins",
      wm: "*Source:* https://apiruulzz.my.id"
   },
   
   // Function Maybee
   reloadFile: (path) => reloadFile(path),
   
   // Rest APIs Cuy
   APIs: {
   	rull: "https://apiruulzz.my.id"
   },
   
   APIKeys: {
   	"https://apiruulzz.my.id": process.env.APIKEY || "rulz"
   },
   
   // Set pack name sticker on here
   Exif: {
      wm: "Rulzz",
      packId: "https://apiruulzz.my.id",
      packName: null,
      packPublish: '         Rulz. - Assistant\n      ——————————————\n\nCreated on date:\n' + sekarang,
      packEmail: "rullskeyy@gmail.com",
      packWebsite: "https://apiruulzz.my.id",
      androidApp: "https://play.google.com/store/apps/details?id=com.bitsmedia.android.muslimpro",
      iOSApp: "https://apps.apple.com/id/app/muslim-pro-al-quran-adzan/id388389451?|=id",
      emojis: [],
      isAvatar: 0,
   },

   // message  response awikwok there
   msg: {
      owner: "Features can only be accessed owner!",
      group: "Features only accessible in group!",
      private: "Features only accessible private chat!",
      admin: "Features can only be accessed by group admin!",
      botAdmin: "Bot is not admin, can't use the features!",
      bot: "Features only accessible by me",
      media: "Reply media...",
      query: "Enter Query!",
      noUrl: "please input a url.",
      error: "An error occurred while retrieving data.",
      quoted: "Reply message...",
      wait: "Wait a minute...",
      urlInvalid: "Url Invalid",
      notFound: "Result Not Found!",
      premium: "Premium Only Features!"
   }
};

async function reloadFile(file) {
  let fileP = fileURLToPath(file);
  fs.watchFile(fileP, () => {
    fs.unwatchFile(fileP);
    console.log(chalk.green(`[ UPDATE ] file => "${fileP}"`));
    import(`${file}?update=${Date.now()}`);
  });
}

reloadFile(import.meta.url);