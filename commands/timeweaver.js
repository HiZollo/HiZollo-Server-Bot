const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  type: 'CHAT_INPUT',
  name: 'timeweaver',
  description: '顯示跨日大師列表',
  async execute(interaction) {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 跨日中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (new Date().getUTCHours() === 15 && new Date().getUTCMinutes() === 59 && new Date().getUTCSeconds() >= 30) {
      res.setDescription('跨日大師重置中，請稍後再試')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    if (!interaction.client.timeweaver.data.length) {
      if (new Date().getUTCHours() === 16 && new Date().getUTCMinutes() < 10) {
        res.setFields({
          name: '本日',
          value: '還沒有跨日大師'
        })
      } else {
        res.setFields({
          name: '本日',
          value: '沒有跨日大師'
        })
      }
      return interaction.reply({ embeds: [res] })
    }
    
    res.setFields({
      name: '本日',
      value: interaction.client.timeweaver.data.map(id => `<@${id}>`).join('\n')
    })

    interaction.reply({ embeds: [res] })
  }

}
