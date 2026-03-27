import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('User Settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/settings', () => {
    it('should return user settings', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        nationality: 'TW',
        phone: '123456789',
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user/settings')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('nationality', 'TW');
    });

    it('should return 401 without telegram ID', async () => {
      const response = await request(app).get('/api/user/settings');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Telegram ID required');
    });

    it('should return null nationality for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/settings')
        .set('x-telegram-id', '999999999');

      expect(response.status).toBe(200);
      expect(response.body.data.nationality).toBeNull();
    });
  });

  describe('POST /api/user/settings', () => {
    it('should update user nationality', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'user-1',
        nationality: 'JP',
        name: 'Test User',
      });

      const response = await request(app)
        .post('/api/user/settings')
        .set('x-telegram-id', '123456789')
        .send({ nationality: 'JP' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('nationality', 'JP');
    });

    it('should return 400 when nationality is missing', async () => {
      const response = await request(app)
        .post('/api/user/settings')
        .set('x-telegram-id', '123456789')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nationality is required');
    });
  });
});

describe('User Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        nationality: 'TW',
        phone: '123456789',
        createdAt: new Date(),
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/user/profile')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'Test User');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should return null for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/profile')
        .set('x-telegram-id', '999999999');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('should update user profile', async () => {
      prismaMock.user.update.mockResolvedValue({
        id: 'user-1',
        name: 'New Name',
        email: 'newemail@example.com',
      });

      const response = await request(app)
        .patch('/api/user/profile')
        .set('x-telegram-id', '123456789')
        .send({ name: 'New Name', email: 'newemail@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'New Name');
    });
  });
});

describe('User Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/preferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        userId: 'user-1',
        language: 'zh',
        currency: 'TWD',
        notifyVisa: true,
        notifyPolicy: true,
        notifyTrip: true,
      };

      prismaMock.userPreference.findUnique.mockResolvedValue(mockPreferences);

      const response = await request(app)
        .get('/api/user/preferences')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('language', 'zh');
      expect(response.body.data).toHaveProperty('currency', 'TWD');
    });

    it('should return null for non-existent preferences', async () => {
      prismaMock.userPreference.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/preferences')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('PATCH /api/user/preferences', () => {
    it('should update user preferences', async () => {
      const mockPreferences = {
        userId: 'user-1',
        language: 'en',
        currency: 'USD',
        notifyVisa: false,
        notifyPolicy: true,
        notifyTrip: true,
      };

      prismaMock.userPreference.upsert.mockResolvedValue(mockPreferences);

      const response = await request(app)
        .patch('/api/user/preferences')
        .set('x-telegram-id', '123456789')
        .send({ language: 'en', currency: 'USD', notifyVisa: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('language', 'en');
      expect(response.body.data).toHaveProperty('currency', 'USD');
    });
  });
});

describe('Passport API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/passport', () => {
    it('should return user passports', async () => {
      const mockPassports = [
        {
          id: 'passport-1',
          userId: 'user-1',
          passportNumber: 'A123456789',
          nationality: 'TW',
          expiryDate: new Date('2030-01-01'),
        },
      ];

      prismaMock.passport.findMany.mockResolvedValue(mockPassports);

      const response = await request(app)
        .get('/api/user/passport')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/user/passport', () => {
    it('should add a new passport', async () => {
      const mockPassport = {
        id: 'passport-1',
        userId: 'user-1',
        passportNumber: 'A123456789',
        nationality: 'TW',
        expiryDate: new Date('2030-01-01'),
      };

      prismaMock.passport.create.mockResolvedValue(mockPassport);

      const response = await request(app)
        .post('/api/user/passport')
        .set('x-telegram-id', '123456789')
        .send({
          passportNumber: 'A123456789',
          nationality: 'TW',
          expiryDate: '2030-01-01',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('passportNumber', 'A123456789');
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/user/passport')
        .set('x-telegram-id', '123456789')
        .send({ passportNumber: 'A123456789' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('DELETE /api/user/passport', () => {
    it('should delete a passport', async () => {
      prismaMock.passport.delete.mockResolvedValue({
        id: 'passport-1',
      });

      const response = await request(app)
        .delete('/api/user/passport')
        .set('x-telegram-id', '123456789')
        .send({ passportId: 'passport-1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});