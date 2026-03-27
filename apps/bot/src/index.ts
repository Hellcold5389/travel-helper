import { Bot, GrammyError } from 'grammy';
import { Menu } from '@grammyjs/menu';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 強制覆蓋已存在的環境變量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3001';

console.log('🔑 BOT_TOKEN loaded:', BOT_TOKEN?.substring(0, 10) + '...');
console.log('🌐 API_URL:', API_URL);

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ============================================
// Whitelist - Only allowed users can use the bot
// ============================================
const ALLOWED_USERS = ['213966132']; // 測試階段白名單

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id?.toString();
  
  if (!ALLOWED_USERS.includes(userId || '')) {
    console.log(`🚫 Blocked user: ${userId}`);
    return; // 不回應非白名單用戶
  }
  
  return next();
});

console.log('🛡️ Whitelist enabled. Allowed users:', ALLOWED_USERS);

// ============================================
// API Client
// ============================================

async function fetchAPI<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error(`API fetch error for ${endpoint}:`, error);
    return null;
  }
}

// ============================================
// Debug: Log all incoming updates
// ============================================
bot.use(async (ctx, next) => {
  console.log('📩 Update received:', JSON.stringify({
    update_id: ctx.update.update_id,
    message: ctx.message ? {
      text: ctx.message.text,
      from: ctx.message.from?.username,
      chat_id: ctx.message.chat.id,
      entities: ctx.message.entities
    } : 'no message',
    edited_message: ctx.editedMessage ? 'edited' : undefined,
    callback_query: ctx.callbackQuery ? 'callback' : undefined
  }, null, 2));
  try {
    await next();
    console.log('✅ next() completed for update', ctx.update.update_id);
  } catch (err) {
    console.error('❌ Middleware error:', err);
  }
});

// ============================================
// Rate Limiting
// ============================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 分鐘
const RATE_LIMIT_MAX_REQUESTS = 10; // 每分鐘最多 10 次

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return next();
  
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    // 重置計數器
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    // 超過限制
    const waitSeconds = Math.ceil((userLimit.resetAt - now) / 1000);
    console.log(`⚠️ Rate limited: ${userId} (${waitSeconds}s remaining)`);
    await ctx.reply(`⏳ 請求過於頻繁，請等待 ${waitSeconds} 秒後再試`);
    return;
  }
  
  // 增加計數
  userLimit.count++;
  return next();
});

// 定期清理過期的 rate limit 記錄（每 5 分鐘）
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetAt) {
      rateLimitMap.delete(userId);
    }
  }
}, 5 * 60 * 1000);

console.log('🛡️ Rate limiting enabled: 10 requests/minute per user');

// ============================================
// Country emoji flags cache
// ============================================
let countryFlagsCache: Record<string, string> = {};

async function loadCountryFlags() {
  const countries = await fetchAPI<Array<{ code: string; flagEmoji: string | null }>>('/api/countries');
  if (countries) {
    countryFlagsCache = {};
    for (const c of countries) {
      if (c.flagEmoji) {
        countryFlagsCache[c.code] = c.flagEmoji;
      }
    }
  }
}

// Load on startup
loadCountryFlags();

// ============================================
// Commands
// ============================================

// ============================================
// Passport Management Commands (Phase 2)
// ============================================

// Passport state for multi-step input
const passportSessions = new Map<string, {
  step: 'passportNo' | 'fullName' | 'dateOfBirth' | 'issueDate' | 'expiryDate' | 'issuingCountry';
  data: {
    passportNo?: string;
    fullName?: string;
    dateOfBirth?: string;
    issueDate?: string;
    expiryDate?: string;
    issuingCountry?: string;
  };
}>();

bot.command('passport', async (ctx) => {
  const subCommand = ctx.match?.trim().toLowerCase();
  const telegramId = ctx.from?.id?.toString();

  if (!telegramId) return;

  // /passport add - start guided input
  if (subCommand === 'add') {
    passportSessions.set(telegramId, {
      step: 'passportNo',
      data: {},
    });

    await ctx.reply(
      '📝 新增護照資訊\n\n' +
      '請輸入您的護照號碼：\n' +
      '（例如：123456789）'
    );
    return;
  }

  // /passport delete - delete passport
  if (subCommand === 'delete') {
    try {
      const response = await fetch(`${API_URL}/api/user/passport`, {
        method: 'DELETE',
        headers: {
          'x-telegram-id': telegramId,
        },
      });
      const data = await response.json();

      if (data.success) {
        await ctx.reply('✅ 護照資訊已刪除');
      } else {
        await ctx.reply(`❌ ${data.error || '刪除失敗'}`);
      }
    } catch (err) {
      console.error('Error deleting passport:', err);
      await ctx.reply('❌ 刪除護照資訊時發生錯誤');
    }
    return;
  }

  // /passport - view passport info
  try {
    const response = await fetch(`${API_URL}/api/user/passport`, {
      headers: {
        'x-telegram-id': telegramId,
      },
    });
    const data = await response.json();

    if (!data.success) {
      await ctx.reply(`❌ ${data.error || '查詢失敗'}`);
      return;
    }

    if (!data.data) {
      await ctx.reply(
        '📝 您尚未設定護照資訊\n\n' +
        '使用 /passport add 新增護照'
      );
      return;
    }

    const passport = data.data;
    let message = '📋 護照資訊\n\n';
    message += `護照號碼：${passport.passportNo}\n`;
    message += `姓名：${passport.fullName}\n`;
    if (passport.dateOfBirth) message += `出生日期：${passport.dateOfBirth}\n`;
    if (passport.issueDate) message += `發行日期：${passport.issueDate}\n`;
    message += `到期日：${passport.expiryDate}\n`;
    message += `發行國家：${passport.issuingCountry || 'TW'}\n`;

    if (passport.warning) {
      message += `\n⚠️ ${passport.warning}`;
    } else {
      message += `\n✅ 護照效期正常（剩餘 ${passport.daysUntilExpiry} 天）`;
    }

    await ctx.reply(message);
  } catch (err) {
    console.error('Error fetching passport:', err);
    await ctx.reply('❌ 查詢護照資訊時發生錯誤');
  }
});

// Handle passport multi-step input
bot.on('message:text', async (ctx, next) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return next();

  const session = passportSessions.get(telegramId);
  if (!session) return next();

  const text = ctx.message.text.trim();

  // Cancel command
  if (text.toLowerCase() === 'cancel' || text.toLowerCase() === '取消') {
    passportSessions.delete(telegramId);
    await ctx.reply('❌ 已取消護照設定');
    return;
  }

  // Store current step data
  session.data[session.step] = text;

  // Move to next step
  const steps: Array<'passportNo' | 'fullName' | 'dateOfBirth' | 'issueDate' | 'expiryDate' | 'issuingCountry'> = 
    ['passportNo', 'fullName', 'dateOfBirth', 'issueDate', 'expiryDate', 'issuingCountry'];
  const currentIndex = steps.indexOf(session.step);
  
  if (currentIndex < steps.length - 1) {
    session.step = steps[currentIndex + 1];
    passportSessions.set(telegramId, session);

    const prompts: Record<string, string> = {
      fullName: '請輸入護照上的英文姓名：\n（例如：WANG, XIAO-MING）',
      dateOfBirth: '請輸入出生日期：\n（格式：YYYY-MM-DD，例如：1990-01-15）',
      issueDate: '請輸入護照發行日期：\n（格式：YYYY-MM-DD）',
      expiryDate: '請輸入護照到期日：\n（格式：YYYY-MM-DD）',
      issuingCountry: '請輸入發行國家代碼：\n（例如：TW、US、JP，預設為 TW）',
    };

    await ctx.reply(prompts[session.step] || '請輸入：');
    return;
  }

  // All data collected, save to API
  try {
    const response = await fetch(`${API_URL}/api/user/passport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-id': telegramId,
      },
      body: JSON.stringify({
        passportNo: session.data.passportNo,
        fullName: session.data.fullName,
        dateOfBirth: session.data.dateOfBirth,
        issueDate: session.data.issueDate,
        expiryDate: session.data.expiryDate,
        issuingCountry: session.data.issuingCountry || 'TW',
      }),
    });
    const data = await response.json();

    passportSessions.delete(telegramId);

    if (data.success) {
      let message = '✅ 護照資訊已儲存\n\n';
      message += `護照號碼：${data.data.passportNo}\n`;
      message += `到期日：${data.data.expiryDate}\n`;
      
      if (data.data.warning) {
        message += `\n⚠️ ${data.data.warning}`;
      }
      
      await ctx.reply(message);
    } else {
      await ctx.reply(`❌ ${data.error || '儲存失敗'}`);
    }
  } catch (err) {
    console.error('Error saving passport:', err);
    passportSessions.delete(telegramId);
    await ctx.reply('❌ 儲存護照資訊時發生錯誤');
  }
});

// ============================================
// Prohibited Items Checker Command (Phase 2)
// ============================================

bot.command('check', async (ctx) => {
  const args = ctx.match?.trim().split(/\s+/);
  
  if (!args || args.length < 2) {
    await ctx.reply(
      '📋 禁帶物品檢查\n\n' +
      '用法：/check <國家代碼> <物品1> <物品2> ...\n' +
      '例如：/check JP 感冒藥 肉乾 口香糖\n\n' +
      '支援的國家代碼：JP, KR, TH, SG, US, MY, VN, HK, MO 等'
    );
    return;
  }

  const countryCode = args[0].toUpperCase();
  const items = args.slice(1);

  try {
    const response = await fetch(`${API_URL}/api/legal/${countryCode}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    const data = await response.json();

    if (!data.success) {
      await ctx.reply(`❌ ${data.error || '查詢失敗'}`);
      return;
    }

    const result = data.data;
    const flag = result.flagEmoji || '🌍';
    const countryName = result.countryNameZh || result.countryName;

    let message = `${flag} ${countryName} - 禁帶物品檢查結果\n\n`;
    message += `檢查項目：${result.summary.total} 項\n\n`;

    if (result.prohibited.length > 0) {
      message += `🔴 禁止攜帶（${result.prohibited.length} 項）\n`;
      for (const item of result.prohibited) {
        message += `• ${item.item}\n`;
        if (item.reason) message += `  原因：${item.reason}\n`;
      }
      message += '\n';
    }

    if (result.restricted.length > 0) {
      message += `🟡 限制攜帶（${result.restricted.length} 項）\n`;
      for (const item of result.restricted) {
        message += `• ${item.item}\n`;
        if (item.notes) message += `  說明：${item.notes.substring(0, 50)}...\n`;
        if (item.permitInfo) message += `  許可：${item.permitInfo}\n`;
      }
      message += '\n';
    }

    if (result.safe.length > 0) {
      message += `✅ 可攜帶（${result.safe.length} 項）\n`;
      message += result.safe.map((i: { item: string }) => i.item).join('、');
      message += '\n';
    }

    message += '\n⚠️ 實際規定以海關公告為準，建議出發前再次確認';

    await ctx.reply(message);
  } catch (err) {
    console.error('Error checking items:', err);
    await ctx.reply('❌ 檢查禁帶物品時發生錯誤');
  }
});

