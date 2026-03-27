import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient, VisaType, RestrictionCategory, NotificationType, DraftStep, BudgetLevel } from '@prisma/client';
import cron from 'node-cron';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// DeepSeek client (OpenAI-compatible)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

// ============================================
// Helper: Telegram ID to User mapping
// ============================================

async function getOrCreateUser(telegramId: string, name?: string): Promise<string> {
  let user = await prisma.user.findFirst({
    where: { phone: telegramId }, // Using phone field to store telegram ID temporarily
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: `telegram_${telegramId}@travelhelper.local`,
        name: name || `User ${telegramId}`,
        phone: telegramId,
      },
    });
  }

  return user.id;
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Countries API
// ============================================

// GET /api/countries - List all countries
app.get('/api/countries', async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        code: true,
        name: true,
        nameZh: true,
        nameZhHant: true,
        capital: true,
        region: true,
        currency: true,
        flagEmoji: true,
      },
    });
    res.json({ success: true, data: countries });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch countries' });
  }
});

// ============================================
// Visa API
// ============================================

// Helper function to format visa requirement
function formatVisaRequirement(visa: {
  requirement: VisaType;
  durationDays: number | null;
  durationNote: string | null;
  documents: unknown;
  conditions: unknown;
  processingTime: string | null;
  fee: number | null;
  feeCurrency: string | null;
  passportValidity: string | null;
  notes: string | null;
  officialUrl: string | null;
  updatedAt: Date;
}) {
  const requirementMap: Record<VisaType, string> = {
    VISA_FREE: '免簽證',
    VISA_ON_ARRIVAL: '落地簽',
    E_VISA: '電子簽證',
    ETA: '電子旅行授權',
    VISA_REQUIRED: '需簽證',
    VISA_RESTRICTED: '限制入境',
    VISA_SUSPENDED: '簽證暫停',
  };

  return {
    requirement: visa.requirement,
    requirementText: requirementMap[visa.requirement] || visa.requirement,
    durationDays: visa.durationDays,
    durationNote: visa.durationNote,
    documents: visa.documents,
    conditions: visa.conditions,
    processingTime: visa.processingTime,
    fee: visa.fee,
    feeCurrency: visa.feeCurrency,
    passportValidity: visa.passportValidity,
    notes: visa.notes,
    officialUrl: visa.officialUrl,
    lastUpdated: visa.updatedAt.toISOString().split('T')[0],
  };
}

// GET /api/visa/:nationality/:destination - Visa lookup
app.get('/api/visa/:nationality/:destination', async (req, res) => {
  try {
    const { nationality, destination } = req.params;
    const nationalityCode = nationality.toUpperCase();
    const countryCode = destination.toUpperCase();

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${countryCode} not found`,
      });
    }

    // Get visa requirement
    const visa = await prisma.visaRequirement.findUnique({
      where: {
        countryCode_nationalityCode: {
          countryCode,
          nationalityCode,
        },
      },
    });

    if (!visa) {
      return res.json({
        success: true,
        data: {
          countryCode,
          countryName: country.name,
          countryNameZh: country.nameZh,
          nationalityCode,
          requirement: 'UNKNOWN',
          requirementText: '尚未支援此護照國籍的簽證資訊',
          note: '請查詢官方管道確認簽證需求',
        },
      });
    }

    res.json({
      success: true,
      data: {
        countryCode,
        countryName: country.name,
        countryNameZh: country.nameZh,
        flagEmoji: country.flagEmoji,
        nationalityCode,
        ...formatVisaRequirement(visa),
      },
    });
  } catch (error) {
    console.error('Error fetching visa:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch visa information' });
  }
});

// ============================================
// Legal Restrictions API
// ============================================

// GET /api/legal/:countryCode - Get all legal restrictions for a country
app.get('/api/legal/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const code = countryCode.toUpperCase();

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${code} not found`,
      });
    }

    // Get legal restrictions
    const restrictions = await prisma.legalRestriction.findMany({
      where: { countryCode: code, isActive: true },
      orderBy: [{ severity: 'desc' }, { category: 'asc' }],
    });

    const severityMap: Record<string, string> = {
      CRITICAL: '🔴 高風險',
      HIGH: '🔴 高風險',
      MEDIUM: '🟠 中風險',
      LOW: '🟡 低風險',
      INFO: 'ℹ️ 資訊',
    };

    const formattedRestrictions = restrictions.map((r) => ({
      id: r.id,
      category: r.category,
      severity: r.severity,
      severityText: severityMap[r.severity] || r.severity,
      type: r.type,
      title: r.title,
      description: r.description,
      items: r.items,
      penalty: r.penalty,
      fineMin: r.fineMin,
      fineMax: r.fineMax,
      fineCurrency: r.fineCurrency,
      imprisonment: r.imprisonment,
      exceptions: r.exceptions,
      permitRequired: r.permitRequired,
      permitInfo: r.permitInfo,
      officialUrl: r.officialUrl,
      lastVerified: r.lastVerified.toISOString().split('T')[0],
    }));

    res.json({
      success: true,
      data: {
        countryCode: code,
        countryName: country.name,
        countryNameZh: country.nameZh,
        flagEmoji: country.flagEmoji,
        restrictions: formattedRestrictions,
        total: formattedRestrictions.length,
        lastUpdated: restrictions.length > 0 ? restrictions[0].lastVerified.toISOString().split('T')[0] : null,
      },
    });
  } catch (error) {
    console.error('Error fetching legal restrictions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch legal restrictions' });
  }
});

