const { EmbedBuilder, MessageFlags } = require('discord.js')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'remove',
  description: '將指定數量的歌從隊列中移除',
  options: [{
    type: 'INTEGER',
    name: '起始歌曲編號',
    description: '要從哪一首歌開始移除（預設為 1）',
    minValue: 1
  }, {
    type: 'INTEGER',
    name: '結尾歌曲編號',
    description: '要移除到哪一首歌（預設和起始歌曲編號相同）',
    minValue: 1
  }],
  async execute(interaction) {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 音樂中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (!interaction.client.music.has(interaction.guild.id)) {
      res.setDescription('我並沒有在任何語音頻道內，你是不是搞錯了什麼')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    const dj = interaction.client.music.get(interaction.guild.id)

    if (!interaction.member.voice.channelId || interaction.member.voice.channelId !== dj.voiceChannel.id) {
      res.setDescription('你必須要和我在同個語音頻道中才能使用此指令！')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    if (!dj.queue.length) {
      res.setDescription('我想隊列應該已經沒有東西可以被移除了，你要不要檢查看看？')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    const start = interaction.options.getInteger('起始歌曲編號') ?? 1
    const end = Math.min(interaction.options.getInteger('結尾歌曲編號') ?? start, dj.queue.length)

    console.log(start, end)
    
    if (start > end) {
      res.setDescription('結尾怎麼會小於開頭呢？這樣怎麼對？')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    if (dj.queue.length < start) {
      res.setDescription('我不覺得有這個編號的歌的存在，請檢查一下播放清單或是你的眼睛')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    await interaction.deferReply()
    dj.queue.splice(start - 1, end - start + 1)

    const content = start === end ? `已移除編號為 ${start} 的歌曲` : `已移除編號在 ${start} 到 ${end} 之間的所有歌曲`
    res.setDescription(content)
    interaction.followUp({ embeds: [res] })
  }

}