// ============================================
// Policy Changes Command (Phase 2)
// ============================================

bot.command('policy', async (ctx) => {
  const countryCode = ctx.match?.trim().toUpperCase();

  try {
    let url = `${API_URL}/api/policy-changes?limit=10`;
    if (countryCode) {
      url = `${API_URL}/api/policy-changes/${countryCode}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      await ctx.reply(`❌ ${data.error || '查詢失敗'}`);
      return;
    }

    const policyChanges = data.data.policyChanges;

    if (!policyChanges || policyChanges.length === 0) {
      await ctx.reply(
        countryCode 
          ? `${countryCode} 暫無政策變更資訊` 
          : '暫無政策變更資訊'
      );
      return;
    }

    let message = '📰 最新政策變更\n\n';

    for (const change of policyChanges.slice(0, 5)) {
      const flag = change.flagEmoji || '🌍';
      const countryName = change.countryNameZh || change.countryName || change.countryCode;
      
      const typeEmoji: Record<string, string> = {
        VISA: '🛂',
        LEGAL: '⚖️',
        CUSTOMS: '📦',
      };
      
      message += `${flag} ${countryName} ${typeEmoji[change.type] || '📋'}\n`;
      message += `${change.title}\n`;
      message += `生效日期：${change.effectiveDate}\n\n`;
    }

    if (policyChanges.length > 5) {
      message += `... 還有 ${policyChanges.length - 5} 項政策變更\n`;
    }

    message += '\n使用 /policy <國家代碼> 查看特定國家';

    await ctx.reply(message);
  } catch (err) {
    console.error('Error fetching policy changes:', err);
    await ctx.reply('❌ 查詢政策變更時發生錯誤');
  }
});

// ============================================
// Notifications Command (Phase 2)
// ============================================

bot.command('notifications', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_URL}/api/reminders/notifications`, {
      headers: {
        'x-telegram-id': telegramId,
      },
    });
    const data = await response.json();

    if (!data.success) {
      await ctx.reply(`❌ ${data.error || '查詢失敗'}`);
      return;
    }

    const notifications = data.data;

    if (!notifications || notifications.length === 0) {
      await ctx.reply('📭 沒有新通知');
      return;
    }

    const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

    let message = `📬 通知（${unreadCount} 則未讀）\n\n`;

    for (const notif of notifications.slice(0, 5)) {
      const readStatus = notif.isRead ? '✓' : '🔴';
      message += `${readStatus} ${notif.title}\n`;
      message += `${notif.message.substring(0, 100)}...\n\n`;
    }

    if (notifications.length > 5) {
      message += `... 還有 ${notifications.length - 5} 則通知\n`;
    }

    await ctx.reply(message);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    await ctx.reply('❌ 查詢通知時發生錯誤');
  }
});

// ============================================
// Trip Planning Conversation Flow (Phase 2)
// ============================================

// Style options for multi-select
const STYLE_OPTIONS = [
  { key: 'CULTURE', label: '🏛️ 文化古蹟' },
  { key: 'FOOD', label: '🍜 美食探索' },
  { key: 'SHOPPING', label: '🛍️ 購物' },
  { key: 'ACTIVITY', label: '🎢 主題樂園' },
  { key: 'NATURE', label: '🌲 自然風景' },
  { key: 'RELAX', label: '💆 放鬆休閒' },
  { key: 'NIGHTLIFE', label: '🍻 夜生活' },
  { key: 'PHOTOGRAPHY', label: '📷 打卡拍照' },
];

// Nationality options
const NATIONALITY_OPTIONS = [
  { code: 'TW', label: '🇹🇼 台灣' },
  { code: 'HK', label: '🇭🇰 香港' },
  { code: 'MO', label: '🇲🇴 澳門' },
  { code: 'CN', label: '🇨🇳 中國' },
  { code: 'US', label: '🇺🇸 美國' },
  { code: 'JP', label: '🇯🇵 日本' },
  { code: 'KR', label: '🇰🇷 韓國' },
  { code: 'SG', label: '🇸🇬 新加坡' },
  { code: 'MY', label: '🇲🇾 馬來西亞' },
  { code: 'OTHER', label: '🌍 其他地區' },
];

