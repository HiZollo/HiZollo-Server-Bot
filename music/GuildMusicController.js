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
      await this.message.delete().catch(() => {})
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
        if (!interaction.customId.startsWith('MusicButton')) return false;
        if (interaction.member.voice.channelId !== this.manager.voiceChannel.id && interaction.customId.startsWith('MusicButtonControl')) {
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

      if (interaction.customId.startsWith('MusicButtonControl')) {
        switch (interaction.customId) {
          case 'MusicButtonControlPause':
            this.manager.pause()
            break
          case 'MusicButtonControlResume':
            this.manager.resume()
            break
          case 'MusicButtonControlLoopNormal':
          case 'MusicButtonControlLoopAgain':
          case 'MusicButtonControlLoopLoop':
            this.manager.toggleLoopState()
            break
          case 'MusicButtonControlSkip':
            this.manager.skip()
            return
          default: return
        }

        await interaction.editReply({
          components: this.getNewButtons()
        })

      } else if (interaction.customId.startsWith('MusicButtonData')) {
        switch (interaction.customId) {
          case 'MusicButtonDataNowPlaying':
            await interaction.followUp({ embeds: [this.manager.nowPlaying.getNowPlayingEmbed()], flags: MessageFlags.Ephemeral })
            break
        }
      }
    })

  }

  clear() {
    if (this.message) {
      this.message.delete().catch(() => {})
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
          MusicButtons.musicRow.pause.setDisabled(this.manager.paused),
          MusicButtons.musicRow.resume.setDisabled(!this.manager.paused),
          MusicButtons.musicRow.loop[this.manager.nowPlaying.loopState],
          MusicButtons.musicRow.skip
        ),
      new ActionRowBuilder()
        .addComponents(
          MusicButtons.dataRow.nowPlaying
        ),
    ]
  }

}

const MusicButtons = {
  musicRow: {
    pause: new ButtonBuilder()
      .setCustomId('MusicButtonControlPause')
      .setLabel('暫停')
      .setStyle(ButtonStyle.Primary),
    resume: new ButtonBuilder()
      .setCustomId('MusicButtonControlResume')
      .setLabel('繼續')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    loop: [
       new ButtonBuilder()
        .setCustomId('MusicButtonControlLoopNormal')
        .setLabel('正常播放')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('MusicButtonControlLoopAgain')
        .setLabel('重播一次')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('MusicButtonControlLoopLoop')
        .setLabel('循環播放')
        .setStyle(ButtonStyle.Secondary)
    ],
    skip: new ButtonBuilder()
      .setCustomId('MusicButtonControlSkip')
      .setLabel('跳過')
      .setStyle(ButtonStyle.Danger)
  },
  dataRow: {
    nowPlaying: new ButtonBuilder()
      .setCustomId('MusicButtonDataNowPlaying')
      .setLabel('詳細資訊')
      .setStyle(ButtonStyle.Success)
  }
}

module.exports = GuildMusicController
