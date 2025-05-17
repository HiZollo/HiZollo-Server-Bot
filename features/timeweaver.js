const fs = require('fs')
const { Cron } = require('croner')

const DATA_PATH = './timeweaver.txt'
const TIME_WEAVER_ROLE_ID = '1262408334691274923'
const TIME_WEAVER_CHANNEL_IDS = {
  '572733182412193794': true,
  '774937521275666432': true
}

module.exports = (client, guildId) => {
  readTimeWeaverData(client)

  client.timeweaver.job = new Cron('30 59 23 * * *', { timezone: 'Asia/Taipei' }, () => {
    const guild = client.guilds.cache.get(guildId)
    const members = Promise.all(client.timeweaver.data.map(id => guild.members.fetch(id))).then(members => {
      members.forEach(async member => {
        await member.roles.remove(TIME_WEAVER_ROLE_ID)
      })
      client.timeweaver.data = []
      Object.keys(TIME_WEAVER_CHANNEL_IDS).forEach(key => TIME_WEAVER_CHANNEL_IDS[key] = false)
      writeTimeWeaverData(client)
    })

  })

  client.on('messageCreate', async message => {
    if (!Object.keys(TIME_WEAVER_CHANNEL_IDS).includes(message.channel.id)) return
    if (TIME_WEAVER_CHANNEL_IDS[message.channel.id]) return
    if (message.author.bot) return
    if (message.createdAt.getUTCHours() !== 16) return
    if (message.createdAt.getUTCMinutes() < 0 || message.createdAt.getUTCMinutes() > 9) return
    if (message.content !== '跨日大師') return

    TIME_WEAVER_CHANNEL_IDS[message.channel.id] = true
    if (client.timeweaver.data.includes(message.author.id)) return

    client.timeweaver.data.push(message.author.id)
    await message.member.roles.add(TIME_WEAVER_ROLE_ID)
    writeTimeWeaverData(client)
  })

}

function readTimeWeaverData(client) {
  try {
    fs.accessSync(DATA_PATH, fs.constants.F_OK);
    client.timeweaver.data = fs.readFileSync(DATA_PATH, 'utf8').split('\n').filter(line => line.trim())
  } catch(err) {
    client.timeweaver.data = []
  }

  if (!client.timeweaver.data.length) Object.keys(TIME_WEAVER_CHANNEL_IDS).forEach(key => TIME_WEAVER_CHANNEL_IDS[key] = false)
}

function writeTimeWeaverData(client) {
  fs.writeFileSync(DATA_PATH, client.timeweaver.data.join('\n'))
}
