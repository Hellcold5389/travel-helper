import { Bot, GrammyError } from 'grammy';
import { Menu } from '@grammyjs/menu';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ============================================
// Visa Data (MVP - hardcoded for now)
// ============================================
const visaData: Record<string, Record<string, { requirement: string; duration: string; notes: string }>> = {
  JP: {
    TW: { requirement: '免簽證', duration: '90天', notes: '需出示回程機票，護照效期6個月以上' },
  },
  KR: {
    TW: { requirement: '免簽證', duration: '90天', notes: '護照效期6個月以上' },
  },
  TH: {
    TW: { requirement: '免簽證', duration: '60天', notes: '2025年新增免簽，護照效期6個月以上' },
  },
  SG: {
    TW: { requirement: '免簽證', duration: '30天', notes: '護照效期6個月以上' },
  },
  US: {
    TW: { requirement: '需簽證', duration: '-', notes: 'B1/B2觀光簽證，費用USD 185' },
  },
};

// ============================================
// Legal Restrictions Data
// ============================================
const legalData: Record<string, { country: string; items: { name: string; severity: string; notes: string }[] }> = {
  JP: {
    country: '日本',
    items: [
      { name: '含偽麻黃鹼感冒藥', severity: '🔴 高風險', notes: '興P感冒膠囊、伏冒錠等禁止攜帶' },
      { name: '肉類製品', severity: '🟠 中風險', notes: '肉乾、香腸等禁止' },
      { name: '水果', severity: '🟠 中風險', notes: '新鮮水果禁止' },
    ],
  },
  TH: {
    country: '泰國',
    items: [
      { name: '電子菸/加熱菸', severity: '🔴 高風險', notes: '完全禁止，最高10年監禁' },
      { name: '毒品', severity: '🔴 高風險', notes: '死刑或終身監禁' },
    ],
  },
  SG: {
    country: '新加坡',
    items: [
      { name: '口香糖', severity: '🔴 高風險', notes: '完全禁止（醫療用途除外）' },
      { name: '電子菸', severity: '🔴 高風險', notes: '完全禁止' },
    ],
  },
  KR: {
    country: '韓國',
    items: [
      { name: 'EVE止痛藥', severity: '🔴 高風險', notes: '2025年4月起禁止' },
      { name: '豬肉製品', severity: '🔴 高風險', notes: '口蹄疫管制' },
    ],
  },
};

// ============================================
// Fun Facts Data
// ============================================
const funFactsData: Record<string, string[]> = {
  JP: [
    '日本有超過 6 萬家便利店，平均每 2300 人就有一家',
    '東京的米其林星星數量全球第一',
    '日本的自動販賣機數量超過 500 萬台',
  ],
  TH: [
    '泰國是全世界唯一沒有被殖民過的東南亞國家',
    '曼谷的全名是世界上最長的城市名稱（167 個字母）',
    '泰國有超過 35,000 座寺廟',
  ],
  SG: [
    '新加坡是世界上唯一一個禁止口香糖的國家',
    '新加坡是全球最昂貴的城市之一',
    '新加坡有 4 種官方語言',
  ],
  KR: [
    '韓國是全球網速最快的國家之一',
    '韓國有超過 20 個 UNESCO 世界遺產',
    '韓國人平均每年吃掉 10 公斤泡菜',
  ],
};

// Country emoji flags
const countryFlags: Record<string, string> = {
  JP: '🇯🇵',
  KR: '🇰🇷',
  TH: '🇹🇭',
  SG: '🇸🇬',
  US: '🇺🇸',
};

// ============================================
// Commands
// ============================================

// Start command
bot.command('start', async (ctx) => {
  await ctx.reply(
    `🌍 Travel Helper Bot

你的 AI 旅行顧問！提供簽證查詢、法律禁忌、Fun Facts。

📍 可用命令：
/visa <國家代碼> - 查詢簽證資訊
/legal <國家代碼> - 查詢法律禁忌
/funfacts <國家代碼> - 趣味知識
/countries - 支援國家列表

💡 範例：
/visa JP - 查詢日本簽證
/legal TH - 查詢泰國禁忌`
  );
});

