// Shared constants

// Supported countries for MVP
export const SUPPORTED_DESTINATIONS = [
  'JP', // Japan
  'KR', // South Korea
  'TH', // Thailand
  'VN', // Vietnam
  'SG', // Singapore
  'MY', // Malaysia
  'HK', // Hong Kong
  'TW', // Taiwan
  'US', // United States
  'AU', // Australia
  'GB', // United Kingdom
  'FR', // France
  'DE', // Germany
  'IT', // Italy
  'ES', // Spain
] as const;

// Visa requirement types
export const VISA_TYPES = {
  VISA_FREE: 'visa-free',
  VISA_ON_ARRIVAL: 'visa-on-arrival',
  E_VISA: 'e-visa',
  VISA_REQUIRED: 'visa-required',
} as const;

// Category colors for UI
export const CATEGORY_COLORS = {
  prohibited: '#EF4444', // red
  restricted: '#F59E0B', // amber
  caution: '#3B82F6', // blue
} as const;

// API endpoints
export const API_ENDPOINTS = {
  TRIPS: '/api/trips',
  VISA: '/api/visa',
  LEGAL: '/api/legal',
  FUN_FACTS: '/api/fun-facts',
  AUTH: '/api/auth',
} as const;