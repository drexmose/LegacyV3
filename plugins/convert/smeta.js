

export default {
	name: ["smeta"],
	command: ["smeta"],
	tags: ["convert"],
	run: async (m, { conn, prefix, command, text, args }) => {
      var stiker = false
      try {
        
        let packId = config.Exif.packPublish
         let wm = config.Exif.wm
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''
        if (/webp/g.test(mime)) {
            let img = await q.download()
        var stiker = await exifAvatar(img, packId, wm)
      }
          } catch (e) {
        console.error(e)
        if (Buffer.isBuffer(e)) stiker = e
      } finally {
        if (stiker) conn.sendMessage(m.from, { sticker: stiker }, { quoted: m })
        else m.reply(`*Conversion failed*\nReply sticker with commands .smeta`)
    }
    }
}; 



const isUrl = (text) => text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'))

async function exifAvatar(buffer, packId, wm, categories = [''], extra = {}) {
  const { default: { Image }} = await import('node-webpmux')
  const img = new Image()
  const json = { 'sticker-pack-id': 'parel-kntll', 'sticker-pack-name': packId, 'sticker-pack-publisher': wm, 'emojis': categories, 'is-avatar-sticker': 1, ...extra }
  let exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
  let jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
  let exif = Buffer.concat([exifAttr, jsonBuffer])
  exif.writeUIntLE(jsonBuffer.length, 14, 4)
  await img.load(buffer)
   img.exif = exif
  return await img.save(null)
}