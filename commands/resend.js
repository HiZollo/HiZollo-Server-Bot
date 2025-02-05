const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  type: 'CHAT_INPUT',
  name: 'resend',
  description: '重新傳送音樂遙控器',
  async execute(interaction) {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 音樂中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (!interaction.client.music.has(interaction.guild.id)) {
      res.setDescription('我還不在任何語音頻道中，請先讓我加入一個！')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    const dj = interaction.client.music.get(interaction.guild.id)

    if (!interaction.member.voice.channel ||
        interaction.member.voice.channel.id !== dj.voiceChannel.id) {

      res.setDescription('你必須跟我在同個語音頻道才能使用此指令');
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    try {
      await dj.controller.resend()
      res.setDescription('音樂遙控器已重新傳送')
      return interaction.followUp({ embeds: [res] })
    } catch (err) {
      console.error(err)
      res.setDescription('重新傳送時發生錯誤')
      return interaction.followUp({ embeds: [res] })
    }
  }
}

