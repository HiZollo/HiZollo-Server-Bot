const { ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js')
const { createAudioPlayer, entersState, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice')
const Track = require('./Track')
const GuildMusicController = require('./GuildMusicController')
const RawfileAdapter = require('./adapters/RawfileAdapter.js')
const YoutubeAdapter = require('./adapters/YoutubeAdapter.js')

const adapters = [YoutubeAdapter, RawfileAdapter]

class GuildMusicManager {
  constructor({ voiceChannel, textChannel, stageAutoUnsuppress }) {
    this.client = voiceChannel.client
    this.guild = voiceChannel.guild
    this.voiceChannel = voiceChannel
    this.textChannel = textChannel
    this.stageAutoUnsuppress = stageAutoUnsuppress
    this.player = createAudioPlayer()
    this.queue = []
    this.isPlaying = false
    this.controller = new GuildMusicController(this.client, this.textChannel, this)
    this.nowPlaying = null
    this.paused = false
    this.maxQueueSize = 99
  }

  chooseAdapter(query) {
    return adapters.find(adapter => adapter.supports(query))
  }

  canAutoUnsuppress(interaction) {
    if (this.voiceChannel.type === ChannelType.GuildStageVoice && this.guild.members.me.voice.suppress) {
      if (!this.guild.members.me.permissions.has(PermissionsBitField.StageModerator)) {
        interaction.editReply('我沒有辦法在這舞台頻道上發言！請你給我發言權或是讓我成為舞台版主').then(msg => {
          setTimeout(() => msg.delete(), 5000)
        })
        return false
      }
      this.guild.members.me.voice.setSuppressed(false)
      return true
    }
    return true
  }

  play(interaction, query) {
    if (!this.canAutoUnsuppress(interaction)) return

    if (this.queue.length >= this.maxQueueSize) {
      interaction.followUp(`隊列已超過上限 ${this.maxQueueSize} 首，請等待目前的歌曲播放完畢，或是移除一些歌曲後再試`).then(msg => {
        setTimeout(() => msg.delete(), 5000)
      })
      return
    }

    const adapter = this.chooseAdapter(query)
    if (!adapter) throw new Error('No suitable adapter found')

    return this.playWithAdapter(interaction, query, adapter)
  }

  async playWithAdapter(interaction, query, adapter) {
    if (adapter.isList(query))
      return this.playlistWithAdapter(interaction, query, adapter)

    try {
      const { inputURL, metadata } = await adapter.getTrackInfo(query)

      const track = new Track(this.client, inputURL, metadata, interaction.member, adapter)
      this.queue.push(track)

      await interaction.followUp({ embeds: [track.getQueuedEmbed()] })
    } catch (e) {
      console.error(e)
      return interaction.followUp('目前無法正確播放這首歌曲')
    }

    if (!this.isPlaying) {
      const track = this.queue.shift()
      await this.playTrack(track)
      return { queued: false, track }
    }

    return { queued: true }
  }

  async playlistWithAdapter(interaction, query, adapter) {
    const message = await interaction.followUp('解析播放清單中，若播放清單過長，可能會花上幾分鐘，請耐心等候......')

    try {
      const data = await adapter.getBulkTrackInfo(query)

      const res = new EmbedBuilder()
        .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
        .setColor(0xE4FFF6)

      if (!data.length) {
        res.setDescription('很遺憾，這個播放清單中沒有我可以播放的樂曲')
        return message.edit({ content: '', embeds: [res] }).catch(console.error)
      }
      
      await message.edit('播放清單解析完成，正在加入隊列中......').catch(console.error)

      const tracks = data.map(({ inputURL, metadata }) => new Track(this.client, inputURL, metadata, interaction.member, adapter))
      const thumbnail = data.find(track => track.metadata.thumbnail)?.metadata?.thumbnail

      this.queue = this.queue.concat(tracks)

      res.setDescription(`已將播放清單的 ${tracks.length} 首歌加入隊列`)

      if (thumbnail) res.setThumbnail(thumbnail)

      await message.edit({ content: '', embeds: [res] }).catch(console.error)
    } catch (e) {
      console.error(e)
      return message.edit('出現未知錯誤，已停止').catch(console.error)
    }

    if (!this.isPlaying) {
      const track = this.queue.shift()
      await this.playTrack(track)
      return { queued: false, track }
    }

    return { queued: true }
  }

  async playTrack(track) {
    try {
      this.paused = false
      this.isPlaying = true
      this.nowPlaying = track
      await Promise.all([
        track.getStream().then(stream => this.player.play(stream)),
        this.controller.resend()
      ])

      entersState(this.player, AudioPlayerStatus.Playing, 5e3)
        .catch(e => {
          this.player.emit(AudioPlayerStatus.Idle)
        })
     
    } catch (e) {
      console.error(e)
      this.textChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
          .setDescription('無法播放此歌曲')
          .setColor(0xE4FFF6)
        ]
      })
      this.playNext()
      return
    }

    this.player.once(AudioPlayerStatus.Idle, () => {
      if (this.nowPlaying && this.nowPlaying.loopState !== 0) {
        this.playTrack(this.nowPlaying)
        if (this.nowPlaying.loopState === 1) this.nowPlaying.loopState = 0
        return
      }

      this.playNext()
    })
  }

  searchWithAdapter(query, adapter) {
    return adapter.search(query, 10)
  }
    

  playNext() {
    if (!this.queue.length) {
      this.isPlaying = false
      this.nowPlaying = null
      this.controller.clear()
      this.textChannel.send({
        embeds: [new EmbedBuilder()
          .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
          .setDescription('隊列的歌曲已經播放完畢')
          .setColor(0xE4FFF6)
        ]
      })
      if (this.voiceChannel.type === ChannelType.GuildStageVoice && !this.stageAutoUnsuppress) {
        this.guild.members.me.voice.setSuppressed(true)
      }
      return
    }

    const nextTrack = this.queue.shift()
    this.playTrack(nextTrack)
  }

  pause() {
    this.paused = true
    this.player.pause()
  }

  resume() {
    this.paused = false
    this.player.unpause()
  }
  
  skip() {
    this.player.stop(true)
  }

  toggleLoopState() {
    if (!this.nowPlaying) return
    switch (this.nowPlaying.loopState) {
      case 0:
        this.nowPlaying.loopState = 1
        break
      case 1:
        this.nowPlaying.loopState = 2
        break
      case 2:
        this.nowPlaying.loopState = 0
        break
    }
  }

  leave() {
    const connection = getVoiceConnection(this.guild.id)
    this.player.removeAllListeners()
    this.controller.clear()
    this.player.stop(true)
    this.player = null
    connection.destroy()
    this.client.music.delete(this.guild.id)
  }

}

module.exports = GuildMusicManager
