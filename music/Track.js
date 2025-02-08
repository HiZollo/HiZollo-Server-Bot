const { createAudioResource, StreamType } = require('@discordjs/voice')
const prism = require('prism-media')
const { EmbedBuilder } = require('discord.js')

class Track {
  constructor(client, inputURL, metadata, requester, adapter) {
    this.client = client
    this.inputURL = inputURL
    this.metadata = metadata
    this.requester = requester
    this.adapter = adapter
    this.startMs = 0

    // 0 for None, 1 for Again, 2 for Loop
    this.loopState = 0

    this._resource = null
  }

  get playedMs() {
    return this._resource.playbackDuration + this.startMs
  }

  async getStream(startTimeMs = 0) {
    if (isNaN(+startTimeMs)) startTimeMs = 0
    if (startTimeMs < 0) startTimeMs = 0
    this.starTimeMs = startTimeMs

    const mediaURL = await this.adapter.getResourceURL(this.inputURL)
    const FFMPEG_OPUS_ARGUMENTS = ['-i', mediaURL, '-ss', ~~(this.starTimeMs)/1000, '-analyzeduration', '0', '-loglevel', '0', '-acodec', 'libopus', '-f', 'opus', '-ar', '48000', '-ac', '2']
    const RECONNECT_ARGUMENTS = ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '5']
    const stream = new prism.FFmpeg({
      args: [...RECONNECT_ARGUMENTS, ...FFMPEG_OPUS_ARGUMENTS]
    })
    const resource = this._resource = createAudioResource(stream, {
      inputType: StreamType.OggOpus,
    })
    return resource
  }

  getStartPlayEmbed() {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)
      .setDescription(`正在播放 ${this.toString()}`)
      .setFooter({ text: `由 ${this.requester.user.tag} 指定的歌曲`, iconURL: this.requester.displayAvatarURL() })

    if (this.metadata.thumbnail) res.setThumbnail(this.metadata.thumbnail)
    return res
  }

  getQueuedEmbed() {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)
      .setDescription(`已將 ${this.toString()} 加入隊列`)
      .setFooter({ text: `由 ${this.requester.user.tag} 指定的歌曲`, iconURL: this.requester.displayAvatarURL() })

    if (this.metadata.thumbnail) res.setThumbnail(this.metadata.thumbnail)
    return res
  }

  getNowPlayingEmbed() {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)
      .setFooter({ text: `由 ${this.requester.user.tag} 指定的歌曲`, iconURL: this.requester.displayAvatarURL() })

    if (this.metadata.thumbnail) res.setThumbnail(this.metadata.thumbnail)

    let description = `正在播放：${this.toString()}`

    if (this.metadata.lengthSeconds) {
      description += `\n\n播放時間：${timeResolve(~~(this.playedMs / 1000))} / ${timeResolve(this.metadata.lengthSeconds)}`
    }

    if (this.metadata.author) {
      if (this.metadata.author.url) description += `\n\n上傳作者：[${this.metadata.author.name}](${this.metadata.author.url})`
      else description += `\n\n上傳作者：${this.metadata.author.name}`
    }

    if (this.metadata.uploadDate) {
      description += `\n\n上傳日期：${dateToReadableString(this.metadata.uploadDate)}`
    }

    if (this.metadata.viewCount) {
      description += `\n\n觀看次數：${this.metadata.viewCount.toString().replace(/(.)(?=(\d{3})+$)/g,'$1,')}`
    }

    description += `\n\u200b`

    res.setDescription(description)

    return res
  }

  getTrackInfoEmbed() {
    const res = new EmbedBuilder()
      .setAuthor({ name: `${this.client.settings.name} 音樂中心`, iconURL: this.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)
      .setFooter({ text: `由 ${this.requester.user.tag} 指定的歌曲`, iconURL: this.requester.displayAvatarURL() })

    if (this.metadata.thumbnail) res.setThumbnail(this.metadata.thumbnail)


    let description = `正在播放：${this.toString()}`


    if (this.metadata.lengthSeconds) {
      description += `\n\n樂曲時長：${timeResolve(this.metadata.lengthSeconds)}`
    }

    if (this.metadata.author) {
      if (this.metadata.author.url) description += `\n\n上傳作者：[${this.metadata.author.name}](${this.metadata.author.url})`
      else description += `\n\n上傳作者：${this.metadata.author.name}`
    }

    if (this.metadata.uploadDate) {
      description += `\n\n上傳日期：${dateToReadableString(this.metadata.uploadDate)}`
    }

    if (this.metadata.viewCount) {
      description += `\n\n觀看次數：${this.metadata.viewCount.toString().replace(/(.)(?=(\d{3})+$)/g,'$1,')}`
    }

    description += `\n\u200b`

    res.setDescription(description)

    return res
  }

  toString() {
    if (this.metadata.title === this.metadata.url) return `[未知音樂](${this.metadata.url})`
    return `[${this.metadata.title}](${this.metadata.url})`
  }

}

function dateToReadableString(date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

function timeResolve(second) {
  if (second < 60) return `0:${toTwoDigits(second)}`;
  else return `${~~(second/60)}:${toTwoDigits(second%60)}`;
}

function toTwoDigits(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

module.exports = Track
