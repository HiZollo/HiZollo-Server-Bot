const https = require('https')

require('dotenv').config()
const  { TOKEN } = process.env

const GuildId = process.argv[2]

clear(TOKEN, GuildId)

async function clear(token, guild) {
  const { id } = await getDataByToken(token)
  const data = JSON.stringify([])
  const path = guild
    ? `/api/v9/applications/${id}/guilds/${guild}/commands`
    : `/api/v9/applications/${id}/commands`

  const req = https.request({
    protocol: 'https:',
    hostname: 'discord.com',
    path: path,
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      Authorization: `Bot ${token}`
    }
  }, response => {
    let r = ''

    response.on('data', (chunk) => {
        r += chunk
    })

    response.once('end', () => {
      if (response.statusCode !== 200) {
        console.error(JSON.parse(r))
        throw new Error('指令清除失敗')
      }

      console.log('成功清除指令')
      if (!guild) console.log('你清除的為全域指令，需等待一小時後才會作用至所有伺服器')
      else console.log('伺服器 ID：' + guild)
    })
  })

  req.write(data)
  req.end()
}

function getDataByToken(token) {
  return new Promise((resolve, reject) => {
    https.get('https://discord.com/api/v9/users/@me', {
      headers: {
        Authorization: `Bot ${token}`
      }
    }, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.once('end', () => {
        if (res.statusCode !== 200) return reject(JSON.parse(data))
        resolve(JSON.parse(data))
      })
    })
  })
}
