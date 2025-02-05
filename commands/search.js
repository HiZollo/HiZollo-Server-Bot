const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js')
const YoutubeAdapter = require('../music/adapters/YoutubeAdapter')

const searchableAdapters = {
  youtube: { adapter: YoutubeAdapter, adapterOriginName: 'Youtube' }
}

module.exports = {
  type: 'CHAT_INPUT',
  name: 'search',
  description: '懶得抓網址的話，就讓我來幫你吧',
  options: Object.entries(searchableAdapters)
    .map(([name, adapter]) => ({
      type: 'SUB_COMMAND',
      name,
      description: `在 ${adapter.adapterOriginName} 上搜尋`,
      options: [{
        type: 'STRING',
        name: '搜尋關鍵字',
        description: '搜尋關鍵字',
        required: true
      }]
    })),
  async execute(interaction) {
		const res = new EmbedBuilder()
			.setAuthor({ name: `${interaction.client.settings.name} 音樂中心`, iconURL: interaction.client.user.displayAvatarURL() })
			.setColor(0xE4FFF6)

		if (!interaction.client.music.has(interaction.guild.id)) {
			res.setDescription('我還不在任何語音頻道中，請先讓我加入一個！');
			return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
		}

		const dj = interaction.client.music.get(interaction.guild.id);

		if (!interaction.member.voice.channel ||
				interaction.member.voice.channel.id !== dj.voiceChannel.id) {

			res.setDescription('你必須跟我在同個語音頻道才能使用此指令');
			return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
		}

    await interaction.deferReply()

    const commandName = interaction.options.getSubcommand();
    const query = interaction.options.getString('搜尋關鍵字');

    const { adapter } = searchableAdapters[commandName]

    const results = await dj.searchWithAdapter(query, adapter)
      .catch(e => {
        console.error(e)
        res.setDescription('搜尋時發生錯誤')
        interaction.editReply({ embeds: [res] })
        return null
      })

    if (!results) return

    if (!results.length) {
      res.setDescription('找不到任何結果')
      return interaction.editReply({ embeds: [res] })
    }

    const embedContent = results.map((result, index) => {
      return `\`${index + 1}. \` [${result.title}](${result.url})`
    }).join('\n\n')
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('MusicSearchSelectMenu')
      .setPlaceholder('選擇一個歌曲')
      .addOptions(results.map((result, index) => new StringSelectMenuOptionBuilder()
        .setLabel(`${index + 1}. ${result.title}`)
        .setValue(index.toString())
      ))

    const exitButton = new ButtonBuilder()
      .setCustomId('MusicSearchExitButton')
      .setLabel('取消')
      .setStyle(ButtonStyle.Danger)

    const menuRow = new ActionRowBuilder()
      .addComponents(selectMenu)

    const buttonRow = new ActionRowBuilder()
      .addComponents(exitButton)

    res.setDescription(`${interaction.user}，以下為搜尋結果\n請使用選單選擇你要播放的音樂，或按按鈕離開\n\n${embedContent}`)

    const message = await interaction.editReply({ embeds: [res], components: [menuRow, buttonRow] })

    async function filter(i) {
      if (!i.customId.startsWith('MusicSearch')) return false
      await i.deferUpdate()

      if (i.user.id !== interaction.user.id) {
        i.followUp({
          content: i.isButton() ? '請不要亂按別人的按鈕' : '請不要亂幫別人做選擇',
          flags: MessageFlags.Ephemeral
        })
        return false
      }
      return true
    }

    const result = await message.awaitMessageComponent({ filter, time: 60e3 })
      .then(i => {
        if (i.customId === 'MusicSearchExitButton') {
          i.followUp({ content: '已結束搜尋', flags: MessageFlags.Ephemeral })
          message.delete()
          return null
        }

        const index = i.values[0]
        message.delete()
        return results[index]
      }).catch(() => {
        message.delete()
        interaction.followUp({ content: '搜尋因閒置過久而結束', flags: MessageFlags.Ephemeral })
        return null
      })

    if (!result) return

    try {
      dj.playWithAdapter(interaction, result.url, adapter)
    } catch (e) {
      console.error(e)
      res.setDescription('無法播放此歌曲')
      return interaction.followUp({ embeds: [res] })
    }

  }
}
