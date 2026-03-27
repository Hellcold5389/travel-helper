import request from 'supertest';
import { createTestApp, prismaMock } from '../helpers/app';

const app = createTestApp();

describe('Flights API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/flights/search', () => {
    it('should return flight information', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .query({ flightNumber: 'JL123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('flightIata', 'JL123');
      expect(response.body.data).toHaveProperty('airline');
      expect(response.body.data).toHaveProperty('departure');
      expect(response.body.data).toHaveProperty('arrival');
    });

    it('should return 400 when flight number is missing', async () => {
      const response = await request(app).get('/api/flights/search');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Flight number required');
    });

    it('should accept date parameter', async () => {
      const response = await request(app)
        .get('/api/flights/search')
        .query({ flightNumber: 'JL123', date: '2026-04-01' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/flights/tracked', () => {
    it('should return user tracked flights', async () => {
      const mockFlights = [
        {
          id: 'flight-1',
          userId: 'user-1',
          flightNumber: 'JL123',
          airline: 'Japan Airlines',
          flightDate: new Date('2026-04-01'),
          departureAirport: 'TPE',
          arrivalAirport: 'NRT',
          status: 'scheduled',
        },
        {
          id: 'flight-2',
          userId: 'user-1',
          flightNumber: 'BR892',
          airline: 'EVA Air',
          flightDate: new Date('2026-04-15'),
          departureAirport: 'NRT',
          arrivalAirport: 'TPE',
          status: 'scheduled',
        },
      ];

      prismaMock.trackedFlight.findMany.mockResolvedValue(mockFlights);

      const response = await request(app)
        .get('/api/flights/tracked')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 401 without telegram ID', async () => {
      const response = await request(app).get('/api/flights/tracked');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Telegram ID required');
    });

    it('should return empty array when no tracked flights', async () => {
      prismaMock.trackedFlight.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/flights/tracked')
        .set('x-telegram-id', '123456789');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/flights/track', () => {
    it('should track a new flight', async () => {
      const mockFlight = {
        id: 'flight-1',
        userId: 'user-1',
        flightNumber: 'JL123',
        airline: 'Japan Airlines',
        flightDate: new Date('2026-04-01'),
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        status: 'scheduled',
      };

      prismaMock.trackedFlight.create.mockResolvedValue(mockFlight);

      const response = await request(app)
        .post('/api/flights/track')
        .set('x-telegram-id', '123456789')
        .send({
          flightNumber: 'JL123',
          flightDate: '2026-04-01',
          airline: 'Japan Airlines',
          departureAirport: 'TPE',
          arrivalAirport: 'NRT',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('flightNumber', 'JL123');
    });

    it('should return 401 without telegram ID', async () => {
      const response = await request(app)
        .post('/api/flights/track')
        .send({ flightNumber: 'JL123', flightDate: '2026-04-01' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Telegram ID required');
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/flights/track')
        .set('x-telegram-id', '123456789')
        .send({ flightNumber: 'JL123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('DELETE /api/flights/track/:flightId', () => {
    it('should untrack a flight', async () => {
      prismaMock.trackedFlight.delete.mockResolvedValue({
        id: 'flight-1',
      });

      const response = await request(app).delete('/api/flights/track/flight-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Flight untracked');
    });
  });
});