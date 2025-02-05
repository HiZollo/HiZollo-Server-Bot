const { ChannelType, EmbedBuilder, MessageFlags, PermissionsBitField } = require('discord.js')
const GuildMusicManager = require('../music/GuildMusicManager')
const { joinVoiceChannel, entersState, VoiceConnectionStatus, StreamType } = require('@discordjs/voice')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'join',
  description: '加入你所在的語音頻道',
  async execute(interaction) {
    const vc = interaction.member.voice.channel
    const res = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 音樂中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setColor(0xE4FFF6)

    if (!vc) {
      res.setDescription('你必須先加入一個語音頻道')
      return interaction.reply({ embeds: [res], flags: MessageFlags.Ephemeral })
    }

    if (interaction.client.music.has(vc.guild.id)) {
      const { voiceChannel } = interaction.client.music.get(vc.guild.id)
      if (voiceChannel.id === vc.id) {
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

    interaction.client.music.set(vc.guild.id, new GuildMusicManager({
      voiceChannel: vc,
      textChannel: interaction.channel,
      stageAutoUnsuppress: vc.type === ChannelType.GuildStageVoice && interaction.guild.members.me.permissions.has(PermissionsBitField.StageModerator)
    }))

    const dj = interaction.client.music.get(vc.guild.id)
    connection.subscribe(dj.player)

    try {
      await entersState(connection, VoiceConnectionStatus.Connecting, 5e3).then(() => {
        if (dj.stageAutoUnsuppress) interaction.guild.members.me.voice.setSuppressed(false)
      })
    } catch(e) {
      console.log(e)
      dj.leave();
      res.setDescription('無預警加入失敗，請稍後再試')
      return interaction.editReply({ embeds: [res] })
    }

    connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 1e3),
          entersState(connection, VoiceConnectionStatus.Connecting, 1e3)
        ])

        dj.voiceChannel = vc.guild.members.me.voice.channel
      } catch (e) {
        dj.leave()
        interaction.client.music.delete(vc.guild.id)
      }
    })

    res.setDescription(`已成功加入 ${vc.name}`)
    interaction.editReply({ embeds: [res] })
  }
}
