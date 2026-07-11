// SPDX-FileCopyrightText: 2021-2026 HiZollo Dev Team
//
// SPDX-License-Identifier: EPL-2.0

const { EmbedBuilder, MessageFlags } = require('discord.js')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'countdown-board',
  description: '創建倒數計時器',
  options: [{
    type: 'STRING',
    name: '日期',
    description: '倒數終點日期',
    required: true,
  }, {
    type: 'STRING',
    name: '名稱',
    description: '倒數事件名稱',
    required: true,
  }],
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const dateString = interaction.options.getString('日期')
    const title = interaction.options.getString('名稱')

    const date = new Date(dateString)
    if (isNaN(date.getTime())) return interaction.editReply('日期無效，請重新輸入')

    const formatToGoString = timeToFutureDate(date)
    if (!formatToGoString) return interaction.editReply('這個日期已經過了！請給一個仍未發生的事件')

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`距離 ${title} 還有 ${formatToGoString}`)
      .setColor(0xE4FFF6)

    interaction.editReply('已製作倒數看板！')
    interaction.followUp({ embeds: [embed], flags: [] })

  }
}

function timeToFutureDate(date) {
  const now = new Date()
  let diffInSeconds = ~~((date - now) / 1000)

  if (diffInSeconds <= 0) {
    return ""
  }

  const days = Math.floor(diffInSeconds / (24 * 3600))
  diffInSeconds %= (24 * 3600)

  const hours = Math.floor(diffInSeconds / 3600)
  diffInSeconds %= 3600

  const minutes = Math.floor(diffInSeconds / 60)
  const seconds = diffInSeconds % 60

  return `${days} 天 ${hours} 小時 ${minutes.toString().padStart(2, '0')} 分 ${seconds.toString().padStart(2, '0')} 秒`;
}

