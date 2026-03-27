import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prismaMock } from '../__mocks__/prisma';

// Create a test app with all routes
export function createTestApp() {
  const app = express();
  
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // ============================================
  // Health Check
  // ============================================
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ============================================
  // Countries API
  // ============================================
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await prismaMock.country.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          code: true,
          name: true,
          nameZh: true,
          nameZhHant: true,
          capital: true,
          region: true,
          currency: true,
          flagEmoji: true,
        },
      });
      res.json({ success: true, data: countries });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch countries' });
    }
  });

  // ============================================
  // Visa API
  // ============================================
  app.get('/api/visa/:nationality/:destination', async (req, res) => {
    const { nationality, destination } = req.params;

    if (!nationality || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: nationality and destination',
      });
    }

    try {
      const visa = await prismaMock.visaRequirement.findFirst({
        where: {
          nationalityCountry: { code: nationality.toUpperCase() },
          destinationCountry: { code: destination.toUpperCase() },
        },
        include: {
          nationalityCountry: true,
          destinationCountry: true,
        },
      });

      if (!visa) {
        return res.status(404).json({
          success: false,
          error: 'Visa requirement not found for this route',
        });
      }

      res.json({ success: true, data: visa });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch visa requirement' });
    }
  });

  // ============================================
  // Legal API
  // ============================================
  app.get('/api/legal/:countryCode', async (req, res) => {
    const { countryCode } = req.params;

    try {
      const restrictions = await prismaMock.legalRestriction.findMany({
        where: { country: { code: countryCode.toUpperCase() } },
        include: { country: true },
      });

      res.json({ success: true, data: restrictions });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch legal restrictions' });
    }
  });

  // ============================================
  // Fun Facts API
  // ============================================
  app.get('/api/funfacts/:countryCode', async (req, res) => {
    const { countryCode } = req.params;

    try {
      const facts = await prismaMock.funFact.findMany({
        where: { country: { code: countryCode.toUpperCase() } },
        include: { country: true },
      });

      res.json({ success: true, data: facts });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch fun facts' });
    }
  });

  // ============================================
  // Draft API
  // ============================================
  app.post('/api/draft', async (req, res) => {
    const { telegramUserId, telegramName } = req.body;

    if (!telegramUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: telegramUserId',
      });
    }

    try {
      const draft = await prismaMock.tripDraft.create({
        data: {
          telegramUserId,
          step: 'DESTINATION',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      res.json({ success: true, data: draft });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create draft' });
    }
  });

  app.get('/api/draft/:telegramUserId', async (req, res) => {
    const { telegramUserId } = req.params;

    try {
      const draft = await prismaMock.tripDraft.findFirst({
        where: { telegramUserId },
      });

      if (!draft) {
        return res.status(404).json({
          success: false,
          error: 'No active draft found',
        });
      }

      res.json({ success: true, data: draft });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch draft' });
    }
  });

  app.delete('/api/draft/:telegramUserId', async (req, res) => {
    const { telegramUserId } = req.params;

    try {
      await prismaMock.tripDraft.delete({
        where: { telegramUserId },
      });
      res.json({ success: true, message: 'Draft deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete draft' });
    }
  });

  // ============================================
  // Trips API
  // ============================================
  app.get('/api/trips', async (req, res) => {
    try {
      const { userId, limit = '10', offset = '0' } = req.query;

      const where = userId ? { userId: userId as string } : {};

      const trips = await prismaMock.trip.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      });

      const total = await prismaMock.trip.count({ where });

      res.json({
        success: true,
        data: {
          trips,
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch trips' });
    }
  });

  app.get('/api/trips/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const trip = await prismaMock.trip.findUnique({
        where: { id },
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Trip not found',
        });
      }

      res.json({ success: true, data: trip });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch trip' });
    }
  });

  app.delete('/api/trips/:id', async (req, res) => {
    const { id } = req.params;

    try {
      await prismaMock.trip.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      res.json({ success: true, message: 'Trip deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete trip' });
    }
  });

  app.post('/api/trips/save', async (req, res) => {
    const { userId, title, destination, countryCode, days, budget, itineraryText } = req.body;

    if (!userId || !destination || !countryCode || !days) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, destination, countryCode, days',
      });
    }

    try {
      const trip = await prismaMock.trip.create({
        data: {
          userId,
          title: title || `${destination} ${days}天行程`,
          destination,
          countryCode,
          duration: days,
          budgetLevel: budget || 'MEDIUM',
          itineraryText,
          startDate: new Date(),
          endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        },
      });
      res.json({ success: true, data: trip });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to save trip' });
    }
  });

  app.post('/api/trips/:id/share', async (req, res) => {
    const { id } = req.params;

    try {
      const shareId = Math.random().toString(36).substring(2, 15);
      const trip = await prismaMock.trip.update({
        where: { id },
        data: { shareId, isPublic: true },
      });
      res.json({ success: true, data: { shareId } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to share trip' });
    }
  });

  app.get('/api/trips/share/:shareId', async (req, res) => {
    const { shareId } = req.params;

    try {
      const trip = await prismaMock.trip.findFirst({
        where: { shareId },
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: 'Shared trip not found',
        });
      }

      res.json({ success: true, data: trip });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch shared trip' });
    }
  });

  // ============================================
  // User Settings API
  // ============================================
  app.get('/api/user/settings', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const user = await prismaMock.user.findFirst({
        where: { phone: telegramId },
      });

      res.json({
        success: true,
        data: {
          nationality: user?.nationality || null,
          name: user?.name || null,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch user settings' });
    }
  });

  app.post('/api/user/settings', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { nationality } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    if (!nationality) {
      return res.status(400).json({ success: false, error: 'Nationality is required' });
    }

    try {
      const user = await prismaMock.user.update({
        where: { id: 'test-user-id' },
        data: { nationality },
      });
      res.json({ success: true, data: { nationality: user.nationality } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update user settings' });
    }
  });

  // ============================================
  // User Profile API
  // ============================================
  app.get('/api/user/profile', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const user = await prismaMock.user.findFirst({
        where: { phone: telegramId },
      });

      if (!user) {
        return res.json({ success: true, data: null });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          nationality: user.nationality,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
  });

  app.patch('/api/user/profile', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { name, email } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const user = await prismaMock.user.update({
        where: { id: 'test-user-id' },
        data: { name, email },
      });
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  });

  // ============================================
  // User Preferences API
  // ============================================
  app.get('/api/user/preferences', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const preferences = await prismaMock.userPreference.findUnique({
        where: { userId: 'test-user-id' },
      });

      res.json({ success: true, data: preferences || null });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
    }
  });

  app.patch('/api/user/preferences', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { language, currency, notifyVisa, notifyPolicy, notifyTrip } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const preferences = await prismaMock.userPreference.upsert({
        where: { userId: 'test-user-id' },
        create: {
          userId: 'test-user-id',
          language: language || 'zh',
          currency: currency || 'TWD',
          notifyVisa: notifyVisa ?? true,
          notifyPolicy: notifyPolicy ?? true,
          notifyTrip: notifyTrip ?? true,
        },
        update: {
          language,
          currency,
          notifyVisa,
          notifyPolicy,
          notifyTrip,
        },
      });
      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update preferences' });
    }
  });

  // ============================================
  // Passport API
  // ============================================
  app.get('/api/user/passport', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const passport = await prismaMock.passport.findMany({
        where: { userId: 'test-user-id' },
      });

      res.json({ success: true, data: passport });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch passport' });
    }
  });

  app.post('/api/user/passport', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { passportNumber, nationality, expiryDate } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    if (!passportNumber || !nationality || !expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: passportNumber, nationality, expiryDate',
      });
    }

    try {
      const passport = await prismaMock.passport.create({
        data: {
          userId: 'test-user-id',
          passportNumber,
          nationality,
          expiryDate: new Date(expiryDate),
        },
      });
      res.json({ success: true, data: passport });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create passport' });
    }
  });

  app.delete('/api/user/passport', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { passportId } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      await prismaMock.passport.delete({
        where: { id: passportId },
      });
      res.json({ success: true, message: 'Passport deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete passport' });
    }
  });

  // ============================================
  // Flights API
  // ============================================
  app.get('/api/flights/search', async (req, res) => {
    const { flightNumber, date } = req.query;

    if (!flightNumber) {
      return res.status(400).json({ success: false, error: 'Flight number required' });
    }

    // Mock flight data
    res.json({
      success: true,
      data: {
        flightIata: flightNumber,
        airline: 'Test Airlines',
        airlineIata: 'TA',
        status: 'scheduled',
        departure: {
          airport: 'Test Departure Airport',
          iata: 'TPE',
          scheduled: '2026-04-01T10:00:00Z',
        },
        arrival: {
          airport: 'Test Arrival Airport',
          iata: 'NRT',
          scheduled: '2026-04-01T14:00:00Z',
        },
      },
    });
  });

  app.get('/api/flights/tracked', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    try {
      const flights = await prismaMock.trackedFlight.findMany({
        where: { userId: 'test-user-id' },
      });

      res.json({ success: true, data: flights });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch tracked flights' });
    }
  });

  app.post('/api/flights/track', async (req, res) => {
    const telegramId = req.headers['x-telegram-id'] as string;
    const { flightNumber, flightDate, airline, departureAirport, arrivalAirport } = req.body;

    if (!telegramId) {
      return res.status(401).json({ success: false, error: 'Telegram ID required' });
    }

    if (!flightNumber || !flightDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: flightNumber, flightDate',
      });
    }

    try {
      const flight = await prismaMock.trackedFlight.create({
        data: {
          userId: 'test-user-id',
          flightNumber,
          flightDate: new Date(flightDate),
          airline,
          departureAirport,
          arrivalAirport,
          status: 'scheduled',
        },
      });
      res.json({ success: true, data: flight });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to track flight' });
    }
  });

  app.delete('/api/flights/track/:flightId', async (req, res) => {
    const { flightId } = req.params;

    try {
      await prismaMock.trackedFlight.delete({
        where: { id: flightId },
      });
      res.json({ success: true, message: 'Flight untracked' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to untrack flight' });
    }
  });

  return app;
}

export { prismaMock };