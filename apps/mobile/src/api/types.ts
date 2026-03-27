// API Types

export interface Country {
  code: string;
  name: string;
  nameZh: string | null;
  nameZhHant: string | null;
  capital: string | null;
  region: string | null;
  currency: string | null;
  flagEmoji: string | null;
}

export interface VisaRequirement {
  countryCode: string;
  countryName: string;
  countryNameZh: string | null;
  flagEmoji: string | null;
  nationalityCode: string;
  requirement: string;
  requirementText: string;
  durationDays: number | null;
  durationNote: string | null;
  documents: string[] | null;
  conditions: string[] | null;
  processingTime: string | null;
  fee: number | null;
  feeCurrency: string | null;
  passportValidity: string | null;
  notes: string | null;
  officialUrl: string | null;
  lastUpdated: string | null;
}

export interface LegalRestriction {
  id: string;
  category: string;
  severity: string;
  severityText: string;
  title: string;
  description: string;
  items: string[] | null;
  penalty: string | null;
  fineMin: number | null;
  fineMax: number | null;
  fineCurrency: string | null;
  imprisonment: string | null;
  exceptions: string | null;
  permitRequired: boolean;
  permitInfo: string | null;
  officialUrl: string | null;
  lastVerified: string | null;
}

export interface LegalInfo {
  countryCode: string;
  countryName: string;
  countryNameZh: string | null;
  flagEmoji: string | null;
  restrictions: LegalRestriction[];
  total: number;
  lastUpdated: string | null;
}

export interface FunFact {
  id: string;
  category: string;
  categoryName: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  source: string | null;
  lastUpdated: string;
}

export interface FunFactsInfo {
  countryCode: string;
  countryName: string;
  countryNameZh: string | null;
  flagEmoji: string | null;
  facts: FunFact[];
  total: number;
  lastUpdated: string | null;
}

export interface Trip {
  id: string;
  title: string | null;
  destination: string;
  countryCode: string;
  city: string | null;
  duration: number | null;
  budgetLevel: string | null;
  status: string;
  startDate: string;
  endDate: string;
  shareId: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string | null;
  visaExpiry: boolean;
  policyChanges: boolean;
  tripReminders: boolean;
  emailNotif: boolean;
  pushNotif: boolean;
}

export interface UserProfile {
  isNewUser: boolean;
  id?: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  nationalityName: string | null;
  avatar: string | null;
  passport?: {
    passportNo: string;
    fullName: string;
    expiryDate: string;
    issuingCountry: string;
  } | null;
  preferences?: UserPreferences | null;
  tripCount: number;
  createdAt?: string;
}

export interface TripDraft {
  id: string;
  telegramUserId: string;
  step: string;
  nationality: string | null;
  destination: string | null;
  countryCode: string | null;
  city: string | null;
  days: number | null;
  budget: string | null;
  travelStyles: string[] | null;
  specialRequests: string | null;
  tripId: string | null;
  expiresAt: string;
}

export interface TripPlanResult {
  destination: string;
  countryCode: string;
  countryName: string | null;
  countryNameZh: string | null;
  city: string | null;
  days: number;
  budget: string;
  travelStyles: string[] | null;
  itineraryText: string;
  funFacts: Array<{
    category: string;
    content: string;
  }>;
  warnings: Array<{
    title: string;
    description: string;
  }>;
  generatedAt: string;
}

// ============================================
// Flight Types
// ============================================

export interface FlightSearchResult {
  flightIata: string;
  airline: string | null;
  airlineIata: string | null;
  status: string;
  departure: {
    airport: string | null;
    iata: string | null;
    timezone: string | null;
    scheduled: string | null;
    estimated: string | null;
    actual: string | null;
    gate: string | null;
    terminal: string | null;
  };
  arrival: {
    airport: string | null;
    iata: string | null;
    timezone: string | null;
    scheduled: string | null;
    estimated: string | null;
    actual: string | null;
    gate: string | null;
    terminal: string | null;
  };
  aircraft?: {
    registration: string | null;
    model: string | null;
  } | null;
}

export interface TrackedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  status: string;
  departureTime: string | null;
  arrivalTime: string | null;
  departureGate: string | null;
  arrivalGate: string | null;
  departureTerminal: string | null;
  arrivalTerminal: string | null;
  delayMinutes: number | null;
  lastSynced: string | null;
  notifyDelay: boolean;
  notifyGate: boolean;
  notifyDeparture: boolean;
  notifyArrival: boolean;
  unreadAlerts?: number;
}

export interface FlightAlert {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}