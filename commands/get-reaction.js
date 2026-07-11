// SPDX-FileCopyrightText: 2021-2026 HiZollo Dev Team
//
// SPDX-License-Identifier: EPL-2.0

const { MessageFlags } = require('discord.js')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'get-reaction',
  description: '獲取指定訊息有哪些人回應了指定表情符號',
  options: [{
    type: 'STRING',
    name: '訊息id',
    description: '想要獲取回應的訊息 ID',
    required: true,
  }, {
    type: 'STRING',
    name: '表情符號',
    description: '想要獲取回應的表情符號',
    required: true,
  }],
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const messageId = interaction.options.getString('訊息id')
    const emoji = interaction.options.getString('表情符號')

    const message = await interaction.channel.messages.fetch(messageId).catch(() => null)
    if (!message) return interaction.editReply({ content: '找不到該訊息' })
    const reaction = message.reactions.resolve(emoji)
    if (!reaction) return interaction.editReply({ content: '該訊息沒有這個表情符號的回應' })
    await reaction.users.fetch()

    const replyString = reaction.users.cache.map(user => {
      return user.tag
    }).filter(v => v).join('\n')

    interaction.editReply({ content: replyString.replace(/([!@#$%^&*()_\\{}[\]+=-])/g, '\\$1') || '沒有人回應' })
  }
}
