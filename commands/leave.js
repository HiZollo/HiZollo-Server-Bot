const { EmbedBuilder, MessageFlags } = require('discord.js')
const { getVoiceConnection } = require('@discordjs/voice')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'leave',
  description: '離開目前語音頻道',
  async execute(interaction) {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 音樂中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (!interaction.client.music.has(interaction.guild.id)) {
      res.setDescription('我又沒有在語音頻道，你要我退出什麼東西')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    const manager = interaction.client.music.get(interaction.guild.id)

    if (!interaction.member.voice.channel ||
        interaction.member.voice.channel.id !== manager.voiceChannel.id) {

      res.setDescription('你必須跟我在同個語音頻道才能使用此指令')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    manager.leave()
    res.setDescription(`已離開 ${interaction.member.voice.channel.name}`)
    interaction.reply({ embeds: [res] })
  }
}
