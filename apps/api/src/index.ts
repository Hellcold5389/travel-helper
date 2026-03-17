import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (to be implemented)
app.get('/api/visa/:nationality/:destination', async (req, res) => {
  // TODO: Implement visa lookup
  res.json({
    nationality: req.params.nationality,
    destination: req.params.destination,
    requirement: 'visa-free',
    duration: 90,
    note: 'MVP placeholder - implement database lookup',
  });
});

app.get('/api/legal/:countryCode', async (req, res) => {
  // TODO: Implement legal restrictions lookup
  res.json({
    countryCode: req.params.countryCode,
    restrictions: [],
    note: 'MVP placeholder - implement database lookup',
  });
});

app.get('/api/fun-facts/:countryCode', async (req, res) => {
  // TODO: Implement fun facts lookup
  res.json({
    countryCode: req.params.countryCode,
    facts: [],
    note: 'MVP placeholder - implement database lookup',
  });
});

app.post('/api/trips/plan', async (req, res) => {
  // TODO: Implement AI trip planning
  res.json({
    destination: req.body.destination,
    itinerary: [],
    note: 'MVP placeholder - implement AI planning',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Travel Helper API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});