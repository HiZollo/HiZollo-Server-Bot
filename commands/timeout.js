const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js')

module.exports = {
  type: 'CHAT_INPUT',
  name: 'timeout',
  description: '使用薄荷巧克力冰淇淋堵住某人的嘴一段時間',
  options: [{
    type: 'USER',
    name: '用戶',
    description: '要禁言的用戶',
    required: true
  }, {
    type: 'STRING',
    name: '時間',
    description: '禁言時間',
    required: true
  }, {
    type: 'STRING',
    name: '原因',
    description: '禁言原因',
  }],
  async execute(interaction) {
    const user = interaction.options.getUser('用戶')
    const formatTime = interaction.options.getString('時間')
    const reason = interaction.options.getString('原因')

    const member = await interaction.guild.members.fetch(user)

    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '你沒有權限進行此操作', flags: MessageFlags.Ephemeral })
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: '我沒有權限進行此操作', flags: MessageFlags.Ephemeral })
    }

    if (!member) {
      return interaction.reply({ content: '找不到該用戶', flags: MessageFlags.Ephemeral })
    }

    if (member.id === interaction.client.user.id) {
      return interaction.reply({ content: '你竟敢用我的薄荷巧克力對付我？', flags: MessageFlags.Ephemeral })
    }

    if (!member.manageable) {
      return interaction.reply({ content: '我無法禁言該用戶', flags: MessageFlags.Ephemeral })
    }

    await interaction.deferReply()

    const time = resolveTime(formatTime)

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.client.settings.name} 管理中心`, iconURL: interaction.client.user.displayAvatarURL() })
      .setDescription(`是否使用薄荷巧克力冰淇淋堵住 ${member} 的嘴？\n\n他將不能發言直到 ${secToString(time)}後`)
      .setColor(0xE4FFF6)

    const actionRow = new ActionRowBuilder()
      .setComponents(new ButtonBuilder()
          .setCustomId('confirm')
          .setLabel('確認')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('cancel')
          .setLabel('取消')
          .setStyle(ButtonStyle.Danger)
        )
    
    const message = await interaction.editReply({ embeds: [embed], components: [actionRow] })

    message.awaitMessageComponent({
      filter: i => {
        if (i.user.id !== interaction.user.id) {
          i.reply({ content: '這不是你的指令', flags: MessageFlags.Ephemeral })
          return false
        }
        return true
      },
      time: 60_000,
    }).then(async confirmation => {
      await confirmation.deferUpdate()
      if (confirmation.customId === 'confirm') {
        member.disableCommunicationUntil(Date.now() + time * 1000, reason)
        embed.setDescription(`已禁言 ${member}`)
        interaction.editReply({ embeds: [embed], components: [] })
      } else {
        embed.setDescription('操作已取消')
        interaction.editReply({ embeds: [embed], components: [] })
      }
    }).catch(() => {
      embed.setDescription('你的薄荷巧克力冰淇淋已經融化了，請重試')
      interaction.editReply({ embeds: [embed], components: [] })
    })
  }
}

function secToString(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;

    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;

    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    const remainingSeconds = seconds;

    let result = '';
    if (days > 0) result += `${days} 天 `;
    if (hours > 0 || days > 0) result += `${hours} 時 `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes} 分 `;
    result += `${remainingSeconds} 秒`;

    return result;
}

function resolveTime(formatTime) {
  const timeUnits = [1, 60, 60 * 60, 24 * 60 * 60]; // ms, seconds, minutes, hours, days
  const time = formatTime.split('-').map(Number).reverse();

  return time.reduce((total, current, index) => total + current * timeUnits[index], 0);
}

