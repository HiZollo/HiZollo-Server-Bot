const https = require('node:https')
const fs = require('node:fs')

require('dotenv').config()
const  { TOKEN } = process.env

const command_type_resolve = {
  "CHAT_INPUT": 1,
  "USER": 2,
  "MESSAGE": 3
}

const option_type_resolve = {
  "SUB_COMMAND": 1,
  "SUB_COMMAND_GROUP": 2,
  "STRING": 3,
  "INTEGER": 4,
  "BOOLEAN": 5,
  "USER": 6,
  "CHANNEL": 7,
  "ROLE": 8,
  "MENTIONABLE": 9,
  "NUMBER": 10
}

const GuildId = process.argv[2]
const commands = []

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`../commands/${file}`)

  const data = {
    type: command_type_resolve[command.type],
    name: command.name,
    description: command.description
  }

  if (command.options) {
    data.options = []
    makeOptions(data.options, command.options)
  }

  commands.push(data)
}

const data = JSON.stringify(commands)

deploy(TOKEN, data, GuildId)

async function deploy(token, commandData, guild) {
  const { id } = await getDataByToken(token)
    .catch(err => {
      console.error(err)
      throw err
    })

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
      "Content-Length": Buffer.byteLength(commandData),
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
        throw new Error('指令部署失敗')
      }

      console.log('成功部署指令')
      if (!guild) console.log('你部署的為全域指令，需等待一小時後才會作用至所有伺服器')
      else console.log('伺服器 ID：' + guild)
    })
  })

  req.write(commandData)
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

function resolveOptions(option) {
  const data = {
    type: option_type_resolve[option.type],
    name: option.name,
    description: option.description,
    // 以下可能缺項，但 JSON.stringify 會幫我們拿掉
    required: option.required,
    choices: option.choices,
    channel_types: option.channelTypes,
    min_value: option.minValue,
    max_value: option.maxValue,
    min_length: option.minLength,
    max_length: option.maxLength,
    autocomplete: option.autocomplete
  }

  return data
}

function makeOptions(container, options) {
  for (const option of options) {
    const option_data = resolveOptions(option)

    if (option.options?.length) {
      option_data.options = []
      makeOptions(option_data.options, option.options)
    }

    container.push(option_data)
  }
}