// GET /api/legal/:countryCode/categories - Get categories summary
app.get('/api/legal/:countryCode/categories', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const code = countryCode.toUpperCase();

    const categories = await prisma.legalRestriction.groupBy({
      by: ['category', 'severity'],
      where: { countryCode: code, isActive: true },
      _count: { id: true },
    });

    const categoryNames: Record<string, string> = {
      PROHIBITED_ITEMS: '禁帶物品',
      RESTRICTED_ITEMS: '限制物品',
      MEDICATION: '藥品',
      FOOD_PRODUCTS: '食品',
      CURRENCY: '現金/貨幣',
      BEHAVIOR: '行為禁忌',
      PHOTOGRAPHY: '攝影限制',
      DRESS_CODE: '服裝規定',
      CUSTOMS: '海關規定',
      OTHER: '其他',
    };

    const formatted = categories.map((c) => ({
      category: c.category,
      categoryName: categoryNames[c.category] || c.category,
      severity: c.severity,
      count: c._count.id,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching legal categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch legal categories' });
  }
});

// ============================================
// Fun Facts API
// ============================================

// GET /api/funfacts/:countryCode - Get fun facts for a country
app.get('/api/funfacts/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const code = countryCode.toUpperCase();

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${code} not found`,
      });
    }

    // Get fun facts
    const facts = await prisma.funFact.findMany({
      where: { countryCode: code, isActive: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    const categoryNames: Record<string, string> = {
      CULTURE: '文化',
      HISTORY: '歷史',
      FOOD: '美食',
      NATURE: '自然',
      LANGUAGE: '語言',
      ETIQUETTE: '禮儀',
      STATISTICS: '統計',
      TRIVIA: '趣聞',
      OTHER: '其他',
    };

    const formattedFacts = facts.map((f) => ({
      id: f.id,
      category: f.category,
      categoryName: categoryNames[f.category] || f.category,
      title: f.title,
      content: f.content,
      imageUrl: f.imageUrl,
      source: f.source,
      sourceUrl: f.sourceUrl,
      priority: f.priority,
      lastUpdated: f.updatedAt.toISOString().split('T')[0],
    }));

    res.json({
      success: true,
      data: {
        countryCode: code,
        countryName: country.name,
        countryNameZh: country.nameZh,
        flagEmoji: country.flagEmoji,
        facts: formattedFacts,
        total: formattedFacts.length,
        lastUpdated: facts.length > 0 ? facts[0].updatedAt.toISOString().split('T')[0] : null,
      },
    });
  } catch (error) {
    console.error('Error fetching fun facts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch fun facts' });
  }
});

// ============================================
// Trip Draft API (Phase 2 - Conversational Planning)
// ============================================

// POST /api/draft - Create new draft
app.post('/api/draft', async (req, res) => {
  try {
    const { telegramUserId, destination, nationality } = req.body;

    if (!telegramUserId) {
      return res.status(400).json({ success: false, error: 'telegramUserId is required' });
    }

    // Delete existing draft for this user
    await prisma.tripDraft.deleteMany({
      where: { telegramUserId },
    });

    // Calculate expiry (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create new draft
    const draft = await prisma.tripDraft.create({
      data: {
        telegramUserId,
        destination: destination || null,
        nationality: nationality || null,
        step: DraftStep.NATIONALITY,
        expiresAt,
      },
    });

    res.json({
      success: true,
      data: {
        id: draft.id,
        telegramUserId: draft.telegramUserId,
        step: draft.step,
        nationality: draft.nationality,
        destination: draft.destination,
        expiresAt: draft.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ success: false, error: 'Failed to create draft' });
  }
});

// GET /api/draft/:telegramUserId - Get draft
app.get('/api/draft/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;

    const draft = await prisma.tripDraft.findUnique({
      where: { telegramUserId },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
        code: 'DRAFT_NOT_FOUND',
      });
    }

    // Check if expired
    if (draft.expiresAt < new Date()) {
      await prisma.tripDraft.delete({ where: { telegramUserId } });
      return res.status(404).json({
        success: false,
        error: 'Draft expired',
        code: 'DRAFT_EXPIRED',
      });
    }

    res.json({
      success: true,
      data: {
        id: draft.id,
        telegramUserId: draft.telegramUserId,
        step: draft.step,
        nationality: draft.nationality,
        destination: draft.destination,
        countryCode: draft.countryCode,
        city: draft.city,
        days: draft.days,
        budget: draft.budget,
        travelStyles: draft.travelStyles,
        specialRequests: draft.specialRequests,
        tripId: draft.tripId,
        expiresAt: draft.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch draft' });
  }
});

// PATCH /api/draft/:telegramUserId - Update draft
app.patch('/api/draft/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const { step, nationality, destination, countryCode, city, days, budget, travelStyles, specialRequests } = req.body;

    const draft = await prisma.tripDraft.findUnique({
      where: { telegramUserId },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
        code: 'DRAFT_NOT_FOUND',
      });
    }

    // Check if expired
    if (draft.expiresAt < new Date()) {
      await prisma.tripDraft.delete({ where: { telegramUserId } });
      return res.status(404).json({
        success: false,
        error: 'Draft expired',
        code: 'DRAFT_EXPIRED',
      });
    }

    // Extend expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Update draft
    const updatedDraft = await prisma.tripDraft.update({
      where: { telegramUserId },
      data: {
        step: step !== undefined ? step : undefined,
        nationality: nationality !== undefined ? nationality : undefined,
        destination: destination !== undefined ? destination : undefined,
        countryCode: countryCode !== undefined ? countryCode : undefined,
        city: city !== undefined ? city : undefined,
        days: days !== undefined ? days : undefined,
        budget: budget !== undefined ? budget : undefined,
        travelStyles: travelStyles !== undefined ? travelStyles : undefined,
        specialRequests: specialRequests !== undefined ? specialRequests : undefined,
        expiresAt,
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedDraft.id,
        telegramUserId: updatedDraft.telegramUserId,
        step: updatedDraft.step,
        nationality: updatedDraft.nationality,
        destination: updatedDraft.destination,
        countryCode: updatedDraft.countryCode,
        city: updatedDraft.city,
        days: updatedDraft.days,
        budget: updatedDraft.budget,
        travelStyles: updatedDraft.travelStyles,
        specialRequests: updatedDraft.specialRequests,
        expiresAt: updatedDraft.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ success: false, error: 'Failed to update draft' });
  }
});

// DELETE /api/draft/:telegramUserId - Delete draft
app.delete('/api/draft/:telegramUserId', async (req, res) => {
  try {
    const { telegramUserId } = req.params;

    await prisma.tripDraft.deleteMany({
      where: { telegramUserId },
    });

    res.json({
      success: true,
      message: 'Draft deleted',
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ success: false, error: 'Failed to delete draft' });
  }
});

// ============================================
// Smart Destination Matching
// ============================================

// Destination name to country code mapping
const DESTINATION_MAP: Record<string, { countryCode: string; city?: string }> = {
  // Japan
  '日本': { countryCode: 'JP' },
  '東京': { countryCode: 'JP', city: 'Tokyo' },
  '大阪': { countryCode: 'JP', city: 'Osaka' },
  '京都': { countryCode: 'JP', city: 'Kyoto' },
  '北海道': { countryCode: 'JP', city: 'Hokkaido' },
  '沖繩': { countryCode: 'JP', city: 'Okinawa' },
  '福岡': { countryCode: 'JP', city: 'Fukuoka' },
  '名古屋': { countryCode: 'JP', city: 'Nagoya' },
  'tokyo': { countryCode: 'JP', city: 'Tokyo' },
  'osaka': { countryCode: 'JP', city: 'Osaka' },
  'kyoto': { countryCode: 'JP', city: 'Kyoto' },
  'japan': { countryCode: 'JP' },
  
  // Korea
  '韓國': { countryCode: 'KR' },
  '南韓': { countryCode: 'KR' },
  '首爾': { countryCode: 'KR', city: 'Seoul' },
  '釜山': { countryCode: 'KR', city: 'Busan' },
  '濟州': { countryCode: 'KR', city: 'Jeju' },
  'seoul': { countryCode: 'KR', city: 'Seoul' },
  'korea': { countryCode: 'KR' },
  
  // Thailand
  '泰國': { countryCode: 'TH' },
  '曼谷': { countryCode: 'TH', city: 'Bangkok' },
  '清邁': { countryCode: 'TH', city: 'Chiang Mai' },
  '普吉': { countryCode: 'TH', city: 'Phuket' },
  'bangkok': { countryCode: 'TH', city: 'Bangkok' },
  'thailand': { countryCode: 'TH' },
  
  // Singapore
  '新加坡': { countryCode: 'SG' },
  'singapore': { countryCode: 'SG' },
  
  // Malaysia
  '馬來西亞': { countryCode: 'MY' },
  '吉隆坡': { countryCode: 'MY', city: 'Kuala Lumpur' },
  '檳城': { countryCode: 'MY', city: 'Penang' },
  'kuala lumpur': { countryCode: 'MY', city: 'Kuala Lumpur' },
  'malaysia': { countryCode: 'MY' },
  
  // Vietnam
  '越南': { countryCode: 'VN' },
  '胡志明': { countryCode: 'VN', city: 'Ho Chi Minh' },
  '河內': { countryCode: 'VN', city: 'Hanoi' },
  '峴港': { countryCode: 'VN', city: 'Da Nang' },
  'vietnam': { countryCode: 'VN' },
  
  // Hong Kong
  '香港': { countryCode: 'HK' },
  'hong kong': { countryCode: 'HK' },
  'hk': { countryCode: 'HK' },
  
  // Macau
  '澳門': { countryCode: 'MO' },
  'macau': { countryCode: 'MO' },
  
  // Taiwan
  '台灣': { countryCode: 'TW' },
  '台北': { countryCode: 'TW', city: 'Taipei' },
  '高雄': { countryCode: 'TW', city: 'Kaohsiung' },
  'taiwan': { countryCode: 'TW' },
  'taipei': { countryCode: 'TW', city: 'Taipei' },
  
  // USA
  '美國': { countryCode: 'US' },
  '紐約': { countryCode: 'US', city: 'New York' },
  '洛杉磯': { countryCode: 'US', city: 'Los Angeles' },
  '舊金山': { countryCode: 'US', city: 'San Francisco' },
  '拉斯維加斯': { countryCode: 'US', city: 'Las Vegas' },
  'usa': { countryCode: 'US' },
  'united states': { countryCode: 'US' },
  
  // UK
  '英國': { countryCode: 'GB' },
  '倫敦': { countryCode: 'GB', city: 'London' },
  'uk': { countryCode: 'GB' },
  'london': { countryCode: 'GB', city: 'London' },
  
  // France
  '法國': { countryCode: 'FR' },
  '巴黎': { countryCode: 'FR', city: 'Paris' },
  'france': { countryCode: 'FR' },
  'paris': { countryCode: 'FR', city: 'Paris' },
  
  // Australia
  '澳洲': { countryCode: 'AU' },
  '澳大利亞': { countryCode: 'AU' },
  '雪梨': { countryCode: 'AU', city: 'Sydney' },
  '墨爾本': { countryCode: 'AU', city: 'Melbourne' },
  'australia': { countryCode: 'AU' },
  'sydney': { countryCode: 'AU', city: 'Sydney' },
};

function matchDestination(input: string): { countryCode: string; city?: string } | null {
  const normalized = input.toLowerCase().trim();
  
  // Direct match
  if (DESTINATION_MAP[input] || DESTINATION_MAP[normalized]) {
    return DESTINATION_MAP[input] || DESTINATION_MAP[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(DESTINATION_MAP)) {
    if (key.toLowerCase().includes(normalized) || normalized.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

// POST /api/draft/match-destination - Match destination name to country code
app.post('/api/draft/match-destination', async (req, res) => {
  try {
    const { destination } = req.body;

    if (!destination) {
      return res.status(400).json({ success: false, error: 'destination is required' });
    }

    const match = matchDestination(destination);

    if (!match) {
      // Try to find in Country table
      const country = await prisma.country.findFirst({
        where: {
          OR: [
            { name: { equals: destination, mode: 'insensitive' } },
            { nameZh: { equals: destination } },
            { nameZhHant: { equals: destination } },
          ],
        },
      });

      if (country) {
        return res.json({
          success: true,
          data: {
            countryCode: country.code,
            city: null,
            countryName: country.name,
            countryNameZh: country.nameZh,
          },
        });
      }

      return res.json({
        success: false,
        error: '無法識別目的地',
        code: 'DESTINATION_NOT_FOUND',
      });
    }

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code: match.countryCode },
    });

    res.json({
      success: true,
      data: {
        countryCode: match.countryCode,
        city: match.city || null,
        countryName: country?.name,
        countryNameZh: country?.nameZh,
      },
    });
  } catch (error) {
    console.error('Error matching destination:', error);
    res.status(500).json({ success: false, error: 'Failed to match destination' });
  }
});

// ============================================
// Trip Planning API (OpenAI Integration)
// ============================================

interface TripPlanRequest {
  destination: string;
  countryCode: string;
  city?: string;
  days: number;
  budget: BudgetLevel;
  travelStyles?: string[];
  specialRequests?: string;
}

interface DayItinerary {
  day: number;
  title: string;
  activities: Array<{
    time: string;
    activity: string;
    description: string;
    location?: string;
    cost?: string;
    tips?: string;
  }>;
  funFact?: string;
}

app.post('/api/trips/plan', async (req, res) => {
  try {
    const { destination, countryCode, city, days, budget, travelStyles, specialRequests } = req.body as TripPlanRequest;

    if (!destination || !countryCode || !days) {
      return res.status(400).json({
        success: false,
        error: 'destination, countryCode, and days are required',
      });
    }

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code: countryCode },
    });

    // Get fun facts for the country
    const funFacts = await prisma.funFact.findMany({
      where: { countryCode, isActive: true },
      take: 5,
    });

    // Get legal restrictions (warnings)
    const legalRestrictions = await prisma.legalRestriction.findMany({
      where: { countryCode, isActive: true, severity: { in: ['CRITICAL', 'HIGH'] } },
      take: 3,
    });

    // Build prompt for OpenAI
    const budgetText = {
      LOW: '省錢背包客，尋找免費或便宜的活動',
      MEDIUM: '一般旅遊，平衡舒適和預算',
      HIGH: '不設預算上限，追求最佳體驗',
    }[budget] || '一般旅遊';

    const stylesText = travelStyles && travelStyles.length > 0
      ? travelStyles.join('、')
      : '一般觀光';

    const systemPrompt = `你是一位專業的旅遊規劃師，擅長為旅客設計詳細的行程。請根據用戶的需求，設計一份完整的旅遊行程。

行程格式要求：
1. 每天的行程包含上午、下午、晚上三個時段
2. 每個活動要包含：時間、活動名稱、簡短描述、地點（如有）、預估花費、小提醒
3. 在適當的地方加入當地的 Fun Facts 增加趣味性
4. 考慮交通時間和用餐時間
5. 提供實用的旅遊建議

請用繁體中文回答。`;

    const userPrompt = `請為我規劃一趟 ${destination}${city ? `（${city}）` : ''} 的 ${days} 天行程。

我的旅遊偏好：
- 預算：${budgetText}
- 旅遊風格：${stylesText}
${specialRequests ? `- 特別需求：${specialRequests}` : ''}

請提供詳細的每日行程安排。`;

    // Call DeepSeek
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const itineraryText = completion.choices[0]?.message?.content || '';

    // Format response
    const itinerary: DayItinerary[] = [];
    
    // Parse the itinerary text into structured format
    // For now, we'll return the raw text and let the bot format it
    // In a production app, we'd parse this more carefully

    // Add warnings about legal restrictions
    const warnings = legalRestrictions.map(r => ({
      title: r.title,
      description: r.description,
    }));

    // Add fun facts
    const facts = funFacts.map(f => ({
      category: f.category,
      content: f.content,
    }));

    res.json({
      success: true,
      data: {
        destination,
        countryCode,
        countryName: country?.name,
        countryNameZh: country?.nameZh,
        city,
        days,
        budget,
        travelStyles,
        itineraryText,
        funFacts: facts,
        warnings,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating trip plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate trip plan',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/trips/generate-from-draft - Generate trip from draft
app.post('/api/trips/generate-from-draft', async (req, res) => {
  try {
    const { telegramUserId } = req.body;

    if (!telegramUserId) {
      return res.status(400).json({ success: false, error: 'telegramUserId is required' });
    }

    const draft = await prisma.tripDraft.findUnique({
      where: { telegramUserId },
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found',
        code: 'DRAFT_NOT_FOUND',
      });
    }

    if (!draft.destination || !draft.countryCode || !draft.days || !draft.budget) {
      return res.status(400).json({
        success: false,
        error: 'Draft is incomplete',
        code: 'DRAFT_INCOMPLETE',
      });
    }

    // Update draft step to GENERATING
    await prisma.tripDraft.update({
      where: { telegramUserId },
      data: { step: DraftStep.GENERATING },
    });

    // Call the trip planning API
    const response = await fetch(`http://localhost:${PORT}/api/trips/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: draft.destination,
        countryCode: draft.countryCode,
        city: draft.city,
        days: draft.days,
        budget: draft.budget,
        travelStyles: draft.travelStyles,
        specialRequests: draft.specialRequests,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      // Reset draft step
      await prisma.tripDraft.update({
        where: { telegramUserId },
        data: { step: DraftStep.STYLE },
      });
      
      return res.status(500).json(data);
    }

    // Update draft to COMPLETED
    await prisma.tripDraft.update({
      where: { telegramUserId },
      data: { step: DraftStep.COMPLETED },
    });

    res.json(data);
  } catch (error) {
    console.error('Error generating trip from draft:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate trip from draft',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// Trip Save & Share API (Phase 2.5)
// ============================================

// Generate unique share ID
function generateShareId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase() + 
         Date.now().toString(36).substring(-4).toUpperCase();
}

// POST /api/trips/save - Save a trip
app.post('/api/trips/save', async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      destination, 
      countryCode, 
      city, 
      days, 
      budgetLevel, 
      travelStyles, 
      itineraryText,
      startDate,
      endDate,
    } = req.body;

    if (!destination || !countryCode || !days) {
      return res.status(400).json({
        success: false,
        error: 'destination, countryCode, and days are required',
      });
    }

    // Calculate dates if not provided
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    // Create trip
    const trip = await prisma.trip.create({
      data: {
        userId: userId || null,
        title: title || `${destination} ${days}天行程`,
        destination,
        countryCode,
        city,
        startDate: start,
        endDate: end,
        duration: days,
        budgetLevel,
        travelStyles: travelStyles || [],
        itineraryText,
        status: 'PLANNING',
      },
    });

    res.json({
      success: true,
      data: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        countryCode: trip.countryCode,
        city: trip.city,
        days: trip.duration,
        budgetLevel: trip.budgetLevel,
        travelStyles: trip.travelStyles,
        createdAt: trip.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error saving trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save trip',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/trips - Get user's trips
app.get('/api/trips', async (req, res) => {
  try {
    const { userId, limit = '10', offset = '0' } = req.query;

    const where = userId ? { userId: userId as string, deletedAt: null } : { deletedAt: null };

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
      select: {
        id: true,
        title: true,
        destination: true,
        countryCode: true,
        city: true,
        duration: true,
        budgetLevel: true,
        status: true,
        shareId: true,
        isPublic: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    const total = await prisma.trip.count({ where });

    res.json({
      success: true,
      data: {
        trips: trips.map(t => ({
          ...t,
          startDate: t.startDate.toISOString().split('T')[0],
          endDate: t.endDate.toISOString().split('T')[0],
          createdAt: t.createdAt.toISOString(),
        })),
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trips',
    });
  }
});

// GET /api/trips/:id - Get a single trip
app.get('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...trip,
        startDate: trip.startDate.toISOString().split('T')[0],
        endDate: trip.endDate.toISOString().split('T')[0],
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trip',
    });
  }
});

// DELETE /api/trips/:id - Delete a trip (soft delete)
app.delete('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Trip deleted',
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete trip',
    });
  }
});

