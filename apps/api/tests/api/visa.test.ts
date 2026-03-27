import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('GET /api/visa/:nationality/:destination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return visa requirement for valid route', async () => {
    const mockVisa = {
      id: 'visa-1',
      requirement: 'VISA_FREE',
      durationDays: 90,
      durationNote: '90 days per visit',
      documents: [],
      conditions: {},
      processingTime: null,
      fee: null,
      feeCurrency: null,
      passportValidity: '6 months',
      notes: 'Return ticket required',
      officialUrl: 'https://example.com',
      updatedAt: new Date(),
      nationalityCountry: { code: 'TW', name: 'Taiwan' },
      destinationCountry: { code: 'JP', name: 'Japan' },
    };

    prismaMock.visaRequirement.findFirst.mockResolvedValue(mockVisa);

    const response = await request(app).get('/api/visa/TW/JP');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('requirement', 'VISA_FREE');
    expect(response.body.data).toHaveProperty('durationDays', 90);
  });

  it('should return 404 for non-existent route', async () => {
    prismaMock.visaRequirement.findFirst.mockResolvedValue(null);

    const response = await request(app).get('/api/visa/XX/YY');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Visa requirement not found for this route');
  });

  it('should handle case-insensitive country codes', async () => {
    const mockVisa = {
      id: 'visa-1',
      requirement: 'VISA_REQUIRED',
      nationalityCountry: { code: 'TW', name: 'Taiwan' },
      destinationCountry: { code: 'US', name: 'United States' },
    };

    prismaMock.visaRequirement.findFirst.mockResolvedValue(mockVisa);

    const response = await request(app).get('/api/visa/tw/us');

    expect(response.status).toBe(200);
    expect(prismaMock.visaRequirement.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nationalityCountry: { code: 'TW' },
          destinationCountry: { code: 'US' },
        }),
      })
    );
  });

  it('should return 404 for empty nationality parameter', async () => {
    // Express treats empty parameter as missing route
    const response = await request(app).get('/api/visa//JP');

    expect(response.status).toBe(404);
  });

  it('should handle database error', async () => {
    prismaMock.visaRequirement.findFirst.mockRejectedValue(new Error('Database error'));

    const response = await request(app).get('/api/visa/TW/JP');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});