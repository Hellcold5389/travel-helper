import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('GET /api/funfacts/:countryCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fun facts for a country', async () => {
    const mockFacts = [
      {
        id: 'fact-1',
        content: '日本有超過 6 萬家便利店，平均每 2300 人就有一家',
        category: 'CULTURE',
        country: { code: 'JP', name: 'Japan' },
      },
      {
        id: 'fact-2',
        content: '東京的米其林星星數量全球第一',
        category: 'FOOD',
        country: { code: 'JP', name: 'Japan' },
      },
    ];

    prismaMock.funFact.findMany.mockResolvedValue(mockFacts);

    const response = await request(app).get('/api/funfacts/JP');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('content');
    expect(response.body.data[0]).toHaveProperty('category');
  });

  it('should return empty array for country with no facts', async () => {
    prismaMock.funFact.findMany.mockResolvedValue([]);

    const response = await request(app).get('/api/funfacts/XX');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });
});