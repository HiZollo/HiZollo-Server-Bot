module.exports = {
  type: 'CHAT_INPUT',
  name: 'ping',
  description: '來看看你點的薄荷巧克力會在多久後抵達......',
  async execute(interaction) {
    const response = await interaction.reply({ content: '🔄｜計算中......', withResponse: true })
    const ping = response.resource.message.createdTimestamp - interaction.createdTimestamp
    interaction.editReply(`ℹ️｜機器人延遲為 ${ping}ms，API 延遲為 ${interaction.client.ws.ping}ms`)
  }
}
