const { EmbedBuilder, MessageFlags } = require('discord.js')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'play',
  description: '播放一首歌',
  options: [{
    type: 'STRING',
    name: '網址',
    description: '播放對象的網址',
    required: true
  }],
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

    await interaction.deferReply()

    const query = interaction.options.getString('網址')

    try {
      await dj.play(interaction, query)
    } catch (err) {
      console.error(err)
      res.setDescription('播放時發生錯誤，可能是因為網址錯誤或是無法播放此網址的音樂')
      return interaction.followUp({ embeds: [res] })
    }

  }
}

