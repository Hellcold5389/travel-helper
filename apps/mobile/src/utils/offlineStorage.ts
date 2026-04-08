import * as Network from 'expo-network';
import { Storage } from './storage';

// ============================================
// Storage Keys
// ============================================
const KEYS = {
  TRIPS: 'offline_trips',
  DRAFT: 'offline_draft',
  COUNTRIES: 'offline_countries',
  VISA_INFO: 'offline_visa',
  LEGAL_INFO: 'offline_legal',
  FUNFACTS: 'offline_funfacts',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
};

// ============================================
// Offline Storage Class
// ============================================
class OfflineStorage {
  // Check if online
  async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected ?? false;
    } catch {
      return true;
    }
  }

  // Save data
  async save<T>(key: string, data: T): Promise<void> {
    try {
      await Storage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }

  // Load data
  async load<T>(key: string): Promise<T | null> {
    try {
      const data = await Storage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return null;
    }
  }

  // Remove data
  async remove(key: string): Promise<void> {
    try {
      await Storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  // ============================================
  // Trips
  // ============================================
  async saveTrips(trips: any[]): Promise<void> {
    await this.save(KEYS.TRIPS, trips);
  }

  async getTrips(): Promise<any[]> {
    return (await this.load<any[]>(KEYS.TRIPS)) || [];
  }

  async addTrip(trip: any): Promise<void> {
    const trips = await this.getTrips();
    trips.unshift(trip);
    await this.saveTrips(trips);
  }

  async updateTrip(tripId: string, updates: any): Promise<void> {
    const trips = await this.getTrips();
    const index = trips.findIndex(t => t.id === tripId);
    if (index !== -1) {
      trips[index] = { ...trips[index], ...updates };
      await this.saveTrips(trips);
    }
  }

  async deleteTrip(tripId: string): Promise<void> {
    const trips = await this.getTrips();
    const filtered = trips.filter(t => t.id !== tripId);
    await this.saveTrips(filtered);
  }

  // ============================================
  // Draft
  // ============================================
  async saveDraft(draft: any): Promise<void> {
    await this.save(KEYS.DRAFT, draft);
  }

  async getDraft(): Promise<any | null> {
    return this.load(KEYS.DRAFT);
  }

  async clearDraft(): Promise<void> {
    await this.remove(KEYS.DRAFT);
  }

  // ============================================
  // Cached Data
  // ============================================
  async cacheCountries(countries: any[]): Promise<void> {
    await this.save(KEYS.COUNTRIES, {
      data: countries,
      timestamp: Date.now(),
    });
  }

  async getCountries(): Promise<any[] | null> {
    const cached = await this.load<{ data: any[]; timestamp: number }>(KEYS.COUNTRIES);
    if (!cached) return null;
    
    // Cache valid for 24 hours
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return cached.data;
  }

  async cacheVisaInfo(nationality: string, destination: string, data: any): Promise<void> {
    const key = `${KEYS.VISA_INFO}_${nationality}_${destination}`;
    await this.save(key, { data, timestamp: Date.now() });
  }

  async getVisaInfo(nationality: string, destination: string): Promise<any | null> {
    const key = `${KEYS.VISA_INFO}_${nationality}_${destination}`;
    const cached = await this.load<{ data: any; timestamp: number }>(key);
    if (!cached) return null;
    
    // Cache valid for 7 days
    if (Date.now() - cached.timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return cached.data;
  }

  async cacheLegalInfo(countryCode: string, data: any): Promise<void> {
    const key = `${KEYS.LEGAL_INFO}_${countryCode}`;
    await this.save(key, { data, timestamp: Date.now() });
  }

  async getLegalInfo(countryCode: string): Promise<any | null> {
    const key = `${KEYS.LEGAL_INFO}_${countryCode}`;
    const cached = await this.load<{ data: any; timestamp: number }>(key);
    if (!cached) return null;
    
    // Cache valid for 7 days
    if (Date.now() - cached.timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return cached.data;
  }

  // ============================================
  // Sync Queue (for offline operations)
  // ============================================
  async addToSyncQueue(operation: {
    type: 'create' | 'update' | 'delete';
    entity: 'trip' | 'draft';
    data: any;
  }): Promise<void> {
    const queue = (await this.load<any[]>(KEYS.SYNC_QUEUE)) || [];
    queue.push({ ...operation, id: Date.now().toString() });
    await this.save(KEYS.SYNC_QUEUE, queue);
  }

  async getSyncQueue(): Promise<any[]> {
    return (await this.load<any[]>(KEYS.SYNC_QUEUE)) || [];
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.save(KEYS.SYNC_QUEUE, filtered);
  }

  async clearSyncQueue(): Promise<void> {
    await this.remove(KEYS.SYNC_QUEUE);
  }

  // ============================================
  // Last Sync Time
  // ============================================
  async setLastSync(): Promise<void> {
    await this.save(KEYS.LAST_SYNC, Date.now());
  }

  async getLastSync(): Promise<number | null> {
    return this.load<number>(KEYS.LAST_SYNC);
  }

  // ============================================
  // Clear All
  // ============================================
  async clearAll(): Promise<void> {
    await Storage.multiRemove(Object.values(KEYS));
  }
}

export const offlineStorage = new OfflineStorage();
