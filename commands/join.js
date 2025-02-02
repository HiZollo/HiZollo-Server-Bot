const { EmbedBuilder, MessageFlags } = require('discord.js')
const { joinVoiceChannel, entersState, createAudioPlayer, createAudioResource, VoiceConnectionStatus, StreamType } = require('@discordjs/voice')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'join',
  description: '加入你所在的語音頻道',
  async execute(interaction) {
    const vc = interaction.member.voice.channel
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 通知中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (!vc) {
      res.setDescription('你必須先加入一個語音頻道')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    if (interaction.client.music.has(vc.guild.id)) {
      const { channel } = interaction.client.music.get(vc.guild.id)
      if (channel.id === vc.id) {
        res.setDescription('我已經在你的語音頻道中了，你的眼睛還好嗎')
        return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
      }

      res.setDescription('我已經在伺服器的其他語音頻道中了，請先將我退出再重新加入')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    if (!vc.joinable) {
      res.setDescription('我無法加入你的語音頻道')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    await interaction.deferReply()

    const connection = joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
      selfDeaf: false
    })

    interaction.client.music.set(vc.guild.id, {
      client: interaction.client,
      channel: vc,
      player: createAudioPlayer(),
      queue: [],
      isPlaying: false,
      nowPlaying: {}
    })

    const dj = interaction.client.music.get(vc.guild.id)
    connection.subscribe(dj.player)

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 1e3),
          entersState(connection, VoiceConnectionStatus.Connecting, 1e3)
        ])

        dj.channel = vc.guild.members.me.voice.channel
      } catch (e) {
        connection.destroy()
        interaction.client.music.delete(vc.guild.id)
      }
    })

    res.setDescription(`已成功加入 ${vc.name}`)
    interaction.editReply({ embeds: [res] })
  }
}
