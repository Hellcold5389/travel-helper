import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('Trips API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/trips', () => {
    it('should return list of trips', async () => {
      const mockTrips = [
        {
          id: 'trip-1',
          title: '日本東京5天行程',
          destination: 'Tokyo',
          countryCode: 'JP',
          duration: 5,
          budgetLevel: 'MEDIUM',
          status: 'planned',
          startDate: new Date('2026-04-01'),
          endDate: new Date('2026-04-05'),
          createdAt: new Date(),
        },
        {
          id: 'trip-2',
          title: '韓國首爾3天行程',
          destination: 'Seoul',
          countryCode: 'KR',
          duration: 3,
          budgetLevel: 'LOW',
          status: 'planned',
          startDate: new Date('2026-05-01'),
          endDate: new Date('2026-05-03'),
          createdAt: new Date(),
        },
      ];

      prismaMock.trip.findMany.mockResolvedValue(mockTrips);
      prismaMock.trip.count.mockResolvedValue(2);

      const response = await request(app).get('/api/trips');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trips).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter trips by userId', async () => {
      const mockTrips = [
        {
          id: 'trip-1',
          userId: 'user-123',
          title: 'My Trip',
          destination: 'Tokyo',
          countryCode: 'JP',
        },
      ];

      prismaMock.trip.findMany.mockResolvedValue(mockTrips);
      prismaMock.trip.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/trips')
        .query({ userId: 'user-123' });

      expect(response.status).toBe(200);
      expect(prismaMock.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
        })
      );
    });

    it('should support pagination', async () => {
      prismaMock.trip.findMany.mockResolvedValue([]);
      prismaMock.trip.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/trips')
        .query({ limit: '5', offset: '10' });

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.offset).toBe(10);
    });
  });

  describe('GET /api/trips/:id', () => {
    it('should return a single trip', async () => {
      const mockTrip = {
        id: 'trip-1',
        title: '日本東京5天行程',
        destination: 'Tokyo',
        countryCode: 'JP',
        duration: 5,
        budgetLevel: 'MEDIUM',
        itineraryText: 'Day 1: 抵達東京...',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-05'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.trip.findUnique.mockResolvedValue(mockTrip);

      const response = await request(app).get('/api/trips/trip-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', '日本東京5天行程');
    });

    it('should return 404 for non-existent trip', async () => {
      prismaMock.trip.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/trips/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Trip not found');
    });
  });

  describe('DELETE /api/trips/:id', () => {
    it('should soft delete a trip', async () => {
      prismaMock.trip.update.mockResolvedValue({
        id: 'trip-1',
        deletedAt: new Date(),
      });

      const response = await request(app).delete('/api/trips/trip-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prismaMock.trip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { deletedAt: expect.any(Date) },
        })
      );
    });
  });

  describe('POST /api/trips/save', () => {
    it('should save a new trip', async () => {
      const mockTrip = {
        id: 'trip-new',
        userId: 'user-123',
        title: '日本 5天行程',
        destination: 'Japan',
        countryCode: 'JP',
        duration: 5,
        budgetLevel: 'MEDIUM',
        itineraryText: 'Day 1: ...',
      };

      prismaMock.trip.create.mockResolvedValue(mockTrip);

      const response = await request(app)
        .post('/api/trips/save')
        .send({
          userId: 'user-123',
          destination: 'Japan',
          countryCode: 'JP',
          days: 5,
          budget: 'MEDIUM',
          itineraryText: 'Day 1: ...',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'trip-new');
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/trips/save')
        .send({ userId: 'user-123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('POST /api/trips/:id/share', () => {
    it('should generate share link for trip', async () => {
      prismaMock.trip.update.mockResolvedValue({
        id: 'trip-1',
        shareId: 'abc123xyz',
        isPublic: true,
      });

      const response = await request(app).post('/api/trips/trip-1/share');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shareId');
    });
  });

  describe('GET /api/trips/share/:shareId', () => {
    it('should return shared trip', async () => {
      const mockTrip = {
        id: 'trip-1',
        title: 'Shared Trip',
        shareId: 'abc123xyz',
        isPublic: true,
        itineraryText: 'Day 1: ...',
      };

      prismaMock.trip.findFirst.mockResolvedValue(mockTrip);

      const response = await request(app).get('/api/trips/share/abc123xyz');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'Shared Trip');
    });

    it('should return 404 for invalid share ID', async () => {
      prismaMock.trip.findFirst.mockResolvedValue(null);

      const response = await request(app).get('/api/trips/share/invalid');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Shared trip not found');
    });
  });
});