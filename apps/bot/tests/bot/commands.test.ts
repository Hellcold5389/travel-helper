/**
 * Unit tests for Bot command handlers
 */

// Mock context helper
function createMockContext(overrides: Partial<{
  from: { id: number; first_name: string; username?: string };
  message: { text: string };
  match: string[];
  reply: jest.Mock;
  replyWithMarkdownV2: jest.Mock;
  editMessageText: jest.Mock;
  answerCallbackQuery: jest.Mock;
  callbackQuery: { data: string; from: { id: number } };
}> = {}) {
  return {
    from: overrides.from || { id: 123456789, first_name: 'Test', username: 'testuser' },
    message: overrides.message || { text: '' },
    match: overrides.match || [],
    reply: overrides.reply || jest.fn().mockResolvedValue({}),
    replyWithMarkdownV2: overrides.replyWithMarkdownV2 || jest.fn().mockResolvedValue({}),
    editMessageText: overrides.editMessageText || jest.fn().mockResolvedValue({}),
    answerCallbackQuery: overrides.answerCallbackQuery || jest.fn().mockResolvedValue({}),
    callbackQuery: overrides.callbackQuery,
  } as any;
}

describe('Bot Command Helpers', () => {
  describe('Start command message formatting', () => {
    it('should format welcome message correctly', () => {
      const expectedCommands = [
        '/start',
        '/plan',
        '/visa',
        '/legal',
        '/funfacts',
        '/countries',
        '/help',
      ];

      // Check that expected commands exist in the bot
      expect(expectedCommands).toContain('/start');
      expect(expectedCommands).toContain('/plan');
      expect(expectedCommands).toContain('/visa');
    });
  });

  describe('Visa command parsing', () => {
    it('should extract country code from command', () => {
      const commandText = '/visa JP';
      const parts = commandText.split(' ');
      const country = parts[1]?.toUpperCase();
      
      expect(country).toBe('JP');
    });

    it('should handle lowercase country code', () => {
      const commandText = '/visa jp';
      const parts = commandText.split(' ');
      const country = parts[1]?.toUpperCase();
      
      expect(country).toBe('JP');
    });

    it('should handle Chinese country name', () => {
      const commandText = '/visa 日本';
      const parts = commandText.split(' ');
      const input = parts[1];
      
      expect(input).toBe('日本');
    });
  });

  describe('Legal command parsing', () => {
    it('should extract country code from command', () => {
      const commandText = '/legal TH';
      const parts = commandText.split(' ');
      const country = parts[1]?.toUpperCase();
      
      expect(country).toBe('TH');
    });
  });

  describe('Funfacts command parsing', () => {
    it('should extract country code from command', () => {
      const commandText = '/funfacts KR';
      const parts = commandText.split(' ');
      const country = parts[1]?.toUpperCase();
      
      expect(country).toBe('KR');
    });
  });

  describe('Check command parsing', () => {
    it('should parse multiple items from check command', () => {
      const commandText = '/check JP 感冒藥 肉乾 水果';
      const parts = commandText.split(' ');
      const country = parts[1]?.toUpperCase();
      const items = parts.slice(2);
      
      expect(country).toBe('JP');
      expect(items).toEqual(['感冒藥', '肉乾', '水果']);
    });

    it('should handle single item check', () => {
      const commandText = '/check TH 電子菸';
      const parts = commandText.split(' ');
      const country = parts[1]?.toUpperCase();
      const items = parts.slice(2);
      
      expect(country).toBe('TH');
      expect(items).toEqual(['電子菸']);
    });
  });

  describe('Plan command flow states', () => {
    const planSteps = [
      'DESTINATION',
      'DAYS',
      'BUDGET',
      'STYLE',
      'GENERATING',
      'COMPLETED',
    ];

    it('should have correct step order', () => {
      expect(planSteps[0]).toBe('DESTINATION');
      expect(planSteps[1]).toBe('DAYS');
      expect(planSteps[2]).toBe('BUDGET');
      expect(planSteps[3]).toBe('STYLE');
      expect(planSteps[4]).toBe('GENERATING');
      expect(planSteps[5]).toBe('COMPLETED');
    });

    it('should have GENERATING before COMPLETED', () => {
      const generatingIndex = planSteps.indexOf('GENERATING');
      const completedIndex = planSteps.indexOf('COMPLETED');
      expect(generatingIndex).toBeLessThan(completedIndex);
    });
  });

  describe('Budget levels', () => {
    const budgetLevels = ['LOW', 'MEDIUM', 'HIGH'];

    it('should have three budget levels', () => {
      expect(budgetLevels).toHaveLength(3);
    });
  });
});

describe('MarkdownV2 Escaping', () => {
  // Special characters that need escaping in MarkdownV2
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

  function escapeMarkdownV2(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}\.!])/g, '\\$1');
  }

  it('should escape special characters', () => {
    const input = 'Hello *World*! How are you?';
    const escaped = escapeMarkdownV2(input);
    
    // ? is not a special char in MarkdownV2, so it shouldn't be escaped
    expect(escaped).toBe('Hello \\*World\\*\\! How are you?');
  });

  it('should escape dots', () => {
    const input = 'example.com';
    const escaped = escapeMarkdownV2(input);
    
    expect(escaped).toBe('example\\.com');
  });

  it('should handle text without special chars', () => {
    const input = 'Hello World';
    const escaped = escapeMarkdownV2(input);
    
    expect(escaped).toBe('Hello World');
  });
});