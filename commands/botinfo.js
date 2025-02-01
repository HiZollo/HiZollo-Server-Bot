const { EmbedBuilder } = require('discord.js')
const { version, repository: {url: repoUrl} } = require('../package.json');

module.exports = {
  type: 'CHAT_INPUT',
  name: 'botinfo',
  description: '取得薄荷巧克力的成分資訊',
  async execute(interaction) {
    await interaction.deferReply()

    console.log(repoUrl)
    
    const infoEmbed = new EmbedBuilder()
      .setAuthor({ name: '我的資訊', iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)
      .addFields({
        name: '名字',
        value: interaction.client.user.tag,
        inline: true
      }, {
        name: '在本伺服器暱稱',
        value: interaction.guild.members.me.nickname ?? '無',
        inline: true
      }, {
        name: '版本',
        value: `v${version}`,
        inline: true
      }, {
        name: '服務伺服器數量',
        value: "1",
        inline: true
      }, {
        name: '開始服務時間',
        value: `<t:${~~(interaction.client.user.createdTimestamp/1000)}:R>`,
        inline: true
      }, {
        name: '加入本伺服器時間',
        value: `<t:${~~(interaction.guild.members.me.joinedTimestamp/1000)}:R>`,
        inline: true
      }, {
        name: '開發團隊',
        value: 'HiZollo Dev Team',
      }, {
        name: '其他資訊',
        value: `邀請我・[原始碼](${repoUrl.slice("git+".length)})・[Chocomint Ice](https://youtu.be/pfkBYHFZAt8)\n\`\`\`yaml\nChocomint Ice 是一家開發薄荷巧克力冰淇淋科技為主的公司，在被 HiZollo 收購後，這些科技被用來建立 HiZollo 資料中心，以及重新打造 chocomint 機器人。\n\`\`\``,
      })
      .setThumbnail(interaction.client.user.displayAvatarURL({ format: 'png', size: 300 }))
      .setFooter({ text: `${interaction.user.tag}・使用 /help 來查看所有指令`, iconURL: interaction.user.displayAvatarURL() });

    interaction.editReply({ embeds: [infoEmbed] })

  }
}
