import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Country {
  code: string;
  name: string;
  nameZh: string;
  nameZhHant?: string;
  capital?: string;
  region?: string;
  currency?: string;
  flagEmoji?: string;
}

export interface VisaInfo {
  countryCode: string;
  countryName: string;
  countryNameZh?: string;
  flagEmoji?: string;
  nationalityCode: string;
  requirement: string;
  requirementText: string;
  durationDays?: number;
  durationNote?: string;
  documents?: string[];
  conditions?: string[];
  processingTime?: string;
  fee?: number;
  feeCurrency?: string;
  passportValidity?: string;
  notes?: string;
  officialUrl?: string;
  lastUpdated: string;
}

export interface LegalRestriction {
  id: string;
  category: string;
  severity: string;
  severityText: string;
  type: string;
  title: string;
  description: string;
  items?: string[];
  penalty?: string;
  fineMin?: number;
  fineMax?: number;
  fineCurrency?: string;
  imprisonment?: string;
  exceptions?: string[];
  permitRequired?: boolean;
  permitInfo?: string;
  officialUrl?: string;
  lastVerified: string;
}

export interface FunFact {
  id: string;
  category: string;
  categoryName: string;
  title: string;
  content: string;
  imageUrl?: string;
  source?: string;
  sourceUrl?: string;
  priority: number;
  lastUpdated: string;
}

export interface TripDraft {
  id: string;
  telegramUserId: string;
  step: string;
  nationality?: string;
  destination?: string;
  countryCode?: string;
  city?: string;
  days?: number;
  budget?: string;
  travelStyles?: string[];
  specialRequests?: string;
  tripId?: string;
  expiresAt: string;
}

export interface TripPlan {
  destination: string;
  countryCode: string;
  countryName?: string;
  countryNameZh?: string;
  city?: string;
  days: number;
  budget: string;
  travelStyles?: string[];
  itineraryText: string;
  funFacts: Array<{ category: string; content: string }>;
  warnings: Array<{ title: string; description: string }>;
  generatedAt: string;
}

export interface SavedTrip {
  id: string;
  title: string;
  destination: string;
  countryCode: string;
  city?: string;
  duration: number;
  budgetLevel?: string;
  travelStyles?: string[];
  itineraryText?: string;
  status: string;
  shareId?: string;
  isPublic: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ShareInfo {
  shareId: string;
  shareUrl: string;
}

// API Functions
export const countriesApi = {
  list: async (): Promise<Country[]> => {
    const res = await api.get('/api/countries');
    return res.data.data;
  },
};

export const visaApi = {
  get: async (nationality: string, destination: string): Promise<VisaInfo> => {
    const res = await api.get(`/api/visa/${nationality}/${destination}`);
    return res.data.data;
  },
};

export const legalApi = {
  get: async (countryCode: string): Promise<{
    countryCode: string;
    countryName: string;
    countryNameZh?: string;
    flagEmoji?: string;
    restrictions: LegalRestriction[];
    total: number;
  }> => {
    const res = await api.get(`/api/legal/${countryCode}`);
    return res.data.data;
  },
};

export const funFactsApi = {
  get: async (countryCode: string): Promise<{
    countryCode: string;
    countryName: string;
    countryNameZh?: string;
    flagEmoji?: string;
    facts: FunFact[];
    total: number;
  }> => {
    const res = await api.get(`/api/funfacts/${countryCode}`);
    return res.data.data;
  },
};

export const tripApi = {
  createDraft: async (telegramUserId: string, destination?: string, nationality?: string): Promise<TripDraft> => {
    const res = await api.post('/api/draft', { telegramUserId, destination, nationality });
    return res.data.data;
  },
  
  getDraft: async (telegramUserId: string): Promise<TripDraft | null> => {
    try {
      const res = await api.get(`/api/draft/${telegramUserId}`);
      return res.data.data;
    } catch {
      return null;
    }
  },
  
  updateDraft: async (telegramUserId: string, data: Partial<TripDraft>): Promise<TripDraft> => {
    const res = await api.patch(`/api/draft/${telegramUserId}`, data);
    return res.data.data;
  },
  
  deleteDraft: async (telegramUserId: string): Promise<void> => {
    await api.delete(`/api/draft/${telegramUserId}`);
  },
  
  matchDestination: async (destination: string): Promise<{
    countryCode: string;
    city?: string;
    countryName?: string;
    countryNameZh?: string;
  } | null> => {
    try {
      const res = await api.post('/api/draft/match-destination', { destination });
      return res.data.data;
    } catch {
      return null;
    }
  },
  
  plan: async (params: {
    destination: string;
    countryCode: string;
    city?: string;
    days: number;
    budget: string;
    travelStyles?: string[];
    specialRequests?: string;
  }): Promise<TripPlan> => {
    const res = await api.post('/api/trips/plan', params);
    return res.data.data;
  },
  
  save: async (params: {
    userId?: string;
    title?: string;
    destination: string;
    countryCode: string;
    city?: string;
    days: number;
    budgetLevel?: string;
    travelStyles?: string[];
    itineraryText?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SavedTrip> => {
    const res = await api.post('/api/trips/save', params);
    return res.data.data;
  },
  
  list: async (userId?: string, limit = 10, offset = 0): Promise<{
    trips: SavedTrip[];
    total: number;
  }> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    const res = await api.get(`/api/trips?${params.toString()}`);
    return res.data.data;
  },
  
  get: async (id: string): Promise<SavedTrip> => {
    const res = await api.get(`/api/trips/${id}`);
    return res.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/trips/${id}`);
  },
  
  update: async (id: string, data: {
    title?: string;
    destination?: string;
    countryCode?: string;
    city?: string;
    days?: number;
    budgetLevel?: string;
    travelStyles?: string[];
    itineraryText?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<SavedTrip> => {
    const res = await api.patch(`/api/trips/${id}`, data);
    return res.data.data;
  },
  
  regenerate: async (id: string, specialRequests?: string): Promise<{
    itineraryText: string;
    updatedAt: string;
  }> => {
    const res = await api.post(`/api/trips/${id}/regenerate`, { specialRequests });
    return res.data.data;
  },
  
  share: async (id: string): Promise<ShareInfo> => {
    const res = await api.post(`/api/trips/${id}/share`);
    return res.data.data;
  },
  
  getByShareId: async (shareId: string): Promise<SavedTrip> => {
    const res = await api.get(`/api/trips/share/${shareId}`);
    return res.data.data;
  },
};