// Countries list
bot.command('countries', async (ctx) => {
  const countries = Object.keys(countryFlags)
    .map((code) => `${countryFlags[code]} ${code}`)
    .join('\n');
  
  await ctx.reply(
    `📍 支援的國家：

${countries}

使用國家代碼查詢（如 JP, KR, TH, SG, US）`
  );
});

// Visa query
bot.command('visa', async (ctx) => {
  const countryCode = ctx.match?.toUpperCase();
  
  if (!countryCode) {
    await ctx.reply('請輸入國家代碼，例如：/visa JP');
    return;
  }
  
  const flag = countryFlags[countryCode] || '🌍';
  const visa = visaData[countryCode]?.TW;
  
  if (!visa) {
    await ctx.reply(`❌ 尚未支援 ${countryCode} 的簽證資訊，請使用 /countries 查看支援國家`);
    return;
  }
  
  const requirementEmoji = visa.requirement === '免簽證' ? '✅' : '📝';
  
  await ctx.reply(
    `${flag} ${countryCode} 簽證資訊（台灣護照）

${requirementEmoji} ${visa.requirement}
⏱ 停留期限：${visa.duration}
📌 注意事項：${visa.notes}

⚠️ 簽證政策可能隨時變更，出發前請確認官方資訊`
  );
});

// Legal restrictions
bot.command('legal', async (ctx) => {
  const countryCode = ctx.match?.toUpperCase();
  
  if (!countryCode) {
    await ctx.reply('請輸入國家代碼，例如：/legal JP');
    return;
  }
  
  const flag = countryFlags[countryCode] || '🌍';
  const legal = legalData[countryCode];
  
  if (!legal) {
    await ctx.reply(`❌ 尚未支援 ${countryCode} 的法律資訊，請使用 /countries 查看支援國家`);
    return;
  }
  
  const itemsList = legal.items
    .map((item) => `• ${item.severity} ${item.name}\n  ${item.notes}`)
    .join('\n\n');
  
  await ctx.reply(
    `${flag} ${legal.country} - 禁帶物品與法律禁忌

${itemsList}

⚠️ 違反規定可能面臨罰款、監禁等處罰`
  );
});

// Fun facts
bot.command('funfacts', async (ctx) => {
  const countryCode = ctx.match?.toUpperCase();
  
  if (!countryCode) {
    await ctx.reply('請輸入國家代碼，例如：/funfacts JP');
    return;
  }
  
  const flag = countryFlags[countryCode] || '🌍';
  const facts = funFactsData[countryCode];
  
  if (!facts) {
    await ctx.reply(`❌ 尚未支援 ${countryCode} 的 Fun Facts，請使用 /countries 查看支援國家`);
    return;
  }
  
  const factsList = facts.map((fact, i) => `${i + 1}. ${fact}`).join('\n');
  
  await ctx.reply(
    `${flag} Fun Facts

${factsList}`
  );
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `📖 Travel Helper Bot 使用說明

📍 命令列表：
/start - 開始使用
/visa <國家> - 簽證查詢
/legal <國家> - 法律禁忌
/funfacts <國家> - 趣味知識
/countries - 支援國家
/help - 幫助

🌐 國家代碼：
JP - 日本 🇯🇵
KR - 韓國 🇰🇷
TH - 泰國 🇹🇭
SG - 新加坡 🇸🇬
US - 美國 🇺🇸

⚠️ 資料僅供參考，實際規定以各國官方公告為準`
  );
});

// ============================================
// Start bot
// ============================================
bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.start();
console.log('🤖 Travel Helper Bot is running...');
console.log('📱 Try /start in Telegram');