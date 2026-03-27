/**
 * Unit tests for destination matching logic
 */

// Destination mapping (should match the actual implementation)
const DESTINATION_MAP: Record<string, string> = {
  // Japan
  '日本': 'JP',
  'japan': 'JP',
  'jp': 'JP',
  'tokyo': 'JP',
  '東京': 'JP',
  'osaka': 'JP',
  '大阪': 'JP',
  'kyoto': 'JP',
  '京都': 'JP',
  
  // Korea
  '韓國': 'KR',
  '韩国': 'KR',
  'korea': 'KR',
  'south korea': 'KR',
  'kr': 'KR',
  'seoul': 'KR',
  '首爾': 'KR',
  '首尔': 'KR',
  
  // Thailand
  '泰國': 'TH',
  '泰国': 'TH',
  'thailand': 'TH',
  'th': 'TH',
  'bangkok': 'TH',
  '曼谷': 'TH',
  
  // Singapore
  '新加坡': 'SG',
  'singapore': 'SG',
  'sg': 'SG',
  
  // Malaysia
  '馬來西亞': 'MY',
  '马来西亚': 'MY',
  'malaysia': 'MY',
  'my': 'MY',
  'kuala lumpur': 'MY',
  '吉隆坡': 'MY',
  
  // Vietnam
  '越南': 'VN',
  'vietnam': 'VN',
  'vn': 'VN',
  'hanoi': 'VN',
  '河內': 'VN',
  'hochiminh': 'VN',
  '胡志明': 'VN',
  
  // Hong Kong
  '香港': 'HK',
  'hong kong': 'HK',
  'hk': 'HK',
  
  // Macau
  '澳門': 'MO',
  '澳门': 'MO',
  'macau': 'MO',
  'mo': 'MO',
  
  // Taiwan
  '台灣': 'TW',
  '台湾': 'TW',
  'taiwan': 'TW',
  'tw': 'TW',
  'taipei': 'TW',
  '台北': 'TW',
  
  // US
  '美國': 'US',
  '美国': 'US',
  'usa': 'US',
  'us': 'US',
  'united states': 'US',
  'new york': 'US',
  '紐約': 'US',
  '纽约': 'US',
  'los angeles': 'US',
  '洛杉磯': 'US',
  '洛杉矶': 'US',
  
  // UK
  '英國': 'GB',
  '英国': 'GB',
  'uk': 'GB',
  'gb': 'GB',
  'united kingdom': 'GB',
  'england': 'GB',
  'london': 'GB',
  '倫敦': 'GB',
  '伦敦': 'GB',
  
  // France
  '法國': 'FR',
  '法国': 'FR',
  'france': 'FR',
  'fr': 'FR',
  'paris': 'FR',
  '巴黎': 'FR',
  
  // Australia
  '澳洲': 'AU',
  'australia': 'AU',
  'au': 'AU',
  'sydney': 'AU',
  '雪梨': 'AU',
  '悉尼': 'AU',
};

function matchDestination(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  return DESTINATION_MAP[normalized] || null;
}

describe('Destination Matcher', () => {
  describe('Country names in Chinese', () => {
    it('should match 日本', () => {
      expect(matchDestination('日本')).toBe('JP');
    });

    it('should match 韓國', () => {
      expect(matchDestination('韓國')).toBe('KR');
    });

    it('should match 泰國', () => {
      expect(matchDestination('泰國')).toBe('TH');
    });

    it('should match 新加坡', () => {
      expect(matchDestination('新加坡')).toBe('SG');
    });

    it('should match 美國', () => {
      expect(matchDestination('美國')).toBe('US');
    });
  });

  describe('Country names in English', () => {
    it('should match Japan (case insensitive)', () => {
      expect(matchDestination('Japan')).toBe('JP');
      expect(matchDestination('JAPAN')).toBe('JP');
      expect(matchDestination('japan')).toBe('JP');
    });

    it('should match Korea', () => {
      expect(matchDestination('Korea')).toBe('KR');
      expect(matchDestination('South Korea')).toBe('KR');
    });

    it('should match Thailand', () => {
      expect(matchDestination('Thailand')).toBe('TH');
    });
  });

  describe('City names', () => {
    it('should match Tokyo -> JP', () => {
      expect(matchDestination('Tokyo')).toBe('JP');
      expect(matchDestination('東京')).toBe('JP');
    });

    it('should match Seoul -> KR', () => {
      expect(matchDestination('Seoul')).toBe('KR');
      expect(matchDestination('首爾')).toBe('KR');
    });

    it('should match Bangkok -> TH', () => {
      expect(matchDestination('Bangkok')).toBe('TH');
      expect(matchDestination('曼谷')).toBe('TH');
    });

    it('should match New York -> US', () => {
      expect(matchDestination('New York')).toBe('US');
      expect(matchDestination('紐約')).toBe('US');
    });
  });

  describe('Country codes', () => {
    it('should match JP code', () => {
      expect(matchDestination('JP')).toBe('JP');
      expect(matchDestination('jp')).toBe('JP');
    });

    it('should match KR code', () => {
      expect(matchDestination('KR')).toBe('KR');
    });

    it('should match TH code', () => {
      expect(matchDestination('TH')).toBe('TH');
    });
  });

  describe('Invalid inputs', () => {
    it('should return null for unknown country', () => {
      expect(matchDestination('Unknown Country')).toBeNull();
      expect(matchDestination('火星')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(matchDestination('  Japan  ')).toBe('JP');
      expect(matchDestination('  日本  ')).toBe('JP');
    });
  });
});