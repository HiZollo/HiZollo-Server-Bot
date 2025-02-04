const { EmbedBuilder } = require('discord.js')
const { createAudioPlayer, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice')
const Track = require('./Track')
const GuildMusicController = require('./GuildMusicController')
const YoutubeAdapter = require('./adapters/YoutubeAdapter.js')

const adapters = [YoutubeAdapter]

class GuildMusicManager {
  constructor(vc, tc) {
    this.client = vc.client
    this.guild = vc.guild
    this.voiceChannel = vc
    this.textChannel = tc
    this.player = createAudioPlayer()
    this.queue = []
    this.isPlaying = false
    this.controller = new GuildMusicController(this.client, this.textChannel, this)
    this.nowPlaying = null
    this.paused = false
  }

  chooseAdapter(query) {
    return adapters.find(adapter => adapter.supports(query))
  }

  play(interaction, query) {
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

      await interaction.editReply({ embeds: [track.getQueuedEmbed()] })
    } catch (e) {
      console.error(e)
      return interaction.editReply('目前無法正確播放這首歌曲')
    }

    if (!this.isPlaying) {
      const track = this.queue.shift()
      await this.playTrack(track)
      return { queued: false, track }
    }

    return { queued: true }
  }

  async playlistWithAdapter(interaction, query, adapter) {
    interaction.editReply('解析播放清單中，若播放清單過長，可能會花上幾分鐘，請耐心等候......')

    try {
      const data = await adapter.getBulkTrackInfo(query)
      
      await interaction.editReply('播放清單解析完成，正在加入隊列中......')

      const tracks = data.map(({ inputURL, metadata }) => new Track(this.client, inputURL, metadata, interaction.member, adapter))
      const thumbnail = data.find(track => track.metadata.thumbnail)?.metadata?.thumbnail

      this.queue = this.queue.concat(tracks)

      const res = new EmbedBuilder()
        .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
        .setColor(0xE4FFF6)
        .setDescription(`已將播放清單的 ${tracks.length} 首歌加入隊列`)

      if (thumbnail) res.setThumbnail(thumbnail)

      await interaction.editReply({ content: '', embeds: [res] })
    } catch (e) {
      console.error(e)
      return interaction.editReply('出現未知錯誤，已停止')
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