// /plan command - Start trip planning conversation
bot.command('plan', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Create a new draft
    const response = await fetch(`${API_URL}/api/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramUserId: telegramId }),
    });
    const data = await response.json();

    if (!data.success) {
      await ctx.reply('❌ 無法開始行程規劃，請稍後再試');
      return;
    }

    // Ask for nationality first
    const nationalityButtons = NATIONALITY_OPTIONS.map(n => [{ text: n.label, callback_data: `nationality:${n.code}` }]);
    
    await ctx.reply(
      '🗺️ **開始規劃你的旅程！**\n\n' +
      '首先，請選擇你的護照國籍：',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: nationalityButtons,
        },
      }
    );
  } catch (err) {
    console.error('Error starting trip plan:', err);
    await ctx.reply('❌ 開始行程規劃時發生錯誤');
  }
});

// Handle callback queries for trip planning
bot.on('callback_query:data', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  const data = ctx.callbackQuery.data;
  console.log('🔘 Callback query:', data);

  try {
    // Handle set nationality (from /start or /settings)
    if (data.startsWith('set_nationality:')) {
      const nationality = data.split(':')[1];
      
      // Save to API
      const response = await fetch(`${API_URL}/api/user/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-id': telegramId,
        },
        body: JSON.stringify({ nationality }),
      });
      const result = await response.json();

      if (!result.success) {
        await ctx.answerCallbackQuery('❌ 儲存失敗，請稍後再試');
        return;
      }

      await ctx.answerCallbackQuery();

      // Find the label for the selected nationality
      const selectedOption = NATIONALITY_OPTIONS.find(n => n.code === nationality);
      const nationalityLabel = selectedOption?.label || nationality;

      await ctx.editMessageText(
        `✅ 已設定你的護照國籍：${nationalityLabel}\n\n` +
        '🌍 **Travel Helper Bot**\n\n' +
        '現在你可以使用以下功能：\n' +
        '/plan - AI 行程規劃\n' +
        '/visa <國家> - 簽證查詢\n' +
        '/legal <國家> - 法律禁忌\n' +
        '/funfacts <國家> - 趣味知識\n' +
        '/settings - 修改國籍設定',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Handle nationality selection (from /plan flow)
    if (data.startsWith('nationality:')) {
      const nationality = data.split(':')[1];
      
      // Update draft with nationality
      const response = await fetch(`${API_URL}/api/draft/${telegramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationality, step: 'DESTINATION' }),
      });
      const result = await response.json();

      if (!result.success) {
        await ctx.answerCallbackQuery('❌ 發生錯誤，請重新開始');
        return;
      }

      await ctx.answerCallbackQuery();

      // Find the label for the selected nationality
      const selectedOption = NATIONALITY_OPTIONS.find(n => n.code === nationality);
      const nationalityLabel = selectedOption?.label || nationality;

      await ctx.editMessageText(
        `✅ 已選擇：${nationalityLabel}\n\n` +
        '🗺️ **請告訴我你想去哪裡？**\n\n' +
        '例如：東京、首爾、曼谷、新加坡、巴黎、紐約...',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Handle days selection
    if (data.startsWith('days:')) {
      const daysValue = data.split(':')[1];
      let days = 0;

      if (daysValue === '1-3') days = 3;
      else if (daysValue === '4-5') days = 5;
      else if (daysValue === '7+') days = 7;
      else days = parseInt(daysValue, 10);

      // Update draft
      const response = await fetch(`${API_URL}/api/draft/${telegramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, step: 'BUDGET' }),
      });
      const result = await response.json();

      if (!result.success) {
        await ctx.answerCallbackQuery('❌ 發生錯誤，請重新開始');
        return;
      }

      await ctx.answerCallbackQuery();

      // Ask about budget
      await ctx.editMessageText(
        '💰 **請選擇你的預算等級：**',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '省錢背包客 💸', callback_data: 'budget:LOW' }],
              [{ text: '一般旅遊 💵', callback_data: 'budget:MEDIUM' }],
              [{ text: '不設上限 💎', callback_data: 'budget:HIGH' }],
            ],
          },
        }
      );
      return;
    }

    // Handle budget selection
    if (data.startsWith('budget:')) {
      const budget = data.split(':')[1] as 'LOW' | 'MEDIUM' | 'HIGH';

      // Update draft
      const response = await fetch(`${API_URL}/api/draft/${telegramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget, step: 'STYLE' }),
      });
      const result = await response.json();

      if (!result.success) {
        await ctx.answerCallbackQuery('❌ 發生錯誤，請重新開始');
        return;
      }

      await ctx.answerCallbackQuery();

      // Ask about travel style (multi-select)
      const styleButtons = STYLE_OPTIONS.map(style => [{
        text: style.label,
        callback_data: `style:${style.key}`,
      }]);

      // Add done button
      styleButtons.push([{ text: '✅ 完成，開始生成行程', callback_data: 'style:done' }]);

      await ctx.editMessageText(
        '🎭 **請選擇你的旅遊風格（可多選）：**\n\n' +
        '選擇感興趣的風格，完成後點擊下方按鈕開始生成行程。',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: styleButtons,
          },
        }
      );
      return;
    }

    // Handle style selection
    if (data.startsWith('style:')) {
      const styleValue = data.split(':')[1];

      if (styleValue === 'done') {
        // Generate trip
        await ctx.answerCallbackQuery('⏳ 正在生成行程...');
        await ctx.editMessageText('⏳ **正在為你生成專屬行程，請稍候...**\n\n這可能需要 10-20 秒', { parse_mode: 'Markdown' });

        // Call generate API
        const genResponse = await fetch(`${API_URL}/api/trips/generate-from-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramUserId: telegramId }),
        });
        const genResult = await genResponse.json();

        if (!genResult.success) {
          await ctx.editMessageText(`❌ 生成行程失敗：${genResult.error || '請稍後再試'}`);
          return;
        }

        // Format and send the itinerary
        const trip = genResult.data;
        const flag = countryFlagsCache[trip.countryCode] || '🌍';
        
        let message = `${flag} **${trip.destination} ${trip.days} 天行程**\n\n`;
        
        // Add fun facts if available
        if (trip.funFacts && trip.funFacts.length > 0) {
          message += `🎯 **Fun Facts**\n`;
          for (const fact of trip.funFacts.slice(0, 2)) {
            message += `• ${fact.content.substring(0, 100)}${fact.content.length > 100 ? '...' : ''}\n`;
          }
          message += '\n';
        }

        // Add warnings if available
        if (trip.warnings && trip.warnings.length > 0) {
          message += `⚠️ **注意事項**\n`;
          for (const warning of trip.warnings) {
            message += `• ${warning.title}\n`;
          }
          message += '\n';
        }

        // Add itinerary (truncated for Telegram)
        const itineraryLines = trip.itineraryText.split('\n');
        const maxLines = 50;
        let itineraryText = itineraryLines.slice(0, maxLines).join('\n');
        if (itineraryLines.length > maxLines) {
          itineraryText += `\n\n... 還有更多內容，完整行程請查看下方`;
        }

        message += itineraryText;

        // Send in chunks if too long
        if (message.length > 4000) {
          const chunks = [];
          let current = `${flag} **${trip.destination} ${trip.days} 天行程**\n\n`;
          
          if (trip.funFacts && trip.funFacts.length > 0) {
            current += `🎯 **Fun Facts**\n`;
            for (const fact of trip.funFacts.slice(0, 2)) {
              current += `• ${fact.content.substring(0, 100)}${fact.content.length > 100 ? '...' : ''}\n`;
            }
            current += '\n';
          }

          if (trip.warnings && trip.warnings.length > 0) {
            current += `⚠️ **注意事項**\n`;
            for (const warning of trip.warnings) {
              current += `• ${warning.title}\n`;
            }
            current += '\n';
          }

          chunks.push(current);

          // Split itinerary into chunks
          const itineraryChunk = trip.itineraryText;
          for (let i = 0; i < itineraryChunk.length; i += 3500) {
            chunks.push(itineraryChunk.slice(i, i + 3500));
          }

          for (const chunk of chunks) {
            await ctx.reply(chunk, { parse_mode: 'Markdown' });
          }
        } else {
          await ctx.editMessageText(message, { parse_mode: 'Markdown' });
        }

        // Add options to continue
        await ctx.reply(
          '🎉 行程已生成！\n\n' +
          '你可以：\n' +
          '• 使用 /plan 重新規劃\n' +
          '• 使用 /visa ' + trip.countryCode + ' 查詢簽證資訊\n' +
          '• 使用 /legal ' + trip.countryCode + ' 查詢法律禁忌\n' +
          '• 使用 /funfacts ' + trip.countryCode + ' 查看更多趣聞',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🔍 查詢簽證', callback_data: `quickvisa:${trip.countryCode}` },
                  { text: '⚖️ 法律禁忌', callback_data: `quicklegal:${trip.countryCode}` },
                ],
              ],
            },
          }
        );
        return;
      }

      // Toggle style selection
      const draftResponse = await fetch(`${API_URL}/api/draft/${telegramId}`);
      const draftResult = await draftResponse.json();

      if (!draftResult.success) {
        await ctx.answerCallbackQuery('❌ 發生錯誤，請重新開始');
        return;
      }

      const currentStyles: string[] = (draftResult.data.travelStyles as string[]) || [];
      let newStyles: string[];

      if (currentStyles.includes(styleValue)) {
        // Remove style
        newStyles = currentStyles.filter(s => s !== styleValue);
      } else {
        // Add style
        newStyles = [...currentStyles, styleValue];
      }

      // Update draft
      await fetch(`${API_URL}/api/draft/${telegramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelStyles: newStyles }),
      });

      // Update keyboard with checkmarks
      const styleButtons = STYLE_OPTIONS.map(style => [{
        text: newStyles.includes(style.key) ? `✅ ${style.label}` : style.label,
        callback_data: `style:${style.key}`,
      }]);

      styleButtons.push([{ text: '✅ 完成，開始生成行程', callback_data: 'style:done' }]);

      await ctx.answerCallbackQuery(newStyles.includes(styleValue) ? `已選擇 ${styleValue}` : `已取消 ${styleValue}`);
      await ctx.editMessageReplyMarkup({
        reply_markup: {
          inline_keyboard: styleButtons,
        },
      });
      return;
    }

    // Handle quick visa/legal queries
    if (data.startsWith('quickvisa:')) {
      const countryCode = data.split(':')[1];
      await ctx.answerCallbackQuery();
      // Trigger visa command
      ctx.match = countryCode;
      await ctx.reply(`查詢 ${countryCode} 簽證資訊...`);
      // We'll handle this by fetching directly
      const visa = await fetchAPI<{
        countryCode: string;
        countryName: string;
        countryNameZh: string | null;
        flagEmoji: string | null;
        requirementText: string;
        durationDays: number | null;
        durationNote: string | null;
        passportValidity: string | null;
        notes: string | null;
      }>(`/api/visa/TW/${countryCode}`);

      if (visa) {
        const flag = visa.flagEmoji || countryFlagsCache[countryCode] || '🌍';
        const countryName = visa.countryNameZh || visa.countryName;
        // Get nationality label
    const nationalityLabel = NATIONALITY_OPTIONS.find(n => n.code === nationality)?.label || nationality;
    
    let message = `${flag} ${countryName} 簽證資訊（${nationalityLabel}護照）\n\n`;
        message += `簽證狀態：${visa.requirementText}\n`;
        if (visa.durationDays) {
          message += `停留期限：${visa.durationDays} 天\n`;
        }
        if (visa.passportValidity) {
          message += `護照效期：${visa.passportValidity}\n`;
        }
        await ctx.reply(message);
      } else {
        await ctx.reply('❌ 無法獲取簽證資訊');
      }
      return;
    }

    if (data.startsWith('quicklegal:')) {
      const countryCode = data.split(':')[1];
      await ctx.answerCallbackQuery();
      const legal = await fetchAPI<{
        countryCode: string;
        countryName: string;
        countryNameZh: string | null;
        flagEmoji: string | null;
        restrictions: Array<{
          severityText: string;
          title: string;
          description: string;
        }>;
      }>(`/api/legal/${countryCode}`);

      if (legal) {
        const flag = legal.flagEmoji || countryFlagsCache[countryCode] || '🌍';
        const countryName = legal.countryNameZh || legal.countryName;
        let message = `${flag} ${countryName} - 重要禁忌\n\n`;
        for (const r of legal.restrictions.slice(0, 5)) {
          message += `${r.severityText} ${r.title}\n${r.description.substring(0, 80)}...\n\n`;
        }
        await ctx.reply(message);
      } else {
        await ctx.reply('❌ 無法獲取法律資訊');
      }
      return;
    }

    // Unknown callback
    await ctx.answerCallbackQuery('未知操作');
  } catch (err) {
    console.error('Error handling callback:', err);
    await ctx.answerCallbackQuery('❌ 發生錯誤');
  }
});

// Handle text messages for trip planning conversation
bot.on('message:text', async (ctx, next) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return next();

  const text = ctx.message.text.trim();

  // Skip if it's a command
  if (text.startsWith('/')) return next();

  // Check if user has an active draft
  try {
    const draftResponse = await fetch(`${API_URL}/api/draft/${telegramId}`);
    const draftResult = await draftResponse.json();

    // No active draft or draft expired - continue to next handler
    if (!draftResult.success) return next();

    const draft = draftResult.data;

    // Handle DESTINATION step
    if (draft.step === 'DESTINATION') {
      // Match destination
      const matchResponse = await fetch(`${API_URL}/api/draft/match-destination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: text }),
      });
      const matchResult = await matchResponse.json();

      if (!matchResult.success) {
        await ctx.reply(
          '❌ 抱歉，我無法識別這個目的地。\n\n' +
          '請輸入城市或國家名稱，例如：\n' +
          '東京、首爾、曼谷、新加坡、巴黎、紐約...'
        );
        return;
      }

      const { countryCode, city, countryName, countryNameZh } = matchResult.data;
      const destinationName = city || countryNameZh || countryName || text;

      // Update draft with destination info
      await fetch(`${API_URL}/api/draft/${telegramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destinationName,
          countryCode,
          city,
          step: 'DAYS',
        }),
      });

      const flag = countryFlagsCache[countryCode] || '🌍';

      await ctx.reply(
        `${flag} 太棒了！**${destinationName}** 是個不錯的選擇！\n\n` +
        '請問你計劃去幾天？',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '1-3天', callback_data: 'days:1-3' }],
              [{ text: '4-5天', callback_data: 'days:4-5' }],
              [{ text: '一週以上', callback_data: 'days:7+' }],
            ],
          },
        }
      );
      return;
    }

    // Handle special requests input (optional)
    if (draft.step === 'STYLE') {
      // This could be special requests
      await fetch(`${API_URL}/api/draft/${telegramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialRequests: text }),
      });

      await ctx.reply('✅ 已記錄你的特別需求！');
      return;
    }

    // Not in a trip planning conversation - continue to next handler
    return next();
  } catch (err) {
    console.error('Error handling trip conversation:', err);
    return next();
  }
});

// Start command
bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Check if user has set nationality
    const userResponse = await fetch(`${API_URL}/api/user/settings`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const userData = await userResponse.json();

    // If no nationality set, ask for it first
    if (!userData.success || !userData.data?.nationality) {
      const nationalityButtons = NATIONALITY_OPTIONS.map(n => [{ text: n.label, callback_data: `set_nationality:${n.code}` }]);
      
      await ctx.reply(
        '👋 **歡迎使用 Travel Helper Bot！**\n\n' +
        '首先，請選擇你的護照國籍：\n' +
        '（這會影響簽證查詢、法律禁忌等功能的結果）',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: nationalityButtons,
          },
        }
      );
      return;
    }

    // User has nationality set, show main menu
    const nationalityLabel = NATIONALITY_OPTIONS.find(n => n.code === userData.data.nationality)?.label || userData.data.nationality;
    
    await ctx.reply(
      `🌍 Travel Helper Bot\n\n` +
      `你的護照國籍：${nationalityLabel}\n\n` +
      `📍 可用命令：\n` +
      `/plan - 🆕 AI 行程規劃（對話式）\n` +
      `/visa <國家代碼> - 查詢簽證資訊\n` +
      `/legal <國家代碼> - 查詢法律禁忌\n` +
      `/funfacts <國家代碼> - 趣味知識\n` +
      `/passport - 護照管理\n` +
      `/check <國家> <物品...> - 禁帶物品檢查\n` +
      `/settings - 修改國籍設定\n` +
      `/help - 幫助`
    );
    console.log('✅ /start command replied');
  } catch (err) {
    console.error('❌ Error in /start command:', err);
    await ctx.reply('⚠️ 發生錯誤，請稍後再試');
  }
});

// /settings command - Full settings menu
bot.command('settings', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Get user settings
    const settingsResponse = await fetch(`${API_URL}/api/user/settings`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const settingsData = await settingsResponse.json();

    // Get user preferences
    const prefsResponse = await fetch(`${API_URL}/api/user/preferences`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const prefsData = await prefsResponse.json();

    const nationality = settingsData.data?.nationality || 'TW';
    const nationalityLabel = NATIONALITY_OPTIONS.find(n => n.code === nationality)?.label || nationality;

    let message = `⚙️ **設定中心**\n\n`;
    message += `🛂 **護照國籍**：${nationalityLabel}\n`;
    
    if (prefsData.success && prefsData.data) {
      const prefs = prefsData.data;
      message += `🌐 **語言**：${prefs.language === 'zh' ? '中文' : prefs.language}\n`;
      message += `💱 **貨幣**：${prefs.currency}\n`;
      message += `🔔 **通知設定**：\n`;
      message += `  • 簽證到期提醒：${prefs.visaExpiry ? '✅' : '❌'}\n`;
      message += `  • 政策變更通知：${prefs.policyChanges ? '✅' : '❌'}\n`;
      message += `  • 行程提醒：${prefs.tripReminders ? '✅' : '❌'}\n`;
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛂 修改護照國籍', callback_data: 'settings:nationality' }],
          [{ text: '🔔 通知設定', callback_data: 'settings:notifications' }],
          [{ text: '🌐 語言/貨幣', callback_data: 'settings:locale' }],
        ],
      },
    });
  } catch (err) {
    console.error('Error in /settings:', err);
    await ctx.reply('❌ 載入設定時發生錯誤');
  }
});

