// API Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';
import type {
  Country,
  VisaRequirement,
  LegalInfo,
  FunFactsInfo,
  Trip,
  UserProfile,
  UserPreferences,
  TripDraft,
  TripPlanResult,
} from './types';

// ============================================
// Countries
// ============================================

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Country[] }>('/api/countries');
      return data.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// ============================================
// Visa
// ============================================

export function useVisa(nationality: string, destination: string) {
  return useQuery({
    queryKey: ['visa', nationality, destination],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: VisaRequirement }>(
        `/api/visa/${nationality}/${destination}`
      );
      return data.data;
    },
    enabled: !!nationality && !!destination,
  });
}

// ============================================
// Legal
// ============================================

export function useLegalInfo(countryCode: string) {
  return useQuery({
    queryKey: ['legal', countryCode],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: LegalInfo }>(
        `/api/legal/${countryCode}`
      );
      return data.data;
    },
    enabled: !!countryCode,
  });
}

// ============================================
// Fun Facts
// ============================================

export function useFunFacts(countryCode: string) {
  return useQuery({
    queryKey: ['funfacts', countryCode],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: FunFactsInfo }>(
        `/api/funfacts/${countryCode}`
      );
      return data.data;
    },
    enabled: !!countryCode,
  });
}

// ============================================
// User Profile
// ============================================

export function useUserProfile(telegramId?: string) {
  return useQuery({
    queryKey: ['user', 'profile', telegramId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: UserProfile }>(
        '/api/user/profile',
        { headers: { 'x-telegram-id': telegramId || '' } }
      );
      return data.data;
    },
    enabled: !!telegramId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      telegramId, 
      ...updates 
    }: { telegramId: string } & Partial<UserProfile>) => {
      const { data } = await apiClient.patch<{ success: boolean; data: UserProfile }>(
        '/api/user/profile',
        updates,
        { headers: { 'x-telegram-id': telegramId } }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile', variables.telegramId] });
    },
  });
}

// ============================================
// User Preferences
// ============================================

export function useUserPreferences(telegramId?: string) {
  return useQuery({
    queryKey: ['user', 'preferences', telegramId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: UserPreferences }>(
        '/api/user/preferences',
        { headers: { 'x-telegram-id': telegramId || '' } }
      );
      return data.data;
    },
    enabled: !!telegramId,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      telegramId, 
      ...updates 
    }: { telegramId: string } & Partial<UserPreferences>) => {
      const { data } = await apiClient.patch<{ success: boolean; data: UserPreferences }>(
        '/api/user/preferences',
        updates,
        { headers: { 'x-telegram-id': telegramId } }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences', variables.telegramId] });
    },
  });
}

// ============================================
// Trips
// ============================================

export function useTrips(userId?: string, limit = 10) {
  return useQuery({
    queryKey: ['trips', userId, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: { trips: Trip[]; total: number } }>(
        `/api/trips?userId=${userId}&limit=${limit}`
      );
      return data.data;
    },
    enabled: !!userId,
  });
}

export function useTrip(tripId?: string) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: Trip }>(
        `/api/trips/${tripId}`
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

// ============================================
// Trip Draft
// ============================================

export function useCreateDraft() {
  return useMutation({
    mutationFn: async (telegramUserId: string) => {
      const { data } = await apiClient.post<{ success: boolean; data: TripDraft }>(
        '/api/draft',
        { telegramUserId }
      );
      return data.data;
    },
  });
}

export function useUpdateDraft() {
  return useMutation({
    mutationFn: async ({ 
      telegramUserId, 
      ...updates 
    }: { telegramUserId: string } & Partial<TripDraft>) => {
      const { data } = await apiClient.patch<{ success: boolean; data: TripDraft }>(
        `/api/draft/${telegramUserId}`,
        updates
      );
      return data.data;
    },
  });
}

export function useGenerateTrip() {
  return useMutation({
    mutationFn: async (telegramUserId: string) => {
      const { data } = await apiClient.post<{ success: boolean; data: TripPlanResult }>(
        '/api/trips/generate-from-draft',
        { telegramUserId }
      );
      return data.data;
    },
  });
}

// ============================================
// Items Checker
// ============================================

export function useCheckItems() {
  return useMutation({
    mutationFn: async ({ countryCode, items }: { countryCode: string; items: string[] }) => {
      const { data } = await apiClient.post<{
        success: boolean;
        data: {
          countryCode: string;
          countryName: string;
          summary: { total: number; prohibited: number; restricted: number; safe: number };
          prohibited: Array<{ item: string; status: string; reason?: string; notes?: string }>;
          restricted: Array<{ item: string; status: string; notes?: string }>;
          safe: Array<{ item: string; status: string }>;
        };
      }>(`/api/legal/${countryCode}/check`, { items });
      return data.data;
    },
  });
}

// ============================================
// Flight Tracking
// ============================================

export function useFlightSearch(flightNumber: string, date?: string) {
  return useQuery({
    queryKey: ['flight', 'search', flightNumber, date],
    queryFn: async () => {
      const params = new URLSearchParams({ flightNumber });
      if (date) params.append('date', date);
      const { data } = await apiClient.get<{ success: boolean; data: FlightSearchResult }>(
        `/api/flights/search?${params}`
      );
      return data.data;
    },
    enabled: !!flightNumber && flightNumber.length >= 2,
  });
}

export function useTrackedFlights(telegramId?: string) {
  return useQuery({
    queryKey: ['flights', 'tracked', telegramId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: { flights: TrackedFlight[]; total: number } }>(
        '/api/flights/tracked',
        { headers: { 'x-telegram-id': telegramId || '' } }
      );
      return data.data;
    },
    enabled: !!telegramId,
  });
}

export function useTrackedFlight(flightId?: string, telegramId?: string) {
  return useQuery({
    queryKey: ['flight', 'tracked', flightId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; data: TrackedFlight & { alerts: FlightAlert[] } }>(
        `/api/flights/track/${flightId}`,
        { headers: { 'x-telegram-id': telegramId || '' } }
      );
      return data.data;
    },
    enabled: !!flightId && !!telegramId,
  });
}

export function useTrackFlight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      telegramId,
      flightNumber,
      flightDate,
    }: { 
      telegramId: string;
      flightNumber: string;
      flightDate?: string;
    }) => {
      const { data } = await apiClient.post<{ success: boolean; data: TrackedFlight }>(
        '/api/flights/track',
        { flightNumber, flightDate },
        { headers: { 'x-telegram-id': telegramId } }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flights', 'tracked', variables.telegramId] });
    },
  });
}

export function useUntrackFlight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      flightId,
      telegramId,
    }: { 
      flightId: string;
      telegramId: string;
    }) => {
      await apiClient.delete(`/api/flights/track/${flightId}`, {
        headers: { 'x-telegram-id': telegramId },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flights', 'tracked', variables.telegramId] });
    },
  });
}

export function useUpdateFlightNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      flightId,
      telegramId,
      ...updates
    }: { 
      flightId: string;
      telegramId: string;
      notifyDelay?: boolean;
      notifyGate?: boolean;
      notifyDeparture?: boolean;
      notifyArrival?: boolean;
    }) => {
      const { data } = await apiClient.patch<{ success: boolean; data: Record<string, boolean> }>(
        `/api/flights/track/${flightId}`,
        updates,
        { headers: { 'x-telegram-id': telegramId } }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flight', 'tracked', variables.flightId] });
    },
  });
}