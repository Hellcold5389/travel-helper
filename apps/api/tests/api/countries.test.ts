import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('GET /api/countries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of countries', async () => {
    const mockCountries = [
      {
        code: 'JP',
        name: 'Japan',
        nameZh: '日本',
        nameZhHant: '日本',
        capital: 'Tokyo',
        region: 'Asia',
        currency: 'JPY',
        flagEmoji: '🇯🇵',
      },
      {
        code: 'KR',
        name: 'South Korea',
        nameZh: '韩国',
        nameZhHant: '韓國',
        capital: 'Seoul',
        region: 'Asia',
        currency: 'KRW',
        flagEmoji: '🇰🇷',
      },
    ];

    prismaMock.country.findMany.mockResolvedValue(mockCountries);

    const response = await request(app).get('/api/countries');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('code', 'JP');
    expect(response.body.data[0]).toHaveProperty('name', 'Japan');
    expect(response.body.data[0]).toHaveProperty('flagEmoji', '🇯🇵');
  });

  it('should handle empty countries list', async () => {
    prismaMock.country.findMany.mockResolvedValue([]);

    const response = await request(app).get('/api/countries');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should handle database error', async () => {
    prismaMock.country.findMany.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/api/countries');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Failed to fetch countries');
  });
});