// Handle settings callbacks
bot.on('callback_query:data', async (ctx, next) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return next();

  const data = ctx.callbackQuery.data;

  // Settings callbacks
  if (data === 'settings:nationality') {
    await ctx.answerCallbackQuery();
    const nationalityButtons = NATIONALITY_OPTIONS.map(n => [{ text: n.label, callback_data: `set_nationality:${n.code}` }]);
    await ctx.editMessageText(
      '🛂 **選擇你的護照國籍**：',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: nationalityButtons,
        },
      }
    );
    return;
  }

  if (data === 'settings:notifications') {
    await ctx.answerCallbackQuery();
    
    // Get current preferences
    const prefsResponse = await fetch(`${API_URL}/api/user/preferences`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const prefsData = await prefsResponse.json();
    const prefs = prefsData.data || {};

    await ctx.editMessageText(
      '🔔 **通知設定**\n\n點擊切換開關：',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: `${prefs.visaExpiry ? '✅' : '❌'} 簽證到期提醒`, callback_data: `toggle:visaExpiry:${!prefs.visaExpiry}` }],
            [{ text: `${prefs.policyChanges ? '✅' : '❌'} 政策變更通知`, callback_data: `toggle:policyChanges:${!prefs.policyChanges}` }],
            [{ text: `${prefs.tripReminders ? '✅' : '❌'} 行程提醒`, callback_data: `toggle:tripReminders:${!prefs.tripReminders}` }],
            [{ text: '🔙 返回', callback_data: 'settings:back' }],
          ],
        },
      }
    );
    return;
  }

  if (data === 'settings:locale') {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      '🌐 **語言/貨幣設定**：',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇹🇼 繁體中文', callback_data: 'setlang:zh' }],
            [{ text: '🇺🇸 English', callback_data: 'setlang:en' }],
            [{ text: '💱 貨幣設定', callback_data: 'settings:currency' }],
            [{ text: '🔙 返回', callback_data: 'settings:back' }],
          ],
        },
      }
    );
    return;
  }

  if (data === 'settings:currency') {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      '💱 **選擇預設貨幣**：',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇹🇼 TWD 新台幣', callback_data: 'setcurr:TWD' }],
            [{ text: '🇭🇰 HKD 港幣', callback_data: 'setcurr:HKD' }],
            [{ text: '🇺🇸 USD 美金', callback_data: 'setcurr:USD' }],
            [{ text: '🇯🇵 JPY 日圓', callback_data: 'setcurr:JPY' }],
            [{ text: '🔙 返回', callback_data: 'settings:locale' }],
          ],
        },
      }
    );
    return;
  }

  if (data === 'settings:back') {
    await ctx.answerCallbackQuery();
    // Re-trigger /settings
    ctx.match = '';
    // Just show the settings menu again
    const settingsResponse = await fetch(`${API_URL}/api/user/settings`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const settingsData = await settingsResponse.json();
    const prefsResponse = await fetch(`${API_URL}/api/user/preferences`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const prefsData = await prefsResponse.json();

    const nationality = settingsData.data?.nationality || 'TW';
    const nationalityLabel = NATIONALITY_OPTIONS.find(n => n.code === nationality)?.label || nationality;

    let message = `⚙️ **設定中心**\n\n`;
    message += `🛂 **護照國籍**：${nationalityLabel}\n`;
    
    if (prefsData.success && prefsData.data) {
      const prefs = prefsData.data;
      message += `🌐 **語言**：${prefs.language === 'zh' ? '中文' : prefs.language}\n`;
      message += `💱 **貨幣**：${prefs.currency}\n`;
      message += `🔔 **通知設定**：\n`;
      message += `  • 簽證到期提醒：${prefs.visaExpiry ? '✅' : '❌'}\n`;
      message += `  • 政策變更通知：${prefs.policyChanges ? '✅' : '❌'}\n`;
      message += `  • 行程提醒：${prefs.tripReminders ? '✅' : '❌'}\n`;
    }

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛂 修改護照國籍', callback_data: 'settings:nationality' }],
          [{ text: '🔔 通知設定', callback_data: 'settings:notifications' }],
          [{ text: '🌐 語言/貨幣', callback_data: 'settings:locale' }],
        ],
      },
    });
    return;
  }

  // Toggle notification settings
  if (data.startsWith('toggle:')) {
    const [, key, value] = data.split(':');
    const boolValue = value === 'true';

    await fetch(`${API_URL}/api/user/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-id': telegramId,
      },
      body: JSON.stringify({ [key]: boolValue }),
    });

    await ctx.answerCallbackQuery(`已${boolValue ? '開啟' : '關閉'}`);

    // Refresh the notifications menu
    const prefsResponse = await fetch(`${API_URL}/api/user/preferences`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const prefsData = await prefsResponse.json();
    const prefs = prefsData.data || {};

    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: [
          [{ text: `${prefs.visaExpiry ? '✅' : '❌'} 簽證到期提醒`, callback_data: `toggle:visaExpiry:${!prefs.visaExpiry}` }],
          [{ text: `${prefs.policyChanges ? '✅' : '❌'} 政策變更通知`, callback_data: `toggle:policyChanges:${!prefs.policyChanges}` }],
          [{ text: `${prefs.tripReminders ? '✅' : '❌'} 行程提醒`, callback_data: `toggle:tripReminders:${!prefs.tripReminders}` }],
          [{ text: '🔙 返回', callback_data: 'settings:back' }],
        ],
      },
    });
    return;
  }

  // Set language
  if (data.startsWith('setlang:')) {
    const lang = data.split(':')[1];
    await fetch(`${API_URL}/api/user/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-id': telegramId,
      },
      body: JSON.stringify({ language: lang }),
    });
    await ctx.answerCallbackQuery(`已設定語言為 ${lang === 'zh' ? '中文' : 'English'}`);
    
    // Refresh locale menu
    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: [
          [{ text: `${lang === 'zh' ? '✅ ' : ''}🇹🇼 繁體中文`, callback_data: 'setlang:zh' }],
          [{ text: `${lang === 'en' ? '✅ ' : ''}🇺🇸 English`, callback_data: 'setlang:en' }],
          [{ text: '💱 貨幣設定', callback_data: 'settings:currency' }],
          [{ text: '🔙 返回', callback_data: 'settings:back' }],
        ],
      },
    });
    return;
  }

  // Set currency
  if (data.startsWith('setcurr:')) {
    const curr = data.split(':')[1];
    await fetch(`${API_URL}/api/user/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-id': telegramId,
      },
      body: JSON.stringify({ currency: curr }),
    });
    await ctx.answerCallbackQuery(`已設定貨幣為 ${curr}`);
    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: [
          [{ text: `${curr === 'TWD' ? '✅ ' : ''}🇹🇼 TWD 新台幣`, callback_data: 'setcurr:TWD' }],
          [{ text: `${curr === 'HKD' ? '✅ ' : ''}🇭🇰 HKD 港幣`, callback_data: 'setcurr:HKD' }],
          [{ text: `${curr === 'USD' ? '✅ ' : ''}🇺🇸 USD 美金`, callback_data: 'setcurr:USD' }],
          [{ text: `${curr === 'JPY' ? '✅ ' : ''}🇯🇵 JPY 日圓`, callback_data: 'setcurr:JPY' }],
          [{ text: '🔙 返回', callback_data: 'settings:locale' }],
        ],
      },
    });
    return;
  }

  return next();
});

// /myprofile command - View user profile
bot.command('myprofile', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const data = await response.json();

    if (!data.success) {
      await ctx.reply('❌ 載入個人資料時發生錯誤');
      return;
    }

    const profile = data.data;

    if (profile.isNewUser) {
      await ctx.reply(
        '👤 **個人資料**\n\n' +
        '你還沒有設定個人資料。\n\n' +
        '使用 /settings 來設定你的偏好。',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let message = '👤 **個人資料**\n\n';
    message += `📛 名稱：${profile.name || '未設定'}\n`;
    message += `🛂 國籍：${profile.nationalityName || profile.nationality || '未設定'}\n`;
    
    if (profile.passport) {
      message += `\n📋 **護照資訊**\n`;
      message += `號碼：${profile.passport.passportNo}\n`;
      message += `姓名：${profile.passport.fullName}\n`;
      message += `到期日：${profile.passport.expiryDate}\n`;
    } else {
      message += `\n📋 護照：尚未設定\n`;
    }

    message += `\n🗺️ 已規劃行程：${profile.tripCount} 個\n`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in /myprofile:', err);
    await ctx.reply('❌ 載入個人資料時發生錯誤');
  }
});

// /mytrips command - View user's trips
bot.command('mytrips', async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  try {
    // Get user ID first
    const userResponse = await fetch(`${API_URL}/api/user/profile`, {
      headers: { 'x-telegram-id': telegramId },
    });
    const userData = await userResponse.json();

    if (!userData.success || !userData.data?.id) {
      await ctx.reply(
        '🗺️ **我的行程**\n\n' +
        '你還沒有儲存任何行程。\n\n' +
        '使用 /plan 來規劃並儲存行程！',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const userId = userData.data.id;

    // Get trips
    const tripsResponse = await fetch(`${API_URL}/api/trips?userId=${userId}&limit=10`);
    const tripsData = await tripsResponse.json();

    if (!tripsData.success || !tripsData.data?.trips?.length) {
      await ctx.reply(
        '🗺️ **我的行程**\n\n' +
        '你還沒有儲存任何行程。\n\n' +
        '使用 /plan 來規劃並儲存行程！',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const trips = tripsData.data.trips;

    let message = `🗺️ **我的行程** (${tripsData.data.total} 個)\n\n`;

    for (let i = 0; i < Math.min(trips.length, 5); i++) {
      const trip = trips[i];
      const flag = countryFlagsCache[trip.countryCode] || '🌍';
      const statusEmoji = {
        PLANNING: '📝',
        CONFIRMED: '✅',
        IN_PROGRESS: '🚀',
        COMPLETED: '🎉',
        CANCELLED: '❌',
      }[trip.status] || '📝';

      message += `${flag} **${trip.title || trip.destination}**\n`;
      message += `   ${trip.duration} 天 | ${trip.startDate} ~ ${trip.endDate}\n`;
      message += `   ${statusEmoji} ${trip.status}\n\n`;
    }

    if (trips.length > 5) {
      message += `... 還有 ${trips.length - 5} 個行程\n`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in /mytrips:', err);
    await ctx.reply('❌ 載入行程列表時發生錯誤');
  }
});

// Countries list
bot.command('countries', async (ctx) => {
  try {
    const countries = await fetchAPI<Array<{
      code: string;
      name: string;
      nameZh: string | null;
      flagEmoji: string | null;
      region: string | null;
    }>>('/api/countries');
    
    if (!countries || countries.length === 0) {
      await ctx.reply('❌ 無法獲取國家列表，請確認 API 是否正常運行');
      return;
    }
    
    // Group by region
    const byRegion: Record<string, Array<{ code: string; name: string; nameZh: string | null; flagEmoji: string | null }>> = {};
    for (const c of countries) {
      const region = c.region || 'Other';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(c);
    }
    
    let message = '📍 支援的國家：\n\n';
    for (const [region, list] of Object.entries(byRegion)) {
      message += `【${region}】\n`;
      for (const c of list) {
        const flag = c.flagEmoji || '🌍';
        const name = c.nameZh || c.name;
        message += `${flag} ${c.code} - ${name}\n`;
      }
      message += '\n';
    }
    
    message += '使用國家代碼查詢（如 JP, KR, TH, SG, US）';
    
    await ctx.reply(message);
  } catch (err) {
    console.error('Error in /countries:', err);
    await ctx.reply('❌ 獲取國家列表時發生錯誤');
  }
});

// Visa query
bot.command('visa', async (ctx) => {
  const countryCode = ctx.match?.toUpperCase();
  const telegramId = ctx.from?.id?.toString();
  
  if (!countryCode) {
    await ctx.reply('請輸入國家代碼，例如：/visa JP');
    return;
  }
  
  try {
    // Get user's nationality
    let nationality = 'TW'; // Default to Taiwan
    if (telegramId) {
      const settingsResponse = await fetch(`${API_URL}/api/user/settings`, {
        headers: { 'x-telegram-id': telegramId },
      });
      const settingsData = await settingsResponse.json();
      if (settingsData.success && settingsData.data?.nationality) {
        nationality = settingsData.data.nationality;
      }
    }

    // Call API with user's nationality
    const visa = await fetchAPI<{
      countryCode: string;
      countryName: string;
      countryNameZh: string | null;
      flagEmoji: string | null;
      nationalityCode: string;
      requirement: string;
      requirementText: string;
      durationDays: number | null;
      durationNote: string | null;
      documents: string[] | null;
      conditions: string[] | null;
      processingTime: string | null;
      fee: number | null;
      feeCurrency: string | null;
      passportValidity: string | null;
      notes: string | null;
      officialUrl: string | null;
      lastUpdated: string | null;
    }>(`/api/visa/${nationality}/${countryCode}`);
    
    if (!visa) {
      await ctx.reply(`❌ 無法獲取 ${countryCode} 的簽證資訊，請稍後再試`);
      return;
    }
    
    const flag = visa.flagEmoji || countryFlagsCache[countryCode] || '🌍';
    const countryName = visa.countryNameZh || visa.countryName;
    
    // Get nationality label
    const nationalityLabel = NATIONALITY_OPTIONS.find(n => n.code === nationality)?.label || nationality;
    
    // Build message
    let message = `${flag} ${countryName} 簽證資訊（${nationalityLabel}護照）\n\n`;
    
    // Requirement
    const requirementEmoji = visa.requirement === 'VISA_FREE' ? '✅' : 
                             visa.requirement === 'E_VISA' ? '📋' : 
                             visa.requirement === 'VISA_REQUIRED' ? '📝' : 'ℹ️';
    message += `${requirementEmoji} 簽證狀態：${visa.requirementText}\n`;
    
    // Duration
    if (visa.durationDays) {
      message += `⏱ 停留期限：${visa.durationDays} 天`;
      if (visa.durationNote) {
        message += ` (${visa.durationNote})`;
      }
      message += '\n';
    }
    
    // Passport validity
    if (visa.passportValidity) {
      message += `📄 護照效期：${visa.passportValidity}\n`;
    }
    
    // Fee
    if (visa.fee && visa.feeCurrency) {
      message += `💰 費用：${visa.fee} ${visa.feeCurrency}\n`;
    }
    
    // Processing time
    if (visa.processingTime) {
      message += `🕐 處理時間：${visa.processingTime}\n`;
    }
    
    // Documents
    if (visa.documents && Array.isArray(visa.documents) && visa.documents.length > 0) {
      message += `\n📋 所需文件：\n`;
      for (const doc of visa.documents) {
        message += `• ${doc}\n`;
      }
    }
    
    // Notes
    if (visa.notes) {
      message += `\n📌 注意事項：${visa.notes}\n`;
    }
    
    // Last updated
    if (visa.lastUpdated) {
      message += `\n📅 資料最後更新：${visa.lastUpdated}\n`;
    }
    
    message += '\n⚠️ 簽證政策可能隨時變更，出發前請確認官方資訊';
    
    await ctx.reply(message);
  } catch (err) {
    console.error('Error in /visa:', err);
    await ctx.reply('❌ 查詢簽證時發生錯誤');
  }
});

// Legal restrictions
bot.command('legal', async (ctx) => {
  const countryCode = ctx.match?.toUpperCase();
  
  if (!countryCode) {
    await ctx.reply('請輸入國家代碼，例如：/legal JP');
    return;
  }
  
  try {
    const legal = await fetchAPI<{
      countryCode: string;
      countryName: string;
      countryNameZh: string | null;
      flagEmoji: string | null;
      restrictions: Array<{
        id: string;
        category: string;
        severity: string;
        severityText: string;
        title: string;
        description: string;
        items: string[] | null;
        penalty: string | null;
        fineMin: number | null;
        fineMax: number | null;
        fineCurrency: string | null;
        imprisonment: string | null;
        exceptions: string | null;
        permitRequired: boolean;
        permitInfo: string | null;
        officialUrl: string | null;
        lastVerified: string | null;
      }>;
      total: number;
      lastUpdated: string | null;
    }>(`/api/legal/${countryCode}`);
    
    if (!legal) {
      await ctx.reply(`❌ 無法獲取 ${countryCode} 的法律資訊，請稍後再試`);
      return;
    }
    
    const flag = legal.flagEmoji || countryFlagsCache[countryCode] || '🌍';
    const countryName = legal.countryNameZh || legal.countryName;
    
    if (legal.restrictions.length === 0) {
      await ctx.reply(`${flag} ${countryName}\n\n暫無法律禁忌資料`);
      return;
    }
    
    // Group by category
    const byCategory: Record<string, typeof legal.restrictions> = {};
    for (const r of legal.restrictions) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push(r);
    }
    
    let message = `${flag} ${countryName} - 禁帶物品與法律禁忌\n\n`;
    
    // Show first 5 items (to avoid message too long)
    const itemsToShow = legal.restrictions.slice(0, 5);
    
    for (const item of itemsToShow) {
      message += `${item.severityText} ${item.title}\n`;
      message += `${item.description}\n`;
      
      if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        message += `具體物品：${item.items.slice(0, 3).join('、')}`;
        if (item.items.length > 3) message += ' 等';
        message += '\n';
      }
      
      if (item.penalty || item.imprisonment) {
        message += `⚠️ `;
        if (item.imprisonment) message += `刑責：${item.imprisonment}`;
        if (item.penalty && item.imprisonment) message += ' / ';
        if (item.penalty) message += item.penalty;
        message += '\n';
      }
      
      message += '\n';
    }
    
    if (legal.restrictions.length > 5) {
      message += `... 還有 ${legal.restrictions.length - 5} 項，請查看完整列表\n\n`;
    }
    
    // Last updated
    if (legal.lastUpdated) {
      message += `\n📅 資料最後更新：${legal.lastUpdated}\n`;
    }
    
    message += '\n⚠️ 違反規定可能面臨罰款、監禁等處罰';
    
    await ctx.reply(message);
  } catch (err) {
    console.error('Error in /legal:', err);
    await ctx.reply('❌ 查詢法律禁忌時發生錯誤');
  }
});

// Fun facts
bot.command('funfacts', async (ctx) => {
  const countryCode = ctx.match?.toUpperCase();
  
  if (!countryCode) {
    await ctx.reply('請輸入國家代碼，例如：/funfacts JP');
    return;
  }
  
  try {
    const funfacts = await fetchAPI<{
      countryCode: string;
      countryName: string;
      countryNameZh: string | null;
      flagEmoji: string | null;
      facts: Array<{
        id: string;
        category: string;
        categoryName: string;
        title: string | null;
        content: string;
        source: string | null;
        lastUpdated: string;
      }>;
      total: number;
      lastUpdated: string | null;
    }>(`/api/funfacts/${countryCode}`);
    
    if (!funfacts) {
      await ctx.reply(`❌ 無法獲取 ${countryCode} 的 Fun Facts，請稍後再試`);
      return;
    }
    
    const flag = funfacts.flagEmoji || countryFlagsCache[countryCode] || '🌍';
    const countryName = funfacts.countryNameZh || funfacts.countryName;
    
    if (funfacts.facts.length === 0) {
      await ctx.reply(`${flag} ${countryName}\n\n暫無 Fun Facts 資料`);
      return;
    }
    
    let message = `${flag} ${countryName} Fun Facts\n\n`;
    
    for (const fact of funfacts.facts) {
      const title = fact.title ? `【${fact.title}】` : `【${fact.categoryName}】`;
      message += `${title}\n${fact.content}\n\n`;
    }
    
    // Last updated
    if (funfacts.lastUpdated) {
      message += `📅 資料最後更新：${funfacts.lastUpdated}\n`;
    }
    
    message += '\nℹ️ 資料僅供參考，實際情況可能有所不同';
    
    await ctx.reply(message);
  } catch (err) {
    console.error('Error in /funfacts:', err);
    await ctx.reply('❌ 查詢 Fun Facts 時發生錯誤');
  }
});

// ============================================
// Flight Tracking Commands
// ============================================

// Flight search state
const flightSearchSessions = new Map<string, {
  step: 'flightNumber' | 'flightDate';
  data: {
    flightNumber?: string;
    flightDate?: string;
  };
}>();

bot.command('flight', async (ctx) => {
  const subCommand = ctx.match?.trim().toLowerCase().split(/\s+/)[0];
  const telegramId = ctx.from?.id?.toString();

  if (!telegramId) return;

  // /flight search - start flight search
  if (subCommand === 'search' || !subCommand) {
    flightSearchSessions.set(telegramId, {
      step: 'flightNumber',
      data: {},
    });

    await ctx.reply(
      '✈️ 航班查詢\n\n' +
      '請輸入航班號：\n' +
      '（例如：CI123、BR892、JL801）'
    );
    return;
  }

  // /flight list - show tracked flights
  if (subCommand === 'list') {
    try {
      const response = await fetch(`${API_URL}/api/flights/tracked`, {
        headers: { 'x-telegram-id': telegramId },
      });
      const data = await response.json();

      if (!data.success) {
        await ctx.reply('❌ 查詢航班列表失敗');
        return;
      }

      const flights = data.data?.flights || [];

      if (flights.length === 0) {
        await ctx.reply(
          '✈️ 航班追蹤\n\n' +
          '您尚未追蹤任何航班\n\n' +
          '使用 /flight search 搜尋並追蹤航班'
        );
        return;
      }

      let message = `✈️ 我的航班追蹤 (${flights.length})\n\n`;

      const statusEmoji: Record<string, string> = {
        SCHEDULED: '📅',
        ACTIVE: '🛫',
        LANDED: '✅',
        CANCELLED: '❌',
        DELAYED: '⏰',
        DIVERTED: '↪️',
        UNKNOWN: '❓',
      };

      for (const flight of flights) {
        const emoji = statusEmoji[flight.status] || '📅';
        message += `${emoji} ${flight.flightNumber}\n`;
        message += `   ${flight.departureAirport} → ${flight.arrivalAirport}\n`;
        message += `   ${flight.flightDate}\n`;
        message += `   狀態：${flight.status}\n`;
        if (flight.delayMinutes && flight.delayMinutes > 0) {
          message += `   ⚠️ 延誤 ${flight.delayMinutes} 分鐘\n`;
        }
        if (flight.unreadAlerts > 0) {
          message += `   🔔 ${flight.unreadAlerts} 則未讀通知\n`;
        }
        message += '\n';
      }

      message += '點擊航班詳情或使用 /flight <航班號> 查看更多';

      await ctx.reply(message);
    } catch (err) {
      console.error('Error in /flight list:', err);
      await ctx.reply('❌ 查詢航班列表時發生錯誤');
    }
    return;
  }

  // /flight <flightNumber> - show flight details
  const flightNumber = subCommand.toUpperCase();
  if (flightNumber.length >= 2) {
    try {
      const response = await fetch(`${API_URL}/api/flights/search?flightNumber=${flightNumber}`);
      const data = await response.json();

      if (!data.success || !data.data) {
        await ctx.reply(`❌ 找不到航班 ${flightNumber}，請確認航班號是否正確`);
        return;
      }

      const flight = data.data;
      const statusEmoji: Record<string, string> = {
        SCHEDULED: '📅',
        ACTIVE: '🛫',
        LANDED: '✅',
        CANCELLED: '❌',
        DELAYED: '⏰',
        DIVERTED: '↪️',
        UNKNOWN: '❓',
      };

      let message = `✈️ ${flight.flightIata || flightNumber}\n`;
      message += `${flight.airline || ''}\n\n`;
      message += `${statusEmoji[flight.status] || '📅'} 狀態：${flight.status}\n\n`;

      message += `🛫 出發\n`;
      message += `${flight.departure?.airport || flight.departure?.iata || 'N/A'}\n`;
      if (flight.departure?.scheduled) {
        message += `時間：${new Date(flight.departure.scheduled).toLocaleString('zh-TW')}\n`;
      }
      if (flight.departure?.gate) {
        message += `登機門：${flight.departure.gate}\n`;
      }
      if (flight.departure?.terminal) {
        message += `航廈：${flight.departure.terminal}\n`;
      }

      message += `\n🛬 抵達\n`;
      message += `${flight.arrival?.airport || flight.arrival?.iata || 'N/A'}\n`;
      if (flight.arrival?.scheduled) {
        message += `時間：${new Date(flight.arrival.scheduled).toLocaleString('zh-TW')}\n`;
      }
      if (flight.arrival?.gate) {
        message += `登機門：${flight.arrival.gate}\n`;
      }
      if (flight.arrival?.terminal) {
        message += `航廈：${flight.arrival.terminal}\n`;
      }

      if (flight.aircraft) {
        message += `\n🛩️ 機型：${flight.aircraft.model || 'N/A'}\n`;
      }

      await ctx.reply(message);

      // Offer to track
      await ctx.reply(
        `是否要追蹤此航班？\n\n` +
        `輸入日期（格式：YYYY-MM-DD）開始追蹤\n` +
        `或輸入「取消」結束`,
      );

      flightSearchSessions.set(telegramId, {
        step: 'flightDate',
        data: { flightNumber },
      });
    } catch (err) {
      console.error('Error in /flight <number>:', err);
      await ctx.reply('❌ 查詢航班時發生錯誤');
    }
    return;
  }
});

// Handle flight search multi-step input
bot.on('message:text', async (ctx, next) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return next();

  const session = flightSearchSessions.get(telegramId);
  if (!session) return next();

  const text = ctx.message.text.trim();

  // Cancel command
  if (text.toLowerCase() === 'cancel' || text.toLowerCase() === '取消') {
    flightSearchSessions.delete(telegramId);
    await ctx.reply('❌ 已取消航班查詢');
    return;
  }

  if (session.step === 'flightNumber') {
    // Validate flight number format
    const flightMatch = text.match(/^([A-Z]{2})(\d+)$/i);
    if (!flightMatch) {
      await ctx.reply(
        '❌ 航班號格式錯誤\n\n' +
        '請輸入正確格式，例如：CI123、BR892、JL801'
      );
      return;
    }

    session.data.flightNumber = text.toUpperCase();
    session.step = 'flightDate';
    flightSearchSessions.set(telegramId, session);

    await ctx.reply(
      '📅 請輸入航班日期：\n' +
      '（格式：YYYY-MM-DD，例如：2026-04-15）\n' +
      '或輸入「今天」使用今天的日期'
    );
    return;
  }

  if (session.step === 'flightDate') {
    let flightDate: string;

    if (text === '今天' || text.toLowerCase() === 'today') {
      flightDate = new Date().toISOString().split('T')[0];
    } else {
      // Validate date format
      const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!dateMatch) {
        await ctx.reply(
          '❌ 日期格式錯誤\n\n' +
          '請輸入 YYYY-MM-DD 格式，例如：2026-04-15'
        );
        return;
      }
      flightDate = text;
    }

    session.data.flightDate = flightDate;
    flightSearchSessions.delete(telegramId);

    // Search flight
    try {
      const response = await fetch(
        `${API_URL}/api/flights/search?flightNumber=${session.data.flightNumber}&date=${flightDate}`
      );
      const data = await response.json();

      if (!data.success || !data.data) {
        await ctx.reply(
          `❌ 找不到航班 ${session.data.flightNumber}（${flightDate}）\n\n` +
          `請確認航班號和日期是否正確`
        );
        return;
      }

      const flight = data.data;
      const statusEmoji: Record<string, string> = {
        SCHEDULED: '📅',
        ACTIVE: '🛫',
        LANDED: '✅',
        CANCELLED: '❌',
        DELAYED: '⏰',
        DIVERTED: '↪️',
        UNKNOWN: '❓',
      };

      let message = `✈️ ${flight.flightIata || session.data.flightNumber}\n`;
      message += `${flight.airline || ''}\n`;
      message += `📅 ${flightDate}\n\n`;
      message += `${statusEmoji[flight.status] || '📅'} 狀態：${flight.status}\n\n`;

      message += `🛫 出發：${flight.departure?.airport || flight.departure?.iata || 'N/A'}`;
      if (flight.departure?.scheduled) {
        message += `\n   時間：${new Date(flight.departure.scheduled).toLocaleString('zh-TW')}`;
      }
      if (flight.departure?.gate) {
        message += `\n   登機門：${flight.departure.gate}`;
      }

      message += `\n\n🛬 抵達：${flight.arrival?.airport || flight.arrival?.iata || 'N/A'}`;
      if (flight.arrival?.scheduled) {
        message += `\n   時間：${new Date(flight.arrival.scheduled).toLocaleString('zh-TW')}`;
      }

      await ctx.reply(message);

      // Auto track
      const trackResponse = await fetch(`${API_URL}/api/flights/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-id': telegramId,
        },
        body: JSON.stringify({
          flightNumber: session.data.flightNumber,
          flightDate,
        }),
      });
      const trackData = await trackResponse.json();

      if (trackData.success) {
        await ctx.reply(
          `✅ 已開始追蹤航班 ${session.data.flightNumber}\n\n` +
          `使用 /flight list 查看所有追蹤的航班`
        );
      } else {
        await ctx.reply(`⚠️ 追蹤失敗：${trackData.error || '未知錯誤'}`);
      }
    } catch (err) {
      console.error('Error searching flight:', err);
      await ctx.reply('❌ 查詢航班時發生錯誤');
    }
    return;
  }

  return next();
});

