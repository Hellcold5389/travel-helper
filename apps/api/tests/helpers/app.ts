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

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Countries API
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

  // Visa API
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

  // Legal API
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

  // Fun Facts API
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

  // Draft API
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

  return app;
}

export { prismaMock };