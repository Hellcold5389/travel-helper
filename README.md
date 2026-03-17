# Travel Helper

AI-powered travel assistant with legal information, visa requirements, and trip planning.

## Features

- ✈️ **AI Trip Planning** - Generate personalized itineraries
- 📋 **Visa Requirements** - Check visa needs for your destination
- ⚖️ **Legal & Restrictions** - Know what you can/cannot bring
- 🎯 **Fun Facts** - Learn interesting things about your destination

## Tech Stack

- **Mobile**: React Native + Expo
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Prisma ORM)
- **AI**: OpenAI GPT-4o
- **Infra**: Vercel + Supabase

## Project Structure

```
travel-helper/
├── apps/
│   ├── mobile/     # React Native app (Expo)
│   └── api/        # Node.js API server
├── packages/
│   └── shared/     # Shared types and utilities
├── docs/           # Documentation
├── memory/         # Agent memory files
└── PROJECT_STATUS.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (or Supabase account)

### Installation

```bash
# Install dependencies
pnpm install

# Setup database
cd apps/api
cp .env.example .env
# Edit .env with your database URL
pnpm db:generate
pnpm db:push

# Start development servers
pnpm dev
```

### Development

```bash
# Start API server
pnpm dev:api

# Start mobile app
pnpm dev:mobile
```

## Documentation

- [Competitor Analysis](./competitor_analysis.md)
- [MVP Definition](./mvp_definition.md)
- [Tech Stack](./tech_stack.md)

## License

MIT