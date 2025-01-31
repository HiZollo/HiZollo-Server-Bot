const { Client, GatewayIntentBits } = require('discord.js')
require('dotenv').config()

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  allowedMentions: { parse: ['users'] }
})

client.on('ready', () => {
  console.log('Bot is ready')
})

client.login(process.env.TOKEN)