// PATCH /api/trips/:id - Update a trip
app.patch('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      destination, 
      countryCode, 
      city, 
      days, 
      budgetLevel, 
      travelStyles, 
      itineraryText,
      startDate,
      endDate,
      status,
    } = req.body;

    const existingTrip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (destination !== undefined) updateData.destination = destination;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (city !== undefined) updateData.city = city;
    if (days !== undefined) updateData.duration = days;
    if (budgetLevel !== undefined) updateData.budgetLevel = budgetLevel;
    if (travelStyles !== undefined) updateData.travelStyles = travelStyles;
    if (itineraryText !== undefined) updateData.itineraryText = itineraryText;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    const trip = await prisma.trip.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        countryCode: trip.countryCode,
        city: trip.city,
        duration: trip.duration,
        budgetLevel: trip.budgetLevel,
        travelStyles: trip.travelStyles,
        itineraryText: trip.itineraryText,
        status: trip.status,
        startDate: trip.startDate.toISOString().split('T')[0],
        endDate: trip.endDate.toISOString().split('T')[0],
        updatedAt: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update trip',
    });
  }
});

// POST /api/trips/:id/regenerate - Regenerate itinerary with AI
app.post('/api/trips/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    const { specialRequests } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
      });
    }

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code: trip.countryCode },
    });

    // Build prompt
    const budgetText = {
      LOW: '省錢背包客，尋找免費或便宜的活動',
      MEDIUM: '一般旅遊，平衡舒適和預算',
      HIGH: '不設預算上限，追求最佳體驗',
    }[trip.budgetLevel as string] || '一般旅遊';

    const stylesText = trip.travelStyles && Array.isArray(trip.travelStyles) && trip.travelStyles.length > 0
      ? (trip.travelStyles as string[]).join('、')
      : '一般觀光';

    const systemPrompt = `你是一位專業的旅遊規劃師，擅長為旅客設計詳細的行程。請根據用戶的需求，設計一份完整的旅遊行程。

行程格式要求：
1. 每天的行程包含上午、下午、晚上三個時段
2. 每個活動要包含：時間、活動名稱、簡短描述、地點（如有）、預估花費、小提醒
3. 在適當的地方加入當地的 Fun Facts 增加趣味性
4. 考慮交通時間和用餐時間
5. 提供實用的旅遊建議

請用繁體中文回答。`;

    const userPrompt = `請為我規劃一趟 ${trip.destination}${trip.city ? `（${trip.city}）` : ''} 的 ${trip.duration} 天行程。

我的旅遊偏好：
- 預算：${budgetText}
- 旅遊風格：${stylesText}
${specialRequests ? `- 特別需求：${specialRequests}` : ''}

請提供詳細的每日行程安排。`;

    // Call DeepSeek
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const itineraryText = completion.choices[0]?.message?.content || '';

    // Update trip with new itinerary
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: { itineraryText },
    });

    res.json({
      success: true,
      data: {
        itineraryText: updatedTrip.itineraryText,
        updatedAt: updatedTrip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error regenerating itinerary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate itinerary',
    });
  }
});

// POST /api/trips/:id/share - Generate share link
app.post('/api/trips/:id/share', async (req, res) => {
  try {
    const { id } = req.params;

    const existingTrip = await prisma.trip.findUnique({
      where: { id },
    });

    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
      });
    }

    // Generate unique share ID if not exists
    const shareId = existingTrip.shareId || generateShareId();

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        shareId,
        isPublic: true,
      },
    });

    const shareUrl = `${process.env.WEB_URL || 'http://localhost:3015'}/trip/${shareId}`;

    res.json({
      success: true,
      data: {
        shareId,
        shareUrl,
      },
    });
  } catch (error) {
    console.error('Error sharing trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share trip',
    });
  }
});

// GET /api/trips/share/:shareId - Get trip by share ID (public)
app.get('/api/trips/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;

    const trip = await prisma.trip.findFirst({
      where: {
        shareId,
        isPublic: true,
        deletedAt: null,
      },
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or not public',
      });
    }

    res.json({
      success: true,
      data: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        countryCode: trip.countryCode,
        city: trip.city,
        duration: trip.duration,
        budgetLevel: trip.budgetLevel,
        travelStyles: trip.travelStyles,
        itineraryText: trip.itineraryText,
        startDate: trip.startDate.toISOString().split('T')[0],
        endDate: trip.endDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error fetching shared trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared trip',
    });
  }
});

// ============================================
// User Settings API
// ============================================

// GET /api/user/settings - Get user settings (including nationality)
app.get('/api/user/settings', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const user = await prisma.user.findFirst({
      where: { phone: telegramId },
      select: { id: true, nationality: true, name: true },
    });

    if (!user) {
      return res.json({
        success: true,
        data: { nationality: null },
      });
    }

    res.json({
      success: true,
      data: {
        nationality: user.nationality,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user settings' });
  }
});

// POST /api/user/settings - Update user settings
app.post('/api/user/settings', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { nationality } = req.body;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    if (!nationality) {
      return res.status(400).json({ success: false, error: 'Nationality is required' });
    }

    // Get or create user
    const userId = await getOrCreateUser(telegramId);

    // Update user's nationality
    const user = await prisma.user.update({
      where: { id: userId },
      data: { nationality },
      select: { id: true, nationality: true, name: true },
    });

    res.json({
      success: true,
      data: {
        nationality: user.nationality,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update user settings' });
  }
});

// ============================================
// Passport Management API (Phase 2)
// ============================================

// GET /api/user/passport - Get passport info
app.get('/api/user/passport', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);
    
    const passport = await prisma.passport.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, nationality: true },
        },
      },
    });

    if (!passport) {
      return res.json({
        success: true,
        data: null,
        message: '尚未設定護照資訊',
      });
    }

    // Calculate expiry status
    const now = new Date();
    const expiryDate = passport.expiryDate;
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 180; // 6 months
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

    res.json({
      success: true,
      data: {
        id: passport.id,
        passportNo: passport.passportNo,
        fullName: passport.fullName,
        dateOfBirth: passport.dateOfBirth?.toISOString().split('T')[0],
        issueDate: passport.issueDate?.toISOString().split('T')[0],
        expiryDate: passport.expiryDate?.toISOString().split('T')[0],
        issuingCountry: passport.issuingCountry,
        daysUntilExpiry,
        isExpiringSoon,
        isExpired,
        warning: isExpired 
          ? '護照已過期，請儘速換發'
          : isExpiringSoon 
            ? `護照將在 ${daysUntilExpiry} 天後到期，建議儘速換發` 
            : null,
      },
    });
  } catch (error) {
    console.error('Error fetching passport:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch passport' });
  }
});

// POST /api/user/passport - Create or update passport
app.post('/api/user/passport', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId, req.body.name);
    
    const {
      passportNo,
      fullName,
      dateOfBirth,
      issueDate,
      expiryDate,
      issuingCountry,
    } = req.body;

    // Validate required fields
    if (!passportNo || !fullName || !expiryDate) {
      return res.status(400).json({
        success: false,
        error: '護照號碼、姓名和到期日為必填欄位',
      });
    }

    // Validate expiry date format
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) {
      return res.status(400).json({
        success: false,
        error: '無效的日期格式',
      });
    }

    // Upsert passport
    const passport = await prisma.passport.upsert({
      where: { userId },
      create: {
        userId,
        passportNo,
        fullName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: new Date(expiryDate),
        issuingCountry: issuingCountry || 'TW',
      },
      update: {
        passportNo,
        fullName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: new Date(expiryDate),
        issuingCountry: issuingCountry || 'TW',
      },
    });

    // Calculate expiry status
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysUntilExpiry < 180;
    const isExpired = daysUntilExpiry <= 0;

    res.json({
      success: true,
      data: {
        id: passport.id,
        passportNo: passport.passportNo,
        fullName: passport.fullName,
        expiryDate: passport.expiryDate?.toISOString().split('T')[0],
        daysUntilExpiry,
        isExpiringSoon,
        isExpired,
        warning: isExpired 
          ? '護照已過期，請儘速換發'
          : isExpiringSoon 
            ? `護照將在 ${daysUntilExpiry} 天後到期，建議儘速換發` 
            : null,
      },
      message: '護照資訊已儲存',
    });
  } catch (error) {
    console.error('Error saving passport:', error);
    res.status(500).json({ success: false, error: 'Failed to save passport' });
  }
});

// DELETE /api/user/passport - Delete passport
app.delete('/api/user/passport', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);
    
    const passport = await prisma.passport.findUnique({
      where: { userId },
    });

    if (!passport) {
      return res.status(404).json({
        success: false,
        error: '找不到護照資訊',
      });
    }

    await prisma.passport.delete({
      where: { userId },
    });

    res.json({
      success: true,
      message: '護照資訊已刪除',
    });
  } catch (error) {
    console.error('Error deleting passport:', error);
    res.status(500).json({ success: false, error: 'Failed to delete passport' });
  }
});

// ============================================
// Reminder System API (Phase 2)
// ============================================

// POST /api/reminders/check - Manually trigger passport expiry check
app.post('/api/reminders/check', async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    // Find all passports expiring within 6 months
    const expiringPassports = await prisma.passport.findMany({
      where: {
        expiryDate: {
          lte: sixMonthsLater,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true, // telegram ID
          },
        },
      },
    });

    const notifications: Array<{
      userId: string;
      telegramId: string | null;
      passportNo: string | null;
      daysUntilExpiry: number;
    }> = [];

    for (const passport of expiringPassports) {
      const daysUntilExpiry = Math.ceil(
        (passport.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we already sent a notification recently (within 7 days)
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: passport.userId,
          type: NotificationType.PASSPORT_EXPIRY,
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!recentNotification) {
        // Create notification record
        await prisma.notification.create({
          data: {
            userId: passport.userId,
            type: NotificationType.PASSPORT_EXPIRY,
            title: '護照即將到期提醒',
            message: daysUntilExpiry <= 0
              ? `您的護照 (${passport.passportNo}) 已過期，請儘速換發以避免影響行程。`
              : `您的護照 (${passport.passportNo}) 將在 ${daysUntilExpiry} 天後到期，建議儘速換發。`,
            relatedId: passport.id,
            relatedType: 'passport',
          },
        });

        notifications.push({
          userId: passport.userId,
          telegramId: passport.user.phone,
          passportNo: passport.passportNo,
          daysUntilExpiry,
        });
      }
    }

    res.json({
      success: true,
      data: {
        checkedAt: now.toISOString(),
        expiringCount: expiringPassports.length,
        notificationsCreated: notifications.length,
        notifications,
      },
    });
  } catch (error) {
    console.error('Error checking reminders:', error);
    res.status(500).json({ success: false, error: 'Failed to check reminders' });
  }
});

// GET /api/reminders/notifications - Get user notifications
app.get('/api/reminders/notifications', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// POST /api/reminders/notifications/:id/read - Mark notification as read
app.post('/api/reminders/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true, message: '已標記為已讀' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

// ============================================
// Prohibited Items Checker API (Phase 2)
// ============================================

// POST /api/legal/:countryCode/check - Check items against prohibited list
app.post('/api/legal/:countryCode/check', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { items } = req.body as { items: string[] };
    const code = countryCode.toUpperCase();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '請提供要檢查的物品清單',
      });
    }

    // Get country info
    const country = await prisma.country.findUnique({
      where: { code },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${code} not found`,
      });
    }

    // Get all legal restrictions for this country
    const restrictions = await prisma.legalRestriction.findMany({
      where: {
        countryCode: code,
        isActive: true,
        category: {
          in: ['PROHIBITED_ITEMS', 'RESTRICTED_ITEMS', 'MEDICATION', 'FOOD_PRODUCTS'],
        },
      },
    });

    // Build item database from restrictions
    interface ItemCheck {
      item: string;
      status: 'prohibited' | 'restricted' | 'safe';
      severity?: string;
      reason?: string;
      notes?: string;
      permitInfo?: string;
      category?: string;
    }

    const results: ItemCheck[] = [];
    const prohibitedItems: Map<string, typeof restrictions[0]> = new Map();
    const restrictedItems: Map<string, typeof restrictions[0]> = new Map();

    // Extract items from restrictions
    for (const r of restrictions) {
      const itemsList = r.items as string[] | null;
      if (itemsList && Array.isArray(itemsList)) {
        for (const itemName of itemsList) {
          if (r.category === 'PROHIBITED_ITEMS' || r.severity === 'CRITICAL' || r.severity === 'HIGH') {
            prohibitedItems.set(itemName.toLowerCase(), r);
          } else {
            restrictedItems.set(itemName.toLowerCase(), r);
          }
        }
      }
    }

    // Check each item
    for (const item of items) {
      const itemLower = item.toLowerCase().trim();
      let found = false;

      // Check prohibited items
      for (const [key, restriction] of prohibitedItems) {
        if (key.includes(itemLower) || itemLower.includes(key)) {
          results.push({
            item,
            status: 'prohibited',
            severity: restriction.severity,
            reason: restriction.title,
            category: restriction.category,
            notes: restriction.description,
          });
          found = true;
          break;
        }
      }

      if (found) continue;

      // Check restricted items
      for (const [key, restriction] of restrictedItems) {
        if (key.includes(itemLower) || itemLower.includes(key)) {
          results.push({
            item,
            status: 'restricted',
            notes: restriction.description,
            permitInfo: restriction.permitRequired ? (restriction.permitInfo ?? undefined) : undefined,
            category: restriction.category,
          });
          found = true;
          break;
        }
      }

      if (!found) {
        results.push({
          item,
          status: 'safe',
        });
      }
    }

    // Group results
    const prohibited = results.filter((r) => r.status === 'prohibited');
    const restricted = results.filter((r) => r.status === 'restricted');
    const safe = results.filter((r) => r.status === 'safe');

    res.json({
      success: true,
      data: {
        countryCode: code,
        countryName: country.name,
        countryNameZh: country.nameZh,
        flagEmoji: country.flagEmoji,
        checkedAt: new Date().toISOString(),
        summary: {
          total: items.length,
          prohibited: prohibited.length,
          restricted: restricted.length,
          safe: safe.length,
        },
        prohibited,
        restricted,
        safe,
      },
    });
  } catch (error) {
    console.error('Error checking items:', error);
    res.status(500).json({ success: false, error: 'Failed to check items' });
  }
});

// ============================================
// Policy Changes API (Phase 2)
// ============================================

// GET /api/policy-changes - Get policy changes list
app.get('/api/policy-changes', async (req, res) => {
  try {
    const { countryCode, type, limit = '20', offset = '0' } = req.query;

    const where: {
      isActive: boolean;
      countryCode?: string;
      type?: string;
    } = { isActive: true };

    if (countryCode) {
      where.countryCode = (countryCode as string).toUpperCase();
    }
    if (type) {
      where.type = type as string;
    }

    const policyChanges = await prisma.policyChange.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
    });

    const total = await prisma.policyChange.count({ where });

    // Get country names
    const countryCodes = [...new Set(policyChanges.map((p) => p.countryCode))];
    const countries = await prisma.country.findMany({
      where: { code: { in: countryCodes } },
      select: { code: true, name: true, nameZh: true, flagEmoji: true },
    });
    const countryMap = new Map(countries.map((c) => [c.code, c]));

    const formattedChanges = policyChanges.map((p) => {
      const country = countryMap.get(p.countryCode);
      return {
        id: p.id,
        countryCode: p.countryCode,
        countryName: country?.name,
        countryNameZh: country?.nameZh,
        flagEmoji: country?.flagEmoji,
        type: p.type,
        title: p.title,
        description: p.description,
        effectiveDate: p.effectiveDate.toISOString().split('T')[0],
        source: p.source,
        createdAt: p.createdAt.toISOString(),
      };
    });

    res.json({
      success: true,
      data: {
        policyChanges: formattedChanges,
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching policy changes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policy changes' });
  }
});

// POST /api/policy-changes - Create policy change (admin)
app.post('/api/policy-changes', async (req, res) => {
  try {
    const { countryCode, type, title, description, effectiveDate, source } = req.body;

    if (!countryCode || !type || !title || !description || !effectiveDate) {
      return res.status(400).json({
        success: false,
        error: 'countryCode, type, title, description, effectiveDate are required',
      });
    }

    const policyChange = await prisma.policyChange.create({
      data: {
        countryCode: countryCode.toUpperCase(),
        type,
        title,
        description,
        effectiveDate: new Date(effectiveDate),
        source,
      },
    });

    res.json({
      success: true,
      data: policyChange,
      message: '政策變更已建立',
    });
  } catch (error) {
    console.error('Error creating policy change:', error);
    res.status(500).json({ success: false, error: 'Failed to create policy change' });
  }
});

// GET /api/policy-changes/:countryCode - Get policy changes for a country
app.get('/api/policy-changes/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const code = countryCode.toUpperCase();

    const country = await prisma.country.findUnique({
      where: { code },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: `Country ${code} not found`,
      });
    }

    const policyChanges = await prisma.policyChange.findMany({
      where: {
        countryCode: code,
        isActive: true,
      },
      orderBy: { effectiveDate: 'desc' },
      take: 10,
    });

    const formattedChanges = policyChanges.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      description: p.description,
      effectiveDate: p.effectiveDate.toISOString().split('T')[0],
      source: p.source,
      createdAt: p.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: {
        countryCode: code,
        countryName: country.name,
        countryNameZh: country.nameZh,
        flagEmoji: country.flagEmoji,
        policyChanges: formattedChanges,
        total: formattedChanges.length,
      },
    });
  } catch (error) {
    console.error('Error fetching policy changes for country:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policy changes' });
  }
});

// ============================================
// User Profile API (Phase 3)
// ============================================

// GET /api/user/profile - Get user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const user = await prisma.user.findFirst({
      where: { phone: telegramId },
      include: {
        passport: {
          select: {
            passportNo: true,
            fullName: true,
            expiryDate: true,
            issuingCountry: true,
          },
        },
        preferences: true,
        _count: {
          select: { trips: true },
        },
      },
    });

    if (!user) {
      return res.json({
        success: true,
        data: {
          isNewUser: true,
          name: null,
          email: null,
          nationality: null,
          passport: null,
          preferences: null,
          tripCount: 0,
        },
      });
    }

    // Get country name if nationality set
    let nationalityName = null;
    if (user.nationality) {
      const country = await prisma.country.findUnique({
        where: { code: user.nationality },
        select: { name: true, nameZh: true },
      });
      nationalityName = country?.nameZh || country?.name;
    }

    res.json({
      success: true,
      data: {
        isNewUser: false,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nationality: user.nationality,
        nationalityName,
        avatar: user.avatar,
        passport: user.passport ? {
          passportNo: user.passport.passportNo,
          fullName: user.passport.fullName,
          expiryDate: user.passport.expiryDate?.toISOString().split('T')[0],
          issuingCountry: user.passport.issuingCountry,
        } : null,
        preferences: user.preferences ? {
          language: user.preferences.language,
          currency: user.preferences.currency,
          timezone: user.preferences.timezone,
          visaExpiry: user.preferences.visaExpiry,
          policyChanges: user.preferences.policyChanges,
          tripReminders: user.preferences.tripReminders,
        } : null,
        tripCount: user._count.trips,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PATCH /api/user/profile - Update user profile
app.patch('/api/user/profile', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { name, email, nationality, avatar } = req.body;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId, name);

    // Validate nationality if provided
    if (nationality) {
      const country = await prisma.country.findUnique({
        where: { code: nationality.toUpperCase() },
      });
      if (!country) {
        return res.status(400).json({
          success: false,
          error: '無效的國家代碼',
        });
      }
    }

    const updateData: {
      name?: string;
      email?: string;
      nationality?: string;
      avatar?: string;
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (nationality !== undefined) updateData.nationality = nationality.toUpperCase();
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        nationality: user.nationality,
        avatar: user.avatar,
      },
      message: '個人資料已更新',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ============================================
// User Preferences API (Phase 3)
// ============================================

// GET /api/user/preferences - Get user preferences
app.get('/api/user/preferences', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);
    
    let preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: { userId },
      });
    }

    res.json({
      success: true,
      data: {
        language: preferences.language,
        currency: preferences.currency,
        timezone: preferences.timezone,
        visaExpiry: preferences.visaExpiry,
        policyChanges: preferences.policyChanges,
        tripReminders: preferences.tripReminders,
        emailNotif: preferences.emailNotif,
        pushNotif: preferences.pushNotif,
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
  }
});

// PATCH /api/user/preferences - Update user preferences
app.patch('/api/user/preferences', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { 
      language, 
      currency, 
      timezone, 
      visaExpiry, 
      policyChanges, 
      tripReminders,
      emailNotif,
      pushNotif,
    } = req.body;
    
    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);

    // Build update data
    const updateData: {
      language?: string;
      currency?: string;
      timezone?: string;
      visaExpiry?: boolean;
      policyChanges?: boolean;
      tripReminders?: boolean;
      emailNotif?: boolean;
      pushNotif?: boolean;
    } = {};
    
    if (language !== undefined) updateData.language = language;
    if (currency !== undefined) updateData.currency = currency;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (visaExpiry !== undefined) updateData.visaExpiry = visaExpiry;
    if (policyChanges !== undefined) updateData.policyChanges = policyChanges;
    if (tripReminders !== undefined) updateData.tripReminders = tripReminders;
    if (emailNotif !== undefined) updateData.emailNotif = emailNotif;
    if (pushNotif !== undefined) updateData.pushNotif = pushNotif;

    // Upsert preferences
    const preferences = await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...updateData,
      },
      update: updateData,
    });

    res.json({
      success: true,
      data: {
        language: preferences.language,
        currency: preferences.currency,
        timezone: preferences.timezone,
        visaExpiry: preferences.visaExpiry,
        policyChanges: preferences.policyChanges,
        tripReminders: preferences.tripReminders,
        emailNotif: preferences.emailNotif,
        pushNotif: preferences.pushNotif,
      },
      message: '偏好設定已更新',
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
});

// ============================================
// Flight Tracking API
// ============================================

// AviationStack API helper
async function fetchFlightFromAviationStack(flightIata: string, date?: string) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) {
    console.warn('AVIATIONSTACK_API_KEY not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      access_key: apiKey,
      flight_iata: flightIata,
    });

    if (date) {
      params.append('flight_date', date);
    }

    const response = await fetch(`http://api.aviationstack.com/v1/flights?${params}`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (error) {
    console.error('AviationStack API error:', error);
    return null;
  }
}

// Map AviationStack status to our FlightStatus
function mapFlightStatus(status: string, departure?: { actual?: string; estimated?: string }, arrival?: { actual?: string; estimated?: string }): string {
  const statusMap: Record<string, string> = {
    'scheduled': 'SCHEDULED',
    'active': 'ACTIVE',
    'landed': 'LANDED',
    'cancelled': 'CANCELLED',
    'incident': 'INCIDENT',
    'diverted': 'DIVERTED',
  };

  // Check for delay
  if (status === 'scheduled' && departure?.estimated && departure?.actual) {
    return 'DELAYED';
  }

  return statusMap[status] || 'UNKNOWN';
}

// GET /api/flights/search - Search for a flight
app.get('/api/flights/search', async (req, res) => {
  try {
    const { flightNumber, date } = req.query;

    if (!flightNumber) {
      return res.status(400).json({ success: false, error: 'Flight number required' });
    }

    const flightData = await fetchFlightFromAviationStack(flightNumber as string, date as string);

    if (!flightData) {
      return res.json({
        success: true,
        data: null,
        message: '找不到此航班資訊',
      });
    }

    res.json({
      success: true,
      data: {
        flightIata: flightData.flight?.iata || flightData.flight?.icao,
        airline: flightData.airline?.name,
        airlineIata: flightData.airline?.iata,
        status: mapFlightStatus(flightData.flight_status),
        departure: {
          airport: flightData.departure?.airport,
          iata: flightData.departure?.iata,
          timezone: flightData.departure?.timezone,
          scheduled: flightData.departure?.scheduled,
          estimated: flightData.departure?.estimated,
          actual: flightData.departure?.actual,
          gate: flightData.departure?.gate,
          terminal: flightData.departure?.terminal,
        },
        arrival: {
          airport: flightData.arrival?.airport,
          iata: flightData.arrival?.iata,
          timezone: flightData.arrival?.timezone,
          scheduled: flightData.arrival?.scheduled,
          estimated: flightData.arrival?.estimated,
          actual: flightData.arrival?.actual,
          gate: flightData.arrival?.gate,
          terminal: flightData.arrival?.terminal,
        },
        aircraft: flightData.aircraft ? {
          registration: flightData.aircraft.registration,
          model: flightData.aircraft.model?.text,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error searching flight:', error);
    res.status(500).json({ success: false, error: 'Failed to search flight' });
  }
});

// GET /api/flights/tracked - Get user's tracked flights
app.get('/api/flights/tracked', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);

    const flights = await prisma.trackedFlight.findMany({
      where: { userId },
      include: {
        alerts: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { flightDate: 'asc' },
    });

    const formattedFlights = flights.map(f => ({
      id: f.id,
      airline: f.airline,
      flightNumber: f.flightNumber,
      flightDate: f.flightDate.toISOString().split('T')[0],
      departureAirport: f.departureAirport,
      arrivalAirport: f.arrivalAirport,
      status: f.status,
      departureTime: f.departureTime?.toISOString(),
      arrivalTime: f.arrivalTime?.toISOString(),
      departureGate: f.departureGate,
      arrivalGate: f.arrivalGate,
      departureTerminal: f.departureTerminal,
      arrivalTerminal: f.arrivalTerminal,
      delayMinutes: f.delayMinutes,
      lastSynced: f.lastSynced?.toISOString(),
      notifyDelay: f.notifyDelay,
      notifyGate: f.notifyGate,
      notifyDeparture: f.notifyDeparture,
      notifyArrival: f.notifyArrival,
      unreadAlerts: f.alerts.length,
    }));

    res.json({
      success: true,
      data: {
        flights: formattedFlights,
        total: formattedFlights.length,
      },
    });
  } catch (error) {
    console.error('Error fetching tracked flights:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tracked flights' });
  }
});

// POST /api/flights/track - Track a new flight
app.post('/api/flights/track', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { flightNumber, flightDate } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    if (!flightNumber) {
      return res.status(400).json({ success: false, error: 'Flight number required' });
    }

    // Validate flight number format (e.g., CI123, BR892)
    const flightMatch = flightNumber.match(/^([A-Z]{2})(\d+)$/i);
    if (!flightMatch) {
      return res.status(400).json({
        success: false,
        error: '航班號格式錯誤，請輸入如 CI123、BR892 等格式',
      });
    }

    const userId = await getOrCreateUser(telegramId);
    const airline = flightMatch[1].toUpperCase();
    const date = flightDate ? new Date(flightDate) : new Date();

    // Fetch flight data from AviationStack
    const flightData = await fetchFlightFromAviationStack(
      flightNumber.toUpperCase(),
      date.toISOString().split('T')[0]
    );

    // Extract flight details
    const departureAirport = flightData?.departure?.iata || '';
    const arrivalAirport = flightData?.arrival?.iata || '';
    const status = flightData ? mapFlightStatus(flightData.flight_status) : 'SCHEDULED';

    // Create or update tracked flight
    const trackedFlight = await prisma.trackedFlight.upsert({
      where: {
        userId_airline_flightNumber_flightDate: {
          userId,
          airline,
          flightNumber: flightNumber.toUpperCase(),
          flightDate: date,
        },
      },
      create: {
        userId,
        airline,
        flightNumber: flightNumber.toUpperCase(),
        flightDate: date,
        departureAirport,
        arrivalAirport,
        status: status as any,
        departureTime: flightData?.departure?.estimated
          ? new Date(flightData.departure.estimated)
          : null,
        arrivalTime: flightData?.arrival?.estimated
          ? new Date(flightData.arrival.estimated)
          : null,
        departureGate: flightData?.departure?.gate || null,
        arrivalGate: flightData?.arrival?.gate || null,
        departureTerminal: flightData?.departure?.terminal || null,
        arrivalTerminal: flightData?.arrival?.terminal || null,
        lastSynced: new Date(),
        rawData: flightData,
      },
      update: {
        status: status as any,
        departureTime: flightData?.departure?.estimated
          ? new Date(flightData.departure.estimated)
          : undefined,
        arrivalTime: flightData?.arrival?.estimated
          ? new Date(flightData.arrival.estimated)
          : undefined,
        departureGate: flightData?.departure?.gate || undefined,
        arrivalGate: flightData?.arrival?.gate || undefined,
        lastSynced: new Date(),
        rawData: flightData,
      },
    });

    res.json({
      success: true,
      data: {
        id: trackedFlight.id,
        flightNumber: trackedFlight.flightNumber,
        airline: trackedFlight.airline,
        flightDate: trackedFlight.flightDate.toISOString().split('T')[0],
        departureAirport: trackedFlight.departureAirport,
        arrivalAirport: trackedFlight.arrivalAirport,
        status: trackedFlight.status,
      },
      message: `已開始追蹤航班 ${flightNumber.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Error tracking flight:', error);
    res.status(500).json({ success: false, error: 'Failed to track flight' });
  }
});

// DELETE /api/flights/track/:flightId - Untrack a flight
app.delete('/api/flights/track/:flightId', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { flightId } = req.params;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);

    // Verify ownership
    const flight = await prisma.trackedFlight.findFirst({
      where: { id: flightId, userId },
    });

    if (!flight) {
      return res.status(404).json({ success: false, error: 'Flight not found' });
    }

    await prisma.trackedFlight.delete({
      where: { id: flightId },
    });

    res.json({
      success: true,
      message: `已取消追蹤航班 ${flight.flightNumber}`,
    });
  } catch (error) {
    console.error('Error untracking flight:', error);
    res.status(500).json({ success: false, error: 'Failed to untrack flight' });
  }
});

// PATCH /api/flights/track/:flightId - Update flight notification settings
app.patch('/api/flights/track/:flightId', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { flightId } = req.params;
    const { notifyDelay, notifyGate, notifyDeparture, notifyArrival } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);

    // Verify ownership
    const flight = await prisma.trackedFlight.findFirst({
      where: { id: flightId, userId },
    });

    if (!flight) {
      return res.status(404).json({ success: false, error: 'Flight not found' });
    }

    const updateData: {
      notifyDelay?: boolean;
      notifyGate?: boolean;
      notifyDeparture?: boolean;
      notifyArrival?: boolean;
    } = {};

    if (notifyDelay !== undefined) updateData.notifyDelay = notifyDelay;
    if (notifyGate !== undefined) updateData.notifyGate = notifyGate;
    if (notifyDeparture !== undefined) updateData.notifyDeparture = notifyDeparture;
    if (notifyArrival !== undefined) updateData.notifyArrival = notifyArrival;

    const updated = await prisma.trackedFlight.update({
      where: { id: flightId },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        notifyDelay: updated.notifyDelay,
        notifyGate: updated.notifyGate,
        notifyDeparture: updated.notifyDeparture,
        notifyArrival: updated.notifyArrival,
      },
      message: '通知設定已更新',
    });
  } catch (error) {
    console.error('Error updating flight settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update flight settings' });
  }
});

// GET /api/flights/track/:flightId - Get single tracked flight details
app.get('/api/flights/track/:flightId', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { flightId } = req.params;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    const userId = await getOrCreateUser(telegramId);

    const flight = await prisma.trackedFlight.findFirst({
      where: { id: flightId, userId },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!flight) {
      return res.status(404).json({ success: false, error: 'Flight not found' });
    }

    res.json({
      success: true,
      data: {
        id: flight.id,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        flightDate: flight.flightDate.toISOString().split('T')[0],
        departureAirport: flight.departureAirport,
        arrivalAirport: flight.arrivalAirport,
        status: flight.status,
        departureTime: flight.departureTime?.toISOString(),
        arrivalTime: flight.arrivalTime?.toISOString(),
        departureGate: flight.departureGate,
        arrivalGate: flight.arrivalGate,
        departureTerminal: flight.departureTerminal,
        arrivalTerminal: flight.arrivalTerminal,
        delayMinutes: flight.delayMinutes,
        lastSynced: flight.lastSynced?.toISOString(),
        notifyDelay: flight.notifyDelay,
        notifyGate: flight.notifyGate,
        notifyDeparture: flight.notifyDeparture,
        notifyArrival: flight.notifyArrival,
        alerts: flight.alerts.map(a => ({
          id: a.id,
          type: a.type,
          message: a.message,
          isRead: a.isRead,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching flight details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch flight details' });
  }
});

// ============================================
// Packing List API (Phase 5)
// ============================================

interface PackingListRequest {
  destination: string;
  countryCode: string;
  days: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  tripType: ('leisure' | 'business' | 'adventure' | 'shopping')[];
  specialNeeds?: string[];
}

// Packing items database by category
const PACKING_ITEMS: Record<string, { item: string; essential: boolean; conditions?: string[] }[]> = {
  essentials: [
    { item: '護照', essential: true },
    { item: '機票/電子簽證', essential: true },
    { item: '信用卡', essential: true },
    { item: '現金（當地貨幣）', essential: true },
    { item: '手機充電器', essential: true },
    { item: '轉接頭', essential: false },
    { item: '行程表/訂房確認信', essential: true },
    { item: '旅遊保險', essential: true },
    { item: '緊急聯絡人資訊', essential: true },
  ],
  clothing: [
    { item: '內衣褲', essential: true },
    { item: '襪子', essential: true },
    { item: 'T恤/上衣', essential: true },
    { item: '長褲/短褲', essential: true },
    { item: '外套', essential: false },
    { item: '睡衣', essential: false },
    { item: '泳衣', essential: false, conditions: ['summer', 'leisure'] },
    { item: '帽子', essential: false },
    { item: '太陽眼鏡', essential: false },
    { item: '雨衣/雨傘', essential: false },
  ],
  toiletries: [
    { item: '牙刷/牙膏', essential: true },
    { item: '洗髮精/沐浴乳（旅行裝）', essential: false },
    { item: '護膚乳液', essential: false },
    { item: '防曬乳', essential: false, conditions: ['summer'] },
    { item: '化妝品', essential: false },
    { item: '刮鬍刀', essential: false },
    { item: '衛生紙/濕紙巾', essential: true },
    { item: '棉花棒', essential: false },
  ],
  electronics: [
    { item: '手機', essential: true },
    { item: '相機', essential: false },
    { item: '行動電源', essential: true },
    { item: '耳機', essential: false },
    { item: '自拍棒/腳架', essential: false },
  ],
  medicine: [
    { item: '個人處方藥', essential: true },
    { item: '止痛藥', essential: false },
    { item: '腸胃藥', essential: false },
    { item: '感冒藥', essential: false },
    { item: 'OK繃', essential: false },
    { item: '防蚊液', essential: false },
    { item: '暈車藥', essential: false },
  ],
  documents: [
    { item: '護照影本', essential: false },
    { item: '駕照（國際駕照）', essential: false, conditions: ['adventure'] },
    { item: '疫苗接種證明', essential: false },
    { item: '飯店訂房確認信', essential: true },
  ],
  business: [
    { item: '筆記型電腦', essential: true, conditions: ['business'] },
    { item: '名片', essential: true, conditions: ['business'] },
    { item: '正式服裝', essential: true, conditions: ['business'] },
    { item: '簡報檔案（USB）', essential: false, conditions: ['business'] },
  ],
  adventure: [
    { item: '登山鞋', essential: true, conditions: ['adventure'] },
    { item: '背包', essential: true, conditions: ['adventure'] },
    { item: '頭燈/手電筒', essential: false, conditions: ['adventure'] },
    { item: '水瓶', essential: true, conditions: ['adventure'] },
    { item: '急救包', essential: true, conditions: ['adventure'] },
  ],
};

app.post('/api/packing-list', async (req, res) => {
  try {
    const { destination, countryCode, days, season, tripType, specialNeeds } = req.body as PackingListRequest;

    if (!destination || !days) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: destination, days',
      });
    }

    // Build packing list based on conditions
    const packingList: Record<string, { item: string; checked: boolean; essential: boolean }[]> = {};
    const conditions = [...tripType, season];

    for (const [category, items] of Object.entries(PACKING_ITEMS)) {
      const categoryItems = items
        .filter(item => {
          if (!item.conditions) return true;
          return item.conditions.some(c => conditions.includes(c));
        })
        .map(item => ({
          item: item.item,
          checked: false,
          essential: item.essential,
        }));

      if (categoryItems.length > 0) {
        packingList[category] = categoryItems;
      }
    }

    // Add special needs items
    if (specialNeeds && specialNeeds.length > 0) {
      packingList['special'] = specialNeeds.map(item => ({
        item,
        checked: false,
        essential: true,
      }));
    }

    res.json({
      success: true,
      data: {
        destination,
        days,
        season,
        tripType,
        packingList,
        totalItems: Object.values(packingList).flat().length,
        essentialItems: Object.values(packingList).flat().filter(i => i.essential).length,
      },
    });
  } catch (error) {
    console.error('Error generating packing list:', error);
    res.status(500).json({ success: false, error: 'Failed to generate packing list' });
  }
});

// ============================================
// Budget Calculator API (Phase 5)
// ============================================

interface BudgetRequest {
  destination: string;
  countryCode: string;
  days: number;
  travelers: number;
  budgetLevel: 'low' | 'medium' | 'high';
  includeFlights?: boolean;
  flightOrigin?: string;
}

// Cost data by country (per person per day)
const COST_DATA: Record<string, { low: number; medium: number; high: number; currency: string }> = {
  JP: { low: 3000, medium: 6000, high: 12000, currency: 'TWD' },
  KR: { low: 2500, medium: 5000, high: 10000, currency: 'TWD' },
  TH: { low: 1500, medium: 3000, high: 6000, currency: 'TWD' },
  SG: { low: 3500, medium: 7000, high: 15000, currency: 'TWD' },
  MY: { low: 1500, medium: 3000, high: 6000, currency: 'TWD' },
  VN: { low: 1200, medium: 2500, high: 5000, currency: 'TWD' },
  HK: { low: 3000, medium: 6000, high: 12000, currency: 'TWD' },
  MO: { low: 2500, medium: 5000, high: 10000, currency: 'TWD' },
  TW: { low: 1500, medium: 3000, high: 6000, currency: 'TWD' },
  US: { low: 4000, medium: 8000, high: 20000, currency: 'TWD' },
  GB: { low: 4000, medium: 8000, high: 18000, currency: 'TWD' },
  FR: { low: 3500, medium: 7000, high: 15000, currency: 'TWD' },
  AU: { low: 3500, medium: 7000, high: 15000, currency: 'TWD' },
};

// Flight cost estimates (round trip from TPE)
const FLIGHT_COSTS: Record<string, { low: number; medium: number; high: number }> = {
  JP: { low: 8000, medium: 15000, high: 30000 },
  KR: { low: 6000, medium: 12000, high: 25000 },
  TH: { low: 5000, medium: 10000, high: 20000 },
  SG: { low: 5000, medium: 10000, high: 20000 },
  MY: { low: 5000, medium: 10000, high: 20000 },
  VN: { low: 4000, medium: 8000, high: 18000 },
  HK: { low: 4000, medium: 8000, high: 18000 },
  MO: { low: 5000, medium: 10000, high: 22000 },
  US: { low: 25000, medium: 45000, high: 100000 },
  GB: { low: 20000, medium: 40000, high: 90000 },
  FR: { low: 20000, medium: 35000, high: 80000 },
  AU: { low: 15000, medium: 30000, high: 70000 },
};

app.post('/api/budget', async (req, res) => {
  try {
    const { destination, countryCode, days, travelers, budgetLevel, includeFlights, flightOrigin } = req.body as BudgetRequest;

    if (!countryCode || !days || !travelers || !budgetLevel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: countryCode, days, travelers, budgetLevel',
      });
    }

    const countryCosts = COST_DATA[countryCode] || COST_DATA['JP']; // Default to Japan
    const dailyCost = countryCosts[budgetLevel];

    // Calculate breakdown
    const accommodation = Math.round(dailyCost * 0.35 * days);
    const food = Math.round(dailyCost * 0.25 * days);
    const transport = Math.round(dailyCost * 0.15 * days);
    const activities = Math.round(dailyCost * 0.15 * days);
    const shopping = Math.round(dailyCost * 0.10 * days);
    
    let flightCost = 0;
    if (includeFlights) {
      const flightCosts = FLIGHT_COSTS[countryCode] || FLIGHT_COSTS['JP'];
      flightCost = flightCosts[budgetLevel];
    }

    const totalPerPerson = accommodation + food + transport + activities + shopping + flightCost;
    const grandTotal = totalPerPerson * travelers;

    res.json({
      success: true,
      data: {
        destination,
        countryCode,
        days,
        travelers,
        budgetLevel,
        currency: 'TWD',
        breakdown: {
          accommodation: {
            label: '住宿',
            amount: accommodation,
            percentage: 35,
          },
          food: {
            label: '餐飲',
            amount: food,
            percentage: 25,
          },
          transport: {
            label: '交通',
            amount: transport,
            percentage: 15,
          },
          activities: {
            label: '活動/門票',
            amount: activities,
            percentage: 15,
          },
          shopping: {
            label: '購物/紀念品',
            amount: shopping,
            percentage: 10,
          },
          flight: {
            label: '機票（來回）',
            amount: flightCost,
            percentage: flightCost > 0 ? 0 : 0,
          },
        },
        totalPerPerson,
        grandTotal,
        tips: [
          `建議預留 ${Math.round(grandTotal * 0.1)} 元（10%）作為緊急備用金`,
          budgetLevel === 'low' ? '選擇青年旅館或民宿可節省住宿費用' : '',
          budgetLevel === 'low' ? '利用大眾運輸工具，購買交通券更划算' : '',
          budgetLevel === 'medium' ? '建議提前預訂熱門景點門票' : '',
          budgetLevel === 'high' ? '可考慮包車或私人導遊服務' : '',
        ].filter(Boolean),
      },
    });
  } catch (error) {
    console.error('Error calculating budget:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate budget' });
  }
});

// ============================================
// Weather API (Phase 5)
// ============================================

app.get('/api/weather/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { city, days = '7' } = req.query;

    // Get country info for coordinates
    const country = await prisma.country.findUnique({
      where: { code: countryCode.toUpperCase() },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: 'Country not found',
      });
    }

    // Use capital city coordinates as default
    const cityCoords: Record<string, { lat: number; lon: number; name: string }> = {
      JP: { lat: 35.6762, lon: 139.6503, name: '東京' },
      KR: { lat: 37.5665, lon: 126.9780, name: '首爾' },
      TH: { lat: 13.7563, lon: 100.5018, name: '曼谷' },
      SG: { lat: 1.3521, lon: 103.8198, name: '新加坡' },
      MY: { lat: 3.1390, lon: 101.6869, name: '吉隆坡' },
      VN: { lat: 21.0285, lon: 105.8542, name: '河內' },
      HK: { lat: 22.3193, lon: 114.1694, name: '香港' },
      MO: { lat: 22.1987, lon: 113.5439, name: '澳門' },
      TW: { lat: 25.0330, lon: 121.5654, name: '台北' },
      US: { lat: 40.7128, lon: -74.0060, name: '紐約' },
      GB: { lat: 51.5074, lon: -0.1278, name: '倫敦' },
      FR: { lat: 48.8566, lon: 2.3522, name: '巴黎' },
      AU: { lat: -33.8688, lon: 151.2093, name: '雪梨' },
    };

    const coords = cityCoords[countryCode.toUpperCase()] || cityCoords['JP'];
    const forecastDays = Math.min(parseInt(days as string, 10), 16);

    // Fetch from Open-Meteo API (free, no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,uv_index_max,windspeed_10m_max&timezone=auto&forecast_days=${forecastDays}`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API request failed');
    }

    const weatherData = await weatherResponse.json() as {
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
        weathercode: number[];
        uv_index_max: number[];
        windspeed_10m_max: number[];
      };
      timezone: string;
    };

    // Weather code to description mapping
    const weatherCodeMap: Record<number, { description: string; icon: string }> = {
      0: { description: '晴天', icon: '☀️' },
      1: { description: '晴時多雲', icon: '🌤️' },
      2: { description: '多雲', icon: '⛅' },
      3: { description: '陰天', icon: '☁️' },
      45: { description: '霧', icon: '🌫️' },
      48: { description: '霧凇', icon: '🌫️' },
      51: { description: '小雨', icon: '🌦️' },
      53: { description: '中雨', icon: '🌧️' },
      55: { description: '大雨', icon: '🌧️' },
      61: { description: '小雨', icon: '🌦️' },
      63: { description: '中雨', icon: '🌧️' },
      65: { description: '大雨', icon: '🌧️' },
      71: { description: '小雪', icon: '🌨️' },
      73: { description: '中雪', icon: '❄️' },
      75: { description: '大雪', icon: '❄️' },
      80: { description: '陣雨', icon: '🌦️' },
      81: { description: '中陣雨', icon: '🌧️' },
      82: { description: '大陣雨', icon: '⛈️' },
      95: { description: '雷雨', icon: '⛈️' },
      96: { description: '雷雨冰雹', icon: '⛈️' },
      99: { description: '強雷雨冰雹', icon: '⛈️' },
    };

    const forecast = weatherData.daily.time.map((date, index) => {
      const code = weatherData.daily.weathercode[index];
      const weather = weatherCodeMap[code] || { description: '未知', icon: '❓' };
      
      return {
        date,
        dayOfWeek: new Date(date).toLocaleDateString('zh-TW', { weekday: 'short' }),
        maxTemp: weatherData.daily.temperature_2m_max[index],
        minTemp: weatherData.daily.temperature_2m_min[index],
        precipitation: weatherData.daily.precipitation_probability_max[index],
        weatherCode: code,
        description: weather.description,
        icon: weather.icon,
        uvIndex: weatherData.daily.uv_index_max[index],
        windSpeed: weatherData.daily.windspeed_10m_max[index],
      };
    });

    // Get current weather
    const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m&timezone=auto`;
    const currentResponse = await fetch(currentUrl);
    const currentData = await currentResponse.json() as {
      current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        weathercode: number;
        windspeed_10m: number;
      };
    };

    const currentWeather = currentData.current;
    const currentCode = currentWeather.weathercode;
    const currentWeatherInfo = weatherCodeMap[currentCode] || { description: '未知', icon: '❓' };

    res.json({
      success: true,
      data: {
        location: {
          country: country.nameZh || country.name,
          city: coords.name,
          countryCode: countryCode.toUpperCase(),
        },
        current: {
          temperature: currentWeather.temperature_2m,
          humidity: currentWeather.relative_humidity_2m,
          weatherCode: currentCode,
          description: currentWeatherInfo.description,
          icon: currentWeatherInfo.icon,
          windSpeed: currentWeather.windspeed_10m,
        },
        forecast,
        timezone: weatherData.timezone,
        tips: generateWeatherTips(forecast, countryCode.toUpperCase()),
      },
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch weather data' });
  }
});

function generateWeatherTips(forecast: { date: string; maxTemp: number; minTemp: number; precipitation: number; description: string }[], countryCode: string): string[] {
  const tips: string[] = [];
  
  // Check for rain
  const rainyDays = forecast.filter(d => d.precipitation > 50).length;
  if (rainyDays > 3) {
    tips.push('☔ 這週有較多雨天，建議攜帶雨具');
  }

  // Check temperature range
  const avgTemp = forecast.reduce((sum, d) => sum + d.maxTemp, 0) / forecast.length;
  if (avgTemp > 30) {
    tips.push('🌡️ 氣溫較高，注意防曬和補充水分');
  } else if (avgTemp < 10) {
    tips.push('🧥 氣溫較低，建議攜帶保暖衣物');
  }

  // Country-specific tips
  if (countryCode === 'TH' || countryCode === 'VN' || countryCode === 'SG') {
    tips.push('東南亞地區建議穿著透氣衣物');
  }
  if (countryCode === 'JP' || countryCode === 'KR') {
    tips.push('日韓地區早晚溫差大，建議帶薄外套');
  }

  return tips;
}

// ============================================
// Error handling
// ============================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================
// Graceful shutdown
// ============================================

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Travel Helper API running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 Countries: http://localhost:${PORT}/api/countries`);
      console.log(`📍 Visa: http://localhost:${PORT}/api/visa/:nationality/:destination`);
      console.log(`📍 Legal: http://localhost:${PORT}/api/legal/:countryCode`);
      console.log(`📍 Fun Facts: http://localhost:${PORT}/api/funfacts/:countryCode`);
      console.log(`📍 Passport: http://localhost:${PORT}/api/user/passport`);
      console.log(`📍 Policy Changes: http://localhost:${PORT}/api/policy-changes`);
      console.log(`📍 Flight Search: http://localhost:${PORT}/api/flights/search`);
      console.log(`📍 Flight Track: http://localhost:${PORT}/api/flights/track`);
      console.log(`📍 Reminders: http://localhost:${PORT}/api/reminders/check`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================
// Cron Jobs (Phase 2)
// ============================================

// Daily passport expiry check at 09:00 UTC
cron.schedule('0 9 * * *', async () => {
  console.log('🔍 Running daily passport expiry check...');
  try {
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    // Find all passports expiring within 6 months
    const expiringPassports = await prisma.passport.findMany({
      where: {
        expiryDate: {
          lte: sixMonthsLater,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            notifications: {
              where: {
                type: NotificationType.PASSPORT_EXPIRY,
                createdAt: {
                  gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const passport of expiringPassports) {
      // Skip if already notified within 7 days
      if (passport.user.notifications.length > 0) continue;

      const daysUntilExpiry = Math.ceil(
        (passport.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create notification
      await prisma.notification.create({
        data: {
          userId: passport.userId,
          type: NotificationType.PASSPORT_EXPIRY,
          title: '護照即將到期提醒',
          message: daysUntilExpiry <= 0
            ? `您的護照 (${passport.passportNo}) 已過期，請儘速換發以避免影響行程。`
            : `您的護照 (${passport.passportNo}) 將在 ${daysUntilExpiry} 天後到期，建議儘速換發。`,
          relatedId: passport.id,
          relatedType: 'passport',
        },
      });

      notificationsCreated++;
      
      console.log(`📢 Passport expiry notification for user ${passport.userId}: ${daysUntilExpiry} days until expiry`);
    }

    console.log(`✅ Daily check complete: ${expiringPassports.length} expiring passports, ${notificationsCreated} notifications sent`);
  } catch (error) {
    console.error('❌ Error in daily passport check:', error);
  }
});

console.log('⏰ Cron job scheduled: daily passport expiry check at 09:00 UTC');

startServer();