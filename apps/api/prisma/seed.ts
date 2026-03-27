import { PrismaClient, VisaType, RestrictionCategory, Severity, RestrictionType, FunFactCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 0. Clean up existing data (to avoid duplicates)
  // ============================================
  console.log('🧹 Cleaning up existing data...');
  await prisma.legalRestriction.deleteMany({});
  await prisma.funFact.deleteMany({});
  console.log('✅ Cleaned up LegalRestriction and FunFact tables');

  // ============================================
  // 1. Seed Countries
  // ============================================
  console.log('📍 Seeding countries...');
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: 'JP' },
      create: {
        code: 'JP',
        name: 'Japan',
        nameLocal: '日本',
        nameZh: '日本',
        nameZhHant: '日本',
        capital: 'Tokyo',
        region: 'Asia',
        subregion: 'Eastern Asia',
        iso3: 'JPN',
        phoneCode: '+81',
        currency: 'JPY',
        currencyName: 'Japanese Yen',
        languages: ['Japanese'],
        mainLanguage: 'Japanese',
        timezone: 'Asia/Tokyo',
        flagEmoji: '🇯🇵',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'KR' },
      create: {
        code: 'KR',
        name: 'South Korea',
        nameLocal: '대한민국',
        nameZh: '韩国',
        nameZhHant: '韓國',
        capital: 'Seoul',
        region: 'Asia',
        subregion: 'Eastern Asia',
        iso3: 'KOR',
        phoneCode: '+82',
        currency: 'KRW',
        currencyName: 'South Korean Won',
        languages: ['Korean'],
        mainLanguage: 'Korean',
        timezone: 'Asia/Seoul',
        flagEmoji: '🇰🇷',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'TH' },
      create: {
        code: 'TH',
        name: 'Thailand',
        nameLocal: 'ประเทศไทย',
        nameZh: '泰国',
        nameZhHant: '泰國',
        capital: 'Bangkok',
        region: 'Asia',
        subregion: 'South-Eastern Asia',
        iso3: 'THA',
        phoneCode: '+66',
        currency: 'THB',
        currencyName: 'Thai Baht',
        languages: ['Thai'],
        mainLanguage: 'Thai',
        timezone: 'Asia/Bangkok',
        flagEmoji: '🇹🇭',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'SG' },
      create: {
        code: 'SG',
        name: 'Singapore',
        nameLocal: 'Singapura',
        nameZh: '新加坡',
        nameZhHant: '新加坡',
        capital: 'Singapore',
        region: 'Asia',
        subregion: 'South-Eastern Asia',
        iso3: 'SGP',
        phoneCode: '+65',
        currency: 'SGD',
        currencyName: 'Singapore Dollar',
        languages: ['English', 'Chinese', 'Malay', 'Tamil'],
        mainLanguage: 'English',
        timezone: 'Asia/Singapore',
        flagEmoji: '🇸🇬',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'MY' },
      create: {
        code: 'MY',
        name: 'Malaysia',
        nameLocal: 'Malaysia',
        nameZh: '马来西亚',
        nameZhHant: '馬來西亞',
        capital: 'Kuala Lumpur',
        region: 'Asia',
        subregion: 'South-Eastern Asia',
        iso3: 'MYS',
        phoneCode: '+60',
        currency: 'MYR',
        currencyName: 'Malaysian Ringgit',
        languages: ['Malay', 'English', 'Chinese', 'Tamil'],
        mainLanguage: 'Malay',
        timezone: 'Asia/Kuala_Lumpur',
        flagEmoji: '🇲🇾',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'VN' },
      create: {
        code: 'VN',
        name: 'Vietnam',
        nameLocal: 'Việt Nam',
        nameZh: '越南',
        nameZhHant: '越南',
        capital: 'Hanoi',
        region: 'Asia',
        subregion: 'South-Eastern Asia',
        iso3: 'VNM',
        phoneCode: '+84',
        currency: 'VND',
        currencyName: 'Vietnamese Dong',
        languages: ['Vietnamese'],
        mainLanguage: 'Vietnamese',
        timezone: 'Asia/Ho_Chi_Minh',
        flagEmoji: '🇻🇳',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'HK' },
      create: {
        code: 'HK',
        name: 'Hong Kong',
        nameLocal: '香港',
        nameZh: '香港',
        nameZhHant: '香港',
        capital: 'Hong Kong',
        region: 'Asia',
        subregion: 'Eastern Asia',
        iso3: 'HKG',
        phoneCode: '+852',
        currency: 'HKD',
        currencyName: 'Hong Kong Dollar',
        languages: ['Chinese', 'English'],
        mainLanguage: 'Chinese',
        timezone: 'Asia/Hong_Kong',
        flagEmoji: '🇭🇰',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'MO' },
      create: {
        code: 'MO',
        name: 'Macau',
        nameLocal: '澳門',
        nameZh: '澳门',
        nameZhHant: '澳門',
        capital: 'Macau',
        region: 'Asia',
        subregion: 'Eastern Asia',
        iso3: 'MAC',
        phoneCode: '+853',
        currency: 'MOP',
        currencyName: 'Macanese Pataca',
        languages: ['Chinese', 'Portuguese'],
        mainLanguage: 'Chinese',
        timezone: 'Asia/Macau',
        flagEmoji: '🇲🇴',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'US' },
      create: {
        code: 'US',
        name: 'United States',
        nameLocal: 'United States',
        nameZh: '美国',
        nameZhHant: '美國',
        capital: 'Washington, D.C.',
        region: 'Americas',
        subregion: 'Northern America',
        iso3: 'USA',
        phoneCode: '+1',
        currency: 'USD',
        currencyName: 'US Dollar',
        languages: ['English'],
        mainLanguage: 'English',
        timezone: 'America/New_York',
        flagEmoji: '🇺🇸',
      },
      update: {},
    }),
    prisma.country.upsert({
      where: { code: 'TW' },
      create: {
        code: 'TW',
        name: 'Taiwan',
        nameLocal: '台灣',
        nameZh: '台湾',
        nameZhHant: '台灣',
        capital: 'Taipei',
        region: 'Asia',
        subregion: 'Eastern Asia',
        iso3: 'TWN',
        phoneCode: '+886',
        currency: 'TWD',
        currencyName: 'New Taiwan Dollar',
        languages: ['Chinese', 'Taiwanese', 'Hakka'],
        mainLanguage: 'Chinese',
        timezone: 'Asia/Taipei',
        flagEmoji: '🇹🇼',
      },
      update: {},
    }),
  ]);

  console.log(`✅ Created/updated ${countries.length} countries`);

  // ============================================
  // 2. Seed Visa Requirements (Taiwan Passport)
  // ============================================
  console.log('🛂 Seeding visa requirements...');
  const visaRequirements = await Promise.all([
    // Japan - Taiwan
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'JP', nationalityCode: 'TW' } },
      create: {
        countryCode: 'JP',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 90,
        durationNote: '可停留 90 天',
        documents: ['護照（效期 6 個月以上）', '回程機票證明'],
        conditions: ['需出示回程機票', '不可工作'],
        processingTime: '-',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照免簽 90 天',
        officialUrl: 'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html',
        source: '日本外務省',
      },
      update: {},
    }),
    // Korea - Taiwan
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'KR', nationalityCode: 'TW' } },
      create: {
        countryCode: 'KR',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 90,
        durationNote: '可停留 90 天',
        documents: ['護照（效期 6 個月以上）', '回程機票證明'],
        conditions: ['需出示回程機票', '不可工作'],
        processingTime: '-',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照免簽 90 天',
        officialUrl: 'https://www.hikorea.go.kr/',
        source: 'Hi Korea',
      },
      update: {},
    }),
    // Thailand - Taiwan (NEW 2025 visa-free)
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'TH', nationalityCode: 'TW' } },
      create: {
        countryCode: 'TH',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 60,
        durationNote: '可停留 60 天',
        documents: ['護照（效期 6 個月以上）', '回程機票證明'],
        conditions: ['需出示回程機票', '不可工作'],
        processingTime: '-',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '2025年新增免簽，台灣護照免簽 60 天',
        officialUrl: 'https://www.tattpe.org.tw/',
        source: '泰國觀光局',
      },
      update: {},
    }),
    // Singapore - Taiwan
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'SG', nationalityCode: 'TW' } },
      create: {
        countryCode: 'SG',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 30,
        durationNote: '可停留 30 天',
        documents: ['護照（效期 6 個月以上）', '回程機票證明'],
        conditions: ['需出示回程機票', '不可工作'],
        processingTime: '-',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照免簽 30 天',
        officialUrl: 'https://www.ica.gov.sg/',
        source: '新加坡移民與關卡局',
      },
      update: {},
    }),
    // Malaysia - Taiwan
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'MY', nationalityCode: 'TW' } },
      create: {
        countryCode: 'MY',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 30,
        durationNote: '可停留 30 天',
        documents: ['護照（效期 6 個月以上）', '回程機票證明'],
        conditions: ['需出示回程機票', '不可工作'],
        processingTime: '-',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照免簽 30 天',
        officialUrl: 'https://www.imi.gov.my/',
        source: '馬來西亞移民局',
      },
      update: {},
    }),
    // Vietnam - Taiwan (e-visa)
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'VN', nationalityCode: 'TW' } },
      create: {
        countryCode: 'VN',
        nationalityCode: 'TW',
        requirement: VisaType.E_VISA,
        visaType: 'Tourist E-Visa',
        durationDays: 21,
        durationNote: '電子簽證可停留 21 天',
        documents: ['護照（效期 6 個月以上）', '電子簽證申請', '大頭照'],
        conditions: ['需提前申請電子簽證', '不可工作'],
        processingTime: '3-5 工作天',
        fee: 25,
        feeCurrency: 'USD',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照需申請電子簽證',
        officialUrl: 'https://evisa.xuatnhapcanh.gov.vn/',
        source: '越南移民局',
      },
      update: {},
    }),
    // Hong Kong - Taiwan
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'HK', nationalityCode: 'TW' } },
      create: {
        countryCode: 'HK',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 30,
        durationNote: '可停留 30 天（需網上預辦入境）',
        documents: ['護照（效期 6 個月以上）', '網上預辦入境登記'],
        conditions: ['需網上預辦入境登記', '不可工作'],
        processingTime: '即時',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照需網上預辦入境登記，免簽 30 天',
        officialUrl: 'https://www.immd.gov.hk/',
        source: '香港入境事務處',
      },
      update: {},
    }),
    // Macau - Taiwan
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'MO', nationalityCode: 'TW' } },
      create: {
        countryCode: 'MO',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_FREE,
        visaType: 'Tourist',
        durationDays: 30,
        durationNote: '可停留 30 天',
        documents: ['護照（效期 6 個月以上）'],
        conditions: ['不可工作'],
        processingTime: '-',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照免簽 30 天',
        officialUrl: 'https://www.fsm.gov.mo/',
        source: '澳門治安警察局',
      },
      update: {},
    }),
    // USA - Taiwan (needs visa)
    prisma.visaRequirement.upsert({
      where: { countryCode_nationalityCode: { countryCode: 'US', nationalityCode: 'TW' } },
      create: {
        countryCode: 'US',
        nationalityCode: 'TW',
        requirement: VisaType.VISA_REQUIRED,
        visaType: 'B1/B2 Tourist/Business',
        durationDays: 180,
        durationNote: 'B1/B2 簽證可停留最多 180 天（由海關決定）',
        documents: ['護照（效期 6 個月以上）', 'DS-160 申請表', '照片', '財力證明', '面試預約確認單'],
        conditions: ['需面試', '需財力證明', '不可工作'],
        processingTime: '視情況而定',
        fee: 185,
        feeCurrency: 'USD',
        passportValidity: '6 months',
        blankPages: 1,
        notes: '台灣護照需申請 B1/B2 簽證',
        officialUrl: 'https://www.ustraveldocs.com/tw/',
        source: '美國在台協會',
      },
      update: {},
    }),
  ]);

  console.log(`✅ Created/updated ${visaRequirements.length} visa requirements`);

  // ============================================
  // 3. Seed Legal Restrictions
  // ============================================
  console.log('⚖️ Seeding legal restrictions...');
  const legalRestrictions = await Promise.all([
    // === Japan ===
    prisma.legalRestriction.create({
      data: {
        countryCode: 'JP',
        category: RestrictionCategory.MEDICATION,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: '含偽麻黃鹼感冒藥禁止攜帶',
        description: '含 pseudoephedrine 的感冒藥禁止攜帶入境日本',
        items: ['興P感冒膠囊', '伏冒錠', '康是美感冒藥', '一些綜合感冒藥'],
        penalty: '沒收藥品，嚴重者可能被拒絕入境或起訴',
        fineMin: null,
        fineMax: null,
        imprisonment: '可能',
        exceptions: '有醫師處方及證明文件者，可申請攜帶',
        permitRequired: true,
        permitInfo: '需事先申請「攜帶藥品等入境許可」',
        officialUrl: 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/01.html',
        source: '日本厚生勞動省',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'JP',
        category: RestrictionCategory.MEDICATION,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: '含可待因藥品禁止攜帶',
        description: '含 codeine 的止咳藥、止痛藥禁止攜帶入境日本',
        items: ['部分止咳糖漿', '部分止痛藥'],
        penalty: '沒收藥品，嚴重者可能被拒絕入境或起訴',
        permitRequired: true,
        permitInfo: '需事先申請「攜帶藥品等入境許可」',
        officialUrl: 'https://www.mhlw.go.jp/',
        source: '日本厚生勞動省',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'JP',
        category: RestrictionCategory.FOOD_PRODUCTS,
        severity: Severity.MEDIUM,
        type: RestrictionType.ITEM,
        title: '肉類製品禁止攜帶',
        description: '肉乾、香腸等肉類製品禁止攜帶入境日本',
        items: ['肉乾', '香腸', '臘肉', '肉鬆'],
        penalty: '沒收物品，可能罰款',
        exceptions: '經檢疫合格者除外',
        permitRequired: false,
        officialUrl: 'https://www.maff.go.jp/',
        source: '日本農林水產省',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'JP',
        category: RestrictionCategory.FOOD_PRODUCTS,
        severity: Severity.MEDIUM,
        type: RestrictionType.ITEM,
        title: '新鮮水果禁止攜帶',
        description: '新鮮水果禁止攜帶入境日本',
        items: ['蘋果', '橘子', '芒果', '所有新鮮水果'],
        penalty: '沒收物品，可能罰款',
        permitRequired: false,
        officialUrl: 'https://www.maff.go.jp/',
        source: '日本農林水產省',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'JP',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.MEDIUM,
        type: RestrictionType.BEHAVIOR,
        title: '公共場所吸菸',
        description: '在指定吸菸區外的公共場所吸菸是違法的',
        items: null,
        penalty: null,
        fineMin: 50000,
        fineMax: null,
        fineCurrency: 'JPY',
        imprisonment: null,
        permitRequired: false,
        officialUrl: 'https://www.mhlw.go.jp/',
        source: '日本厚生勞動省',
      },
    }),

    // === Thailand ===
    prisma.legalRestriction.create({
      data: {
        countryCode: 'TH',
        category: RestrictionCategory.PROHIBITED_ITEMS,
        severity: Severity.CRITICAL,
        type: RestrictionType.ITEM,
        title: '電子菸/加熱菸完全禁止',
        description: '電子菸、加熱菸在泰國完全禁止，包括持有和使用',
        items: ['電子菸', '加熱菸', 'Vape', 'IQOS', 'RELX'],
        penalty: '沒收設備',
        fineMin: null,
        fineMax: null,
        fineCurrency: 'THB',
        imprisonment: '最高 10 年',
        permitRequired: false,
        officialUrl: 'https://customs.go.th/',
        source: '泰國海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'TH',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.CRITICAL,
        type: RestrictionType.BEHAVIOR,
        title: '不得對王室不敬',
        description: '泰國法律嚴格禁止對王室不敬的言行，包括在社群媒體上的言論',
        items: null,
        penalty: null,
        fineMin: null,
        fineMax: null,
        imprisonment: '最高 15 年',
        permitRequired: false,
        officialUrl: 'https://www.thaigov.go.th/',
        source: '泰國政府',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'TH',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.CRITICAL,
        type: RestrictionType.BEHAVIOR,
        title: '毒品嚴格禁止',
        description: '泰國對毒品零容忍，持有或販賣毒品都是重罪',
        items: ['所有毒品'],
        penalty: null,
        fineMin: null,
        fineMax: null,
        imprisonment: '死刑或終身監禁',
        permitRequired: false,
        officialUrl: 'https://customs.go.th/',
        source: '泰國海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'TH',
        category: RestrictionCategory.CURRENCY,
        severity: Severity.LOW,
        type: RestrictionType.CURRENCY,
        title: '現金攜帶限制',
        description: '攜帶大量現金出入境需申報',
        items: null,
        penalty: null,
        fineMin: null,
        fineMax: null,
        exceptions: '外幣超過 USD 20,000 需申報；泰銖出境超過 THB 50,000 需申報',
        permitRequired: false,
        officialUrl: 'https://customs.go.th/',
        source: '泰國海關',
      },
    }),

    // === Singapore ===
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.PROHIBITED_ITEMS,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: '口香糖禁止攜帶',
        description: '口香糖在新加坡完全禁止（醫療用途除外）',
        items: ['口香糖', '泡泡糖'],
        penalty: '沒收物品',
        fineMin: 1000,
        fineMax: null,
        fineCurrency: 'SGD',
        exceptions: '醫療用途口香糖需醫師處方',
        permitRequired: true,
        permitInfo: '需醫師處方證明',
        officialUrl: 'https://www.customs.gov.sg/',
        source: '新加坡海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.PROHIBITED_ITEMS,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: '電子菸完全禁止',
        description: '電子菸在新加坡完全禁止，包括持有和使用',
        items: ['電子菸', 'Vape', '加熱菸'],
        penalty: '沒收設備',
        fineMin: 2000,
        fineMax: null,
        fineCurrency: 'SGD',
        permitRequired: false,
        officialUrl: 'https://www.customs.gov.sg/',
        source: '新加坡海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.PROHIBITED_ITEMS,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: '手槍型打火機禁止',
        description: '手槍造型的打火機禁止攜帶入境',
        items: ['手槍型打火機', '武器造型打火機'],
        penalty: '沒收物品',
        permitRequired: false,
        officialUrl: 'https://www.customs.gov.sg/',
        source: '新加坡海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.MEDIUM,
        type: RestrictionType.BEHAVIOR,
        title: '亂丟垃圾',
        description: '亂丟垃圾在新加坡是違法的',
        items: null,
        penalty: null,
        fineMin: 1000,
        fineMax: null,
        fineCurrency: 'SGD',
        permitRequired: false,
        officialUrl: 'https://www.nea.gov.sg/',
        source: '新加坡國家環境局',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.LOW,
        type: RestrictionType.BEHAVIOR,
        title: '亂過馬路',
        description: '在非斑馬線或紅綠燈處過馬路是違法的',
        items: null,
        penalty: null,
        fineMin: 20,
        fineMax: 1000,
        fineCurrency: 'SGD',
        permitRequired: false,
        officialUrl: 'https://www.police.gov.sg/',
        source: '新加坡警察',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.MEDIUM,
        type: RestrictionType.BEHAVIOR,
        title: '公共場所吸菸',
        description: '在指定吸菸區外的公共場所吸菸是違法的',
        items: null,
        penalty: null,
        fineMin: 200,
        fineMax: 1000,
        fineCurrency: 'SGD',
        permitRequired: false,
        officialUrl: 'https://www.nea.gov.sg/',
        source: '新加坡國家環境局',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'SG',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.LOW,
        type: RestrictionType.BEHAVIOR,
        title: '不沖馬桶',
        description: '使用公共廁所後不沖馬桶是違法的',
        items: null,
        penalty: null,
        fineMin: 150,
        fineMax: null,
        fineCurrency: 'SGD',
        permitRequired: false,
        officialUrl: 'https://www.nea.gov.sg/',
        source: '新加坡國家環境局',
      },
    }),

    // === Korea ===
    prisma.legalRestriction.create({
      data: {
        countryCode: 'KR',
        category: RestrictionCategory.MEDICATION,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: 'EVE 止痛藥禁止攜帶',
        description: 'EVE 止痛藥含丙烯異丙乙酸尿，2025年4月起禁止攜帶入境',
        items: ['EVE 止痛藥', 'EVE 系列產品'],
        penalty: '沒收藥品',
        permitRequired: false,
        officialUrl: 'https://www.customs.go.kr/',
        source: '韓國關稅廳',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'KR',
        category: RestrictionCategory.FOOD_PRODUCTS,
        severity: Severity.HIGH,
        type: RestrictionType.ITEM,
        title: '豬肉製品禁止攜帶',
        description: '因口蹄疫管制，豬肉製品禁止攜帶入境韓國',
        items: ['豬肉乾', '香腸', '火腿', '所有豬肉製品'],
        penalty: '沒收物品，可能罰款',
        permitRequired: false,
        officialUrl: 'https://www.customs.go.kr/',
        source: '韓國關稅廳',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'KR',
        category: RestrictionCategory.FOOD_PRODUCTS,
        severity: Severity.MEDIUM,
        type: RestrictionType.ITEM,
        title: '牛肉製品需檢疫證明',
        description: '牛肉製品需檢疫證明才能攜帶入境',
        items: ['牛肉乾', '牛肉罐頭', '牛肉製品'],
        penalty: '沒收物品',
        exceptions: '有檢疫證明者可攜帶',
        permitRequired: true,
        permitInfo: '需檢疫證明',
        officialUrl: 'https://www.customs.go.kr/',
        source: '韓國關稅廳',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'KR',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.MEDIUM,
        type: RestrictionType.BEHAVIOR,
        title: '公共場所吸菸',
        description: '在指定吸菸區外的公共場所吸菸是違法的',
        items: null,
        penalty: null,
        fineMin: 100000,
        fineMax: null,
        fineCurrency: 'KRW',
        permitRequired: false,
        officialUrl: 'https://www.mohw.go.kr/',
        source: '韓國保健福祉部',
      },
    }),

    // === Vietnam ===
    prisma.legalRestriction.create({
      data: {
        countryCode: 'VN',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.CRITICAL,
        type: RestrictionType.BEHAVIOR,
        title: '不得批評政府',
        description: '越南法律禁止公開批評政府，包括在社群媒體上的言論',
        items: null,
        penalty: null,
        imprisonment: '可能被拘留',
        permitRequired: false,
        officialUrl: 'https://www.customs.gov.vn/',
        source: '越南海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'VN',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.CRITICAL,
        type: RestrictionType.BEHAVIOR,
        title: '毒品嚴格禁止',
        description: '越南對毒品零容忍，持有或販賣毒品都是重罪',
        items: ['所有毒品'],
        penalty: null,
        imprisonment: '嚴厲處罰',
        permitRequired: false,
        officialUrl: 'https://www.customs.gov.vn/',
        source: '越南海關',
      },
    }),
    prisma.legalRestriction.create({
      data: {
        countryCode: 'VN',
        category: RestrictionCategory.PHOTOGRAPHY,
        severity: Severity.HIGH,
        type: RestrictionType.BEHAVIOR,
        title: '軍事設施禁止攝影',
        description: '越南軍事設施禁止攝影',
        items: null,
        penalty: '沒收設備，可能被拘留',
        permitRequired: false,
        officialUrl: 'https://www.customs.gov.vn/',
        source: '越南海關',
      },
    }),

    // === Malaysia ===
    prisma.legalRestriction.create({
      data: {
        countryCode: 'MY',
        category: RestrictionCategory.BEHAVIOR,
        severity: Severity.CRITICAL,
        type: RestrictionType.BEHAVIOR,
        title: '毒品死刑',
        description: '馬來西亞對毒品零容忍，販賣毒品可判死刑',
        items: ['所有毒品'],
        penalty: null,
        imprisonment: '死刑',
        permitRequired: false,
        officialUrl: 'https://www.customs.gov.my/',
        source: '馬來西亞海關',
      },
    }),
  ]);

  console.log(`✅ Created ${legalRestrictions.length} legal restrictions`);

  // ============================================
  // 4. Seed Fun Facts
  // ============================================
  console.log('📚 Seeding fun facts...');
  const funFacts = await Promise.all([
    // Japan
    prisma.funFact.create({
      data: {
        countryCode: 'JP',
        category: FunFactCategory.STATISTICS,
        title: '便利店密度',
        content: '日本有超過 6 萬家便利店，平均每 2300 人就有一家',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'JP',
        category: FunFactCategory.FOOD,
        title: '米其林星星',
        content: '東京的米其林星星數量全球第一，超過巴黎和紐約的總和',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'JP',
        category: FunFactCategory.TRIVIA,
        title: '自動販賣機',
        content: '日本的自動販賣機數量超過 500 萬台，平均每 23 人就有一台',
        priority: 3,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'JP',
        category: FunFactCategory.NATURE,
        title: '火山數量',
        content: '日本有超過 200 座活火山，佔全球的 10%',
        priority: 4,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'JP',
        category: FunFactCategory.HISTORY,
        title: '淺草寺',
        content: '淺草寺是東京最古老的寺廟，建於公元 628 年',
        priority: 5,
      },
    }),

    // Thailand
    prisma.funFact.create({
      data: {
        countryCode: 'TH',
        category: FunFactCategory.HISTORY,
        title: '未被殖民',
        content: '泰國是全世界唯一沒有被殖民過的東南亞國家',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'TH',
        category: FunFactCategory.TRIVIA,
        title: '曼谷全名',
        content: '曼谷的全名是世界上最長的城市名稱，有 167 個字母',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'TH',
        category: FunFactCategory.CULTURE,
        title: '寺廟數量',
        content: '泰國有超過 35,000 座寺廟',
        priority: 3,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'TH',
        category: FunFactCategory.FOOD,
        title: '大米出口',
        content: '泰國是世界上最大的大米出口國之一',
        priority: 4,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'TH',
        category: FunFactCategory.CULTURE,
        title: '泰拳',
        content: '泰拳是泰國的國術，有超過 500 年的歷史',
        priority: 5,
      },
    }),

    // Singapore
    prisma.funFact.create({
      data: {
        countryCode: 'SG',
        category: FunFactCategory.TRIVIA,
        title: '口香糖禁令',
        content: '新加坡是世界上唯一一個禁止口香糖的國家',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'SG',
        category: FunFactCategory.STATISTICS,
        title: '最昂貴城市',
        content: '新加坡是全球最昂貴的城市之一',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'SG',
        category: FunFactCategory.LANGUAGE,
        title: '官方語言',
        content: '新加坡有 4 種官方語言：英語、華語、馬來語、淡米爾語',
        priority: 3,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'SG',
        category: FunFactCategory.NATURE,
        title: '國花',
        content: '新加坡的國花是卓錦·萬代蘭，是一種蘭花',
        priority: 4,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'SG',
        category: FunFactCategory.STATISTICS,
        title: '綠化率',
        content: '新加坡是世界上綠化率最高的城市之一，約有 50% 的國土被綠色覆蓋',
        priority: 5,
      },
    }),

    // Korea
    prisma.funFact.create({
      data: {
        countryCode: 'KR',
        category: FunFactCategory.STATISTICS,
        title: '網速',
        content: '韓國是全球網速最快的國家之一，平均網速超過 100 Mbps',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'KR',
        category: FunFactCategory.CULTURE,
        title: 'UNESCO 世界遺產',
        content: '韓國有超過 20 個 UNESCO 世界遺產',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'KR',
        category: FunFactCategory.CULTURE,
        title: '化妝品產業',
        content: '韓國的化妝品行業全球知名，K-Beauty 成為全球潮流',
        priority: 3,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'KR',
        category: FunFactCategory.STATISTICS,
        title: '人口密度',
        content: '韓國是世界上人口密度最高的國家之一，首爾都會區人口超過 2500 萬',
        priority: 4,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'KR',
        category: FunFactCategory.FOOD,
        title: '泡菜消費',
        content: '韓國人平均每年吃掉 10 公斤泡菜',
        priority: 5,
      },
    }),

    // Vietnam
    prisma.funFact.create({
      data: {
        countryCode: 'VN',
        category: FunFactCategory.CULTURE,
        title: '機車王國',
        content: '越南是機車王國，河內和胡志明市有超過 500 萬輛機車',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'VN',
        category: FunFactCategory.FOOD,
        title: '咖啡出口',
        content: '越南是世界第二大咖啡出口國，僅次於巴西',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'VN',
        category: FunFactCategory.HISTORY,
        title: '古都順化',
        content: '順化是越南最後一個王朝的首都，皇城建於 1804 年',
        priority: 3,
      },
    }),

    // Malaysia
    prisma.funFact.create({
      data: {
        countryCode: 'MY',
        category: FunFactCategory.NATURE,
        title: '雨林',
        content: '馬來西亞擁有世界上最古老的熱帶雨林，超過 1.3 億年',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'MY',
        category: FunFactCategory.NATURE,
        title: '雙子塔',
        content: '吉隆坡雙子塔曾是世界最高的建築，高 452 公尺',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'MY',
        category: FunFactCategory.FOOD,
        title: '多元美食',
        content: '馬來西亞是美食天堂，融合了馬來、華人、印度三大美食文化',
        priority: 3,
      },
    }),

    // Hong Kong
    prisma.funFact.create({
      data: {
        countryCode: 'HK',
        category: FunFactCategory.STATISTICS,
        title: '摩天大樓',
        content: '香港是世界上摩天大樓最多的城市，超過 300 座',
        priority: 1,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'HK',
        category: FunFactCategory.FOOD,
        title: '茶餐廳',
        content: '茶餐廳是香港獨特的飲食文化，融合中西美食',
        priority: 2,
      },
    }),
    prisma.funFact.create({
      data: {
        countryCode: 'HK',
        category: FunFactCategory.STATISTICS,
        title: '公共交通',
        content: '香港的公共交通使用率全球最高，超過 90% 的出行使用公共交通',
        priority: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${funFacts.length} fun facts`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });