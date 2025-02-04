const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js')

const ENTRY_PER_PAGE = 10

module.exports = {
  type: 'CHAT_INPUT',
  name: 'queue',
  description: '取得目前隊列',
  async execute(interaction) {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 音樂中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (!interaction.client.music.has(interaction.guild.id)) {
      res.setDescription('我還不在任何語音頻道中，請先讓我加入一個！')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    await interaction.deferReply()

    const dj = interaction.client.music.get(interaction.guild.id)

    const queue = dj.queue.map((track, index) => {
      return `\`${twoDigits(index + 1)}.\` [${track.metadata.title}](${track.metadata.url})`
    })

    if (!queue.length && !dj.isPlaying) {
      res.setDescription('目前隊列中沒有歌曲，考不考慮放歌進來？')
      return interaction.followUp({ embeds: [res] })
    }

    const pages = []

    for (let i = 0; i < queue.length; i += ENTRY_PER_PAGE) {
      pages.push(queue.slice(i, i + ENTRY_PER_PAGE))
    }

    if (!pages.length) pages.push([])
    const nowPlaying = dj.nowPlaying

    const pageButtons = {
      home: new ButtonBuilder()
        .setCustomId('PageButtonHome')
        .setLabel('|<')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      prev: new ButtonBuilder()
        .setCustomId('PageButtonPrev')
        .setLabel('<')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      exit: new ButtonBuilder()
        .setCustomId('PageButtonExit')
        .setLabel('x')
        .setStyle(ButtonStyle.Danger),
      next: new ButtonBuilder()
        .setCustomId('PageButtonNext')
        .setLabel('>')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages.length < 2),
      end: new ButtonBuilder()
        .setCustomId('PageButtonEnd')
        .setLabel('>|')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages.length < 3)
    }

    let index = 0

    const getInfoSelectMenu = new StringSelectMenuBuilder()
      .setCustomId('PageMenuTrackInfo')
      .setPlaceholder('選擇一個歌曲')

    makeMenuFromPageAndIndex(dj, getInfoSelectMenu, pages, index)

    const menuRow = new ActionRowBuilder()
      .addComponents(getInfoSelectMenu)

    const buttonRow = new ActionRowBuilder()
      .addComponents(...Object.values(pageButtons))

    res.setDescription(`\`>> \` [${nowPlaying.metadata.title}](${nowPlaying.metadata.url})\n\n${pages[index].join('\n')}`)
    .setFooter({ text: `${interaction.user.tag}・第 ${index+1} 頁／共 ${pages.length} 頁`, iconURL: interaction.member.displayAvatarURL() })

    const sentComponents = pages[index].length > 0 ? [menuRow, buttonRow] : [buttonRow]

    const message = await interaction.editReply({ embeds: [res], components: sentComponents })

    async function filter(i) {
      if (!i.customId.startsWith('Page')) return false
      await i.deferUpdate()

      if (i.user.id !== interaction.user.id) {
        i.followUp({ content: '請不要亂按別人的按鈕', flags: MessageFlags.Ephemeral })
        return false
      }
      return true
    }

    message.createMessageComponentCollector({
      filter: filter,
      idle: 60e3,
    }).on('collect', function(i) {
      if (i.customId === 'PageMenuTrackInfo') {
        const track = dj.queue[+i.values[0]]
        i.followUp({ embeds: [track.getTrackInfoEmbed()], flags: MessageFlags.Ephemeral })
      }

      if (i.customId === 'PageButtonExit') {
        i.followUp({ content: '清單已關閉', flags: MessageFlags.Ephemeral })
        this.stop('EXIT')
        return message.delete()
      }

      switch (i.customId) {
        case 'PageButtonHome': index = 0; break;
        case 'PageButtonPrev': index-- ; break;
        case 'PageButtonNext': index++ ; break;
        case 'PageButtonEnd': index = pages.length - 1; break;
      }

      pageButtons.home.setDisabled(index <= 1)
      pageButtons.prev.setDisabled(index == 0)
      pageButtons.next.setDisabled(index == pages.length - 1)
      pageButtons.end.setDisabled(index >= pages.length - 2)

      makeMenuFromPageAndIndex(dj, getInfoSelectMenu, pages, index)

      res.setDescription(`\` >> \` [${nowPlaying.metadata.title}](${nowPlaying.metadata.url})\n\n${pages[index].join('\n')}`)
          .setFooter({ text: `${interaction.user.tag}・第 ${index+1} 頁／共 ${pages.length} 頁`, iconURL: interaction.user.displayAvatarURL() })

      const newMenuRow = new ActionRowBuilder()
        .addComponents(getInfoSelectMenu)

      const newButtonRow = new ActionRowBuilder()
        .addComponents(...Object.values(pageButtons))

      interaction.editReply({ embeds: [res], components: [newMenuRow, newButtonRow] })
    }).once('end', (_, reason) => {
      if (reason === 'EXIT') return
      message.delete().catch(() => {})
      interaction.followUp({
        content: '清單因閒置過久而自動關閉',
        flags: MessageFlags.Ephemeral
      })
    })

  }
}

function makeMenuFromPageAndIndex(dj, menu, pages, index) {
  menu.setOptions()
  for (let i = 0; i < pages[index].length; i++) {
    const actualIndex = index * ENTRY_PER_PAGE + i
    menu.addOptions(new StringSelectMenuOptionBuilder()
      .setLabel(`${actualIndex + 1}. ${dj.queue[actualIndex].metadata.title}`)
      .setValue(`${actualIndex}`)
    )
  }
}

const twoDigits = num => num < 10 ? `0${num}` : `${num}`;
