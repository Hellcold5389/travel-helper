// Mock Prisma Client for testing
const prismaMock = {
  country: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  visaRequirement: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  legalRestriction: {
    findMany: jest.fn(),
  },
  funFact: {
    findMany: jest.fn(),
  },
  tripDraft: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  trip: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userPreference: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  passport: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  policyChange: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  trackedFlight: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  flightAlert: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

export { prismaMock };
export default prismaMock;