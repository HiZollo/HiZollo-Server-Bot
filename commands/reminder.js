const reminders = {
  'tag': '請不要隨意 tag 其他使用者，若是請求幫助也不要 tag 太多次',
  'offline': '每個月的最後一個週末是定期下線維護日，該日若沒有上線是正常的',
  'networksync': '若 Network 沒有正常同步，請先確認你的頻道名稱。如果還是不行，請檢查 HiZollo 有沒有 __管理 Webhooks__ 的權限',
  'cantuse': '**我們不會通靈**\n如果不能使用，請報上那個指令的名稱，你的使用方式，最好能附上時間點，方便我們查詢記錄',
  'howtouse': '請使用 </help:894066498128195614> 查詢一個指令的使用方法，裡面都有說明、用法、範例\n如果還有不清楚的地方，請告訴我們是哪裡有困惑，我們會很高興協助解釋',
  '[]<>': '使用指令時，請不要將括號（\`[]<>\`）一同輸入\n\`[]\`符號表示這個參數必填，\`<>\`則是不必填',
  'changelog': `我們的最新更新都會顯示在 </announcement:894066153654198372> 指令跳出來的清單中\n若想了解之前的更新，可以用 </links:894066499046748241> 取得更新日誌的連結`,
  'blockuser': '**我們會對不當使用及屢勸不聽的使用者進行處置**\n若你被加入封鎖名單中，直到解封前，你將無法主動使用 HiZollo 的任何功能',
  'selfbot': '歡迎在這邊討論任何跟 Discord 機器人製作等相關的問題，團隊成員若是有會回答的也都會分享\n但有關 selfbot 等違反 Discord 政策的東西不在我們的回答範圍內，嚴重者也會被我們永久停權',
  'database': 'HiZollo 是沒有使用到有關資料庫的技術的，也就是他沒有辦法儲存任何資料，一但離線就會消失。\n因為這個問題 HiZollo 現在無法做到像是經驗值系統、個別伺服器設定等',
  '24/7': 'HiZollo 是運行在由 HiZollo 團隊搭建的高度防護資料中心中，使用薄荷巧克力冰淇淋作為燃料維持運作，來達到 24/7 運行',
  'opensource': 'HiZollo 的 專案是開源的，你可以到 https://github.com/HiZollo/Junior-HiZollo 查看原始碼',
  'otherbot': '我們官方不支援「其他機器人」使用上的教學及問題排除，你可以在這邊找其他熟悉該機器人的人來操作，但請不要 tag 團隊成員，這不是他們的工作內容',
  'spoonfeed': '有些問題可以先試著透過 Google 查找答案，這樣能更快速解決一些常見的問題。如果仍然無法解決，可以提出具體遇到的困難，社區成員大都很樂意提供協助',
  'notdeleted': '當你發現 HiZollo 沒有把訊息刪乾淨時，其實那只是 Discord 的顯示問題，重新整理之後你就會發現訊息被刪掉了',
  'timeweaver': '以 UTC+8 為準，在每天 00:00:00 - 00:09:59 這段時間內於 <#572733182412193794> 或 <#774937521275666432> 中第一個講出「跨日大師」的人，將會獲得跨日大師身份並載入史冊。此身份每日重置。',
  'python': (interaction) => { 
    interaction.editReply('Python 在這裡是禁語，不能討論的，他是絕對的邪教。在這裡討論有關 Python 的事情都有可能遭受極大的懲罰').then(msg => {
      setTimeout(() => { msg.edit(msg.content.replace(/Python/g, '[敏感字詞已和諧]')) }, 1984)
    })
  }
}

module.exports = {
  type: 'CHAT_INPUT',
  name: 'reminder',
  description: '回應罐頭提醒（罐頭裡裝的是薄荷巧克力）',
  options: [{
    name: '提醒項目',
    type: 'STRING',
    description: '要提醒的內容',
    required: true,
    choices: Object.keys(reminders).map(key => ({ name: key, value: key }))
  }],
  async execute(interaction) {
    await interaction.deferReply()

    const reminder = interaction.options.getString('提醒項目')
    const reminderTextOrAction = reminders[reminder]

    if (typeof reminderTextOrAction === 'function') {
      reminderTextOrAction(interaction)
      return
    }

    await interaction.editReply(reminderTextOrAction)
  }
}