// ============================================
// Packing List Command
// ============================================

bot.command('packing', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1) || [];
  
  if (args.length < 2) {
    await ctx.reply(
      `🎒 打包清單生成器

使用方式：
/packing <國家> <天數> [季節] [類型]

範例：
/packing JP 5
/packing JP 5 winter leisure
/packing TH 3 summer adventure

季節：spring, summer, autumn, winter
類型：leisure, business, adventure, shopping`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const countryCode = args[0].toUpperCase();
  const days = parseInt(args[1], 10);
  const season = (args[2] || 'summer') as 'spring' | 'summer' | 'autumn' | 'winter';
  const tripType = args[3] ? [args[3] as 'leisure' | 'business' | 'adventure' | 'shopping'] : ['leisure'];

  if (isNaN(days) || days < 1 || days > 30) {
    await ctx.reply('❌ 天數必須是 1-30 之間的數字');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/packing-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: countryCode,
        countryCode,
        days,
        season,
        tripType,
      }),
    });

    const data = await response.json() as { success: boolean; data?: { packingList: Record<string, { item: string; checked: boolean; essential: boolean }[]>; totalItems: number; essentialItems: number }; error?: string };

    if (!data.success) {
      await ctx.reply(`❌ 生成失敗：${data.error}`);
      return;
    }

    const packingList = data.data!.packingList;
    let message = `🎒 **打包清單** (${days}天)\n\n`;

    for (const [category, items] of Object.entries(packingList)) {
      const categoryName: Record<string, string> = {
        essentials: '📋 必備物品',
        clothing: '👕 衣物',
        toiletries: '🧴 盥洗用品',
        electronics: '📱 電子產品',
        medicine: '💊 藥品',
        documents: '📄 文件',
        business: '💼 商務用品',
        adventure: '🏔️ 冒險裝備',
        special: '⭐ 特殊需求',
      };

      message += `**${categoryName[category] || category}**\n`;
      for (const item of items) {
        const checkbox = item.essential ? '🔴' : '⚪';
        message += `${checkbox} ${item.item}\n`;
      }
      message += '\n';
    }

    message += `📊 總計 ${data.data!.totalItems} 項（必備 ${data.data!.essentialItems} 項）\n`;
    message += `\n💡 點擊項目可複製到筆記`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error generating packing list:', err);
    await ctx.reply('❌ 生成打包清單時發生錯誤');
  }
});

