const { Client, Collection, GatewayIntentBits } = require('discord.js')
const { readdirSync } = require('fs')
require('dotenv').config()

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
  allowedMentions: { parse: ['users'] }
})

client.commands = new Collection()
client.autocomplete = new Collection()
client.music = new Collection()
client.settings = require('./settings.json')

function loadCommands(manager, dir = './commands') {
  const commandFiles = readdirSync(dir).filter(file => file.endsWith('.js'))

  for (const file of commandFiles) {
    const command = require(`${dir}/${file}`)
    manager.set(command.name, command)
  }

}

loadCommands(client.commands)

const autocompleteFiles = readdirSync('./autocomplete').filter(file => file.endsWith('.js'))
for (const file of autocompleteFiles) {
	const autocomplete = require(`./autocomplete/${file}`)
  client.autocomplete.set(autocomplete.name, autocomplete)
}

client.on('ready', () => {
  console.log(`${GREEN}[PROCESS]${RESET} Bot 已上線`)
  require('./features/presence.js')(client)
})

client.on('interactionCreate', interaction => {
  if (interaction.isCommand()) return commandHandler(interaction)
  if (interaction.isAutocomplete()) return autocompleteHandler(interaction)
})

function commandHandler(interaction) {
  const { commandName } = interaction
  const command = client.commands.get(commandName)

  if (!command) interaction.reply({
    content: '找不到指令',
    ephemeral: true
  })

  command.execute(interaction)
    .then(() => {
      console.log(`${GREEN}[PROCESS]${RESET} 執行指令：${command.name}`)
    })
    .catch(onError)
}

function autocompleteHandler(interaction) {
  const { commandName } = interaction
  const { name } = interaction.options.getFocused(true)
  client.autocomplete.get(commandName)[name](interaction)
}

function onError(err) {
  console.error(`${GREEN}[PROCESS]${RESET} ${RED}出現錯誤：${RESET}`)
  console.error(err)
}

client.on('error', onError)
process.on('uncaughtException', onError)

client.login(process.env.TOKEN)
