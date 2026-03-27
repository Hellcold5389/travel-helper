import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('POST /api/draft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new draft', async () => {
    const mockDraft = {
      id: 'draft-1',
      telegramUserId: '123456789',
      step: 'DESTINATION',
      destination: null,
      days: null,
      budget: null,
      styles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.tripDraft.create.mockResolvedValue(mockDraft);

    const response = await request(app)
      .post('/api/draft')
      .send({ telegramUserId: '123456789', telegramName: 'Test User' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('step', 'DESTINATION');
  });

  it('should return 400 when telegramUserId is missing', async () => {
    const response = await request(app)
      .post('/api/draft')
      .send({ telegramName: 'Test User' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Missing required field: telegramUserId');
  });
});

describe('GET /api/draft/:telegramUserId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return existing draft', async () => {
    const mockDraft = {
      id: 'draft-1',
      telegramUserId: '123456789',
      step: 'DAYS',
      destination: 'JP',
      days: null,
      budget: null,
      styles: [],
    };

    prismaMock.tripDraft.findFirst.mockResolvedValue(mockDraft);

    const response = await request(app).get('/api/draft/123456789');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('step', 'DAYS');
    expect(response.body.data).toHaveProperty('destination', 'JP');
  });

  it('should return 404 when no draft found', async () => {
    prismaMock.tripDraft.findFirst.mockResolvedValue(null);

    const response = await request(app).get('/api/draft/999999999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('No active draft found');
  });
});