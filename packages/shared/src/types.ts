// Core types for Travel Helper

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  nationality?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Trip types
export interface Trip {
  id: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  itinerary: ItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryDay {
  date: Date;
  activities: Activity[];
}

export interface Activity {
  id: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'accommodation' | 'other';
  name: string;
  description?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  startTime?: Date;
  endTime?: Date;
  cost?: number;
  notes?: string;
}

// Visa types
export interface VisaRequirement {
  id: string;
  countryCode: string;
  nationalityCode: string;
  requirement: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required';
  visaType?: string;
  duration?: number; // days allowed
  documents?: string[];
  processingTime?: string;
  fee?: number;
  notes?: string;
  lastUpdated: Date;
}

// Legal restriction types
export interface LegalRestriction {
  id: string;
  countryCode: string;
  category: 'prohibited' | 'restricted' | 'caution';
  type: 'item' | 'behavior' | 'document' | 'currency' | 'other';
  title: string;
  description: string;
  penalty?: string;
  source?: string;
  lastUpdated: Date;
}

// Fun Fact types
export interface FunFact {
  id: string;
  countryCode: string;
  category: 'culture' | 'history' | 'food' | 'nature' | 'other';
  content: string;
  source?: string;
}

// Country info
export interface CountryInfo {
  code: string;
  name: string;
  nameLocal?: string;
  capital?: string;
  currency?: string;
  languages?: string[];
  timezone?: string;
}