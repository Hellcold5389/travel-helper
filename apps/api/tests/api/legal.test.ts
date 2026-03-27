import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('GET /api/legal/:countryCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return legal restrictions for a country', async () => {
    const mockRestrictions = [
      {
        id: 'legal-1',
        itemName: '含偽麻黃鹼感冒藥',
        category: 'MEDICATION',
        severity: 'HIGH',
        description: '興P感冒膠囊、伏冒錠等禁止攜帶',
        penalty: '罰款或拘留',
        country: { code: 'JP', name: 'Japan' },
      },
      {
        id: 'legal-2',
        itemName: '肉類製品',
        category: 'FOOD',
        severity: 'MEDIUM',
        description: '肉乾、香腸等禁止',
        penalty: '沒收',
        country: { code: 'JP', name: 'Japan' },
      },
    ];

    prismaMock.legalRestriction.findMany.mockResolvedValue(mockRestrictions);

    const response = await request(app).get('/api/legal/JP');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toHaveProperty('itemName');
    expect(response.body.data[0]).toHaveProperty('severity');
  });

  it('should return empty array for country with no restrictions', async () => {
    prismaMock.legalRestriction.findMany.mockResolvedValue([]);

    const response = await request(app).get('/api/legal/XX');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should handle case-insensitive country code', async () => {
    prismaMock.legalRestriction.findMany.mockResolvedValue([]);

    await request(app).get('/api/legal/jp');

    expect(prismaMock.legalRestriction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { country: { code: 'JP' } },
      })
    );
  });
});