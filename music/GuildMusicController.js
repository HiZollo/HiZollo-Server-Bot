const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, MessageFlags } = require('discord.js')
const { AudioPlayerStatus } = require('@discordjs/voice')

class GuildMusicController {
  constructor(client, channel, manager) {
    this.client = client
    this.channel = channel
    this.manager = manager
    this.message = null
    this.collector = null
  }

  async resend() {
    if (this.message) {
      await this.message.delete()
    }

    if (this.collector) {
      this.collector.removeAllListeners()
    }

    this.message = await this.channel.send({
      embeds: [this.manager.nowPlaying.getStartPlayEmbed()],
      components: this.getNewButtons()
    })

    this.collector = this.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: async interaction => {
        if (!interaction.customId.startsWith('MusicControlButton')) return false;
        if (interaction.member.voice.channelId !== this.manager.voiceChannel.id && !interaction.customId.startsWith('MusicControlButtonData')) {
          await interaction.reply({ content: '你必須跟我在同個語音頻道才能使用此按鈕', flags: MessageFlags.Ephemeral })
          return false
        }
        return true;
      }
    })

    this.collector.on('collect', async interaction => {
      await interaction.deferUpdate()
      if (!this.manager.nowPlaying) return
      if (this.manager.player.state.status === AudioPlayerStatus.Idle) return

      switch (interaction.customId) {
        case 'MusicControlButtonPause':
          this.manager.pause()
          break
        case 'MusicControlButtonResume':
          this.manager.resume()
          break
        case 'MusicControlButtonLoopNormal':
        case 'MusicControlButtonLoopAgain':
        case 'MusicControlButtonLoopLoop':
          this.manager.toggleLoopState()
          break
        case 'MusicControlButtonSkip':
          this.manager.skip()
          return
        case 'MusicControlButtonDataNowPlaying':
          await interaction.followUp({ embeds: [this.manager.nowPlaying.getNowPlayingEmbed()], flags: MessageFlags.Ephemeral })
          break
      }

      await interaction.editReply({
        components: this.getNewButtons()
      })
    })

  }

  clear() {
    if (this.message) {
      this.message.delete()
      this.message = null
    }

    if (this.collector) {
      this.collector.removeAllListeners()
      this.collector = null
    }
  }

  getNewButtons() {
    return [
      new ActionRowBuilder()
        .addComponents(
          MusicControlButtons.musicRow.pause.setDisabled(this.manager.paused),
          MusicControlButtons.musicRow.resume.setDisabled(!this.manager.paused),
          MusicControlButtons.musicRow.loop[this.manager.nowPlaying.loopState],
          MusicControlButtons.musicRow.skip
        ),
      new ActionRowBuilder()
        .addComponents(
          MusicControlButtons.dataRow.nowPlaying
        ),
    ]
  }

}

const MusicControlButtons = {
  musicRow: {
    pause: new ButtonBuilder()
      .setCustomId('MusicControlButtonPause')
      .setLabel('暫停')
      .setStyle(ButtonStyle.Primary),
    resume: new ButtonBuilder()
      .setCustomId('MusicControlButtonResume')
      .setLabel('繼續')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    loop: [
       new ButtonBuilder()
        .setCustomId('MusicControlButtonLoopNormal')
        .setLabel('正常播放')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('MusicControlButtonLoopAgain')
        .setLabel('重播一次')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('MusicControlButtonLoopLoop')
        .setLabel('循環播放')
        .setStyle(ButtonStyle.Secondary)
    ],
    skip: new ButtonBuilder()
      .setCustomId('MusicControlButtonSkip')
      .setLabel('跳過')
      .setStyle(ButtonStyle.Danger)
  },
  dataRow: {
    nowPlaying: new ButtonBuilder()
      .setCustomId('MusicControlButtonDataNowPlaying')
      .setLabel('詳細資訊')
      .setStyle(ButtonStyle.Success)
  }
}

module.exports = GuildMusicController