// ============================================
// Budget Calculator Command
// ============================================

bot.command('budget', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1) || [];
  
  if (args.length < 3) {
    await ctx.reply(
      `💰 預算試算器

使用方式：
/budget <國家> <天數> <人數> [等級] [含機票]

範例：
/budget JP 5 2
/budget JP 5 2 medium
/budget JP 5 2 high yes

等級：low（省錢）、medium（一般）、high（豪華）`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const countryCode = args[0].toUpperCase();
  const days = parseInt(args[1], 10);
  const travelers = parseInt(args[2], 10);
  const budgetLevel = (args[3] || 'medium') as 'low' | 'medium' | 'high';
  const includeFlights = args[4] === 'yes';

  if (isNaN(days) || days < 1 || days > 90) {
    await ctx.reply('❌ 天數必須是 1-90 之間的數字');
    return;
  }

  if (isNaN(travelers) || travelers < 1 || travelers > 20) {
    await ctx.reply('❌ 人數必須是 1-20 之間的數字');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: countryCode,
        countryCode,
        days,
        travelers,
        budgetLevel,
        includeFlights,
      }),
    });

    const data = await response.json() as { success: boolean; data?: { breakdown: Record<string, { label: string; amount: number }>; totalPerPerson: number; grandTotal: number; tips: string[]; currency: string }; error?: string };

    if (!data.success) {
      await ctx.reply(`❌ 計算失敗：${data.error}`);
      return;
    }

    const result = data.data!;
    let message = `💰 **預算試算結果**\n\n`;
    message += `📍 目的地：${countryCode}\n`;
    message += `📅 天數：${days} 天\n`;
    message += `👥 人數：${travelers} 人\n`;
    message += `💎 等級：${budgetLevel === 'low' ? '省錢' : budgetLevel === 'medium' ? '一般' : '豪華'}\n\n`;

    message += `📊 **費用明細（每人）**\n`;
    for (const [key, item] of Object.entries(result.breakdown)) {
      if (item.amount > 0) {
        message += `${item.label}：NT$ ${item.amount.toLocaleString()}\n`;
      }
    }

    message += `\n💵 **每人總計**：NT$ ${result.totalPerPerson.toLocaleString()}\n`;
    message += `🏦 **總預算**：NT$ ${result.grandTotal.toLocaleString()}\n\n`;

    if (result.tips.length > 0) {
      message += `💡 **小撇步**\n`;
      for (const tip of result.tips) {
        message += `• ${tip}\n`;
      }
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error calculating budget:', err);
    await ctx.reply('❌ 計算預算時發生錯誤');
  }
});

// ============================================
// Weather Command
// ============================================

bot.command('weather', async (ctx) => {
  const args = ctx.message?.text?.split(' ').slice(1) || [];
  
  if (args.length === 0) {
    await ctx.reply(
      `🌤️ 天氣查詢

使用方式：
/weather <國家>

範例：
/weather JP
/weather KR

顯示 7 天天氣預報`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const countryCode = args[0].toUpperCase();

  try {
    const response = await fetch(`${API_URL}/api/weather/${countryCode}?days=7`);
    const data = await response.json() as { success: boolean; data?: { location: { country: string; city: string }; current: { temperature: number; description: string; icon: string; humidity: number }; forecast: { date: string; dayOfWeek: string; maxTemp: number; minTemp: number; icon: string; description: string; precipitation: number }[]; tips: string[] }; error?: string };

    if (!data.success) {
      await ctx.reply(`❌ 查詢失敗：${data.error}`);
      return;
    }

    const result = data.data!;
    let message = `🌤️ **${result.location.city}，${result.location.country}**\n\n`;

    message += `📍 **目前天氣**\n`;
    message += `${result.current.icon} ${result.current.description}\n`;
    message += `🌡️ ${result.current.temperature}°C\n`;
    message += `💧 濕度 ${result.current.humidity}%\n\n`;

    message += `📅 **7 天預報**\n`;
    for (const day of result.forecast) {
      const rainIcon = day.precipitation > 50 ? '☔' : '';
      message += `${day.dayOfWeek} ${day.icon} ${day.minTemp}°-${day.maxTemp}°C ${rainIcon}\n`;
    }

    if (result.tips.length > 0) {
      message += `\n💡 **建議**\n`;
      for (const tip of result.tips) {
        message += `${tip}\n`;
      }
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error fetching weather:', err);
    await ctx.reply('❌ 查詢天氣時發生錯誤');
  }
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `📖 Travel Helper Bot 使用說明

📍 命令列表：
/start - 開始使用
/plan - 🆕 AI 行程規劃（對話式）
/flight - ✈️ 航班追蹤
  - /flight search - 搜尋航班
  - /flight list - 查看追蹤列表
  - /flight <航班號> - 查看航班詳情
/packing - 🎒 打包清單生成器
/budget - 💰 預算試算器
/weather - 🌤️ 天氣查詢
/visa <國家> - 簽證查詢
/legal <國家> - 法律禁忌
/funfacts <國家> - 趣味知識
/passport - 護照管理
  - /passport - 查看護照
  - /passport add - 新增護照
  - /passport delete - 刪除護照
/check <國家> <物品...> - 禁帶物品檢查
/policy - 政策變更通知
/notifications - 查看通知
/settings - 設定中心
/myprofile - 個人資料
/mytrips - 我的行程
/countries - 支援國家
/help - 幫助

🗺️ 行程規劃功能：
輸入 /plan 開始對話式行程規劃
AI 會根據你的目的地、天數、預算、風格
生成專屬行程建議

🎒 打包清單：
/packing JP 5 - 生成日本5天打包清單

💰 預算試算：
/budget JP 5 2 - 計算日本5天2人預算

🌤️ 天氣查詢：
/weather JP - 查看日本天氣預報

✈️ 航班追蹤功能：
輸入 /flight search 搜尋航班
可追蹤航班狀態、延誤通知、登機門變更

🌐 國家代碼：
JP - 日本 🇯🇵
KR - 韓國 🇰🇷
TH - 泰國 🇹🇭
SG - 新加坡 🇸🇬
US - 美國 🇺🇸
MY - 馬來西亞 🇲🇾
VN - 越南 🇻🇳
HK - 香港 🇭🇰
MO - 澳門 🇲🇴

⚠️ 資料僅供參考，實際規定以各國官方公告為準`
  );
});

// ============================================
// Start bot
// ============================================
bot.catch((err) => {
  console.error('❌ Bot catch error:', err);
});

console.log('🚀 Starting bot...');
console.log('📌 Bot token:', BOT_TOKEN?.substring(0, 10) + '...');
bot.start({
  onStart: (botInfo) => {
    console.log('✅ Bot started successfully!');
    console.log('📱 Bot username:', botInfo.username);
  }
});
console.log('🤖 Travel Helper Bot is running...');
console.log('📱 Try /start in Telegram');