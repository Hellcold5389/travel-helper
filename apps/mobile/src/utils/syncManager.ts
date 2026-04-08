import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { offlineStorage } from './offlineStorage';
import { apiClient } from '../api/client';

// ============================================
// Types
// ============================================
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'trip' | 'draft' | 'settings';
  data: any;
  timestamp: number;
  retries: number;
}

type SyncStatus = 'idle' | 'syncing' | 'error';

// ============================================
// Sync Manager
// ============================================
class SyncManager {
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private maxRetries: number = 3;

  constructor() {
    this.init();
  }

  private async init() {
    // Load pending sync queue
    this.syncQueue = await offlineStorage.getSyncQueue();

    // Check initial network state and poll for changes
    await this.checkAndUpdateNetwork();
    setInterval(() => this.checkAndUpdateNetwork(), 10000);
  }

  private async checkAndUpdateNetwork() {
    try {
      const state = await Network.getNetworkStateAsync();
      const nowOnline = state.isConnected ?? false;
      const wasOffline = !this.isOnline;
      this.isOnline = nowOnline;

      // Just came back online
      if (wasOffline && nowOnline && this.syncQueue.length > 0) {
        console.log('[Sync] Back online, starting sync...');
        this.sync();
      }
    } catch {
      // ignore
    }
  }

  // ============================================
  // Public API
  // ============================================

  // Add operation to sync queue
  async addToQueue(
    type: SyncOperation['type'],
    entity: SyncOperation['entity'],
    data: any
  ): Promise<void> {
    const operation: SyncOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    
    this.syncQueue.push(operation);
    await this.saveQueue();
    
    // If online, try to sync immediately
    if (this.isOnline) {
      this.sync();
    }
  }

  // Get current sync status
  getStatus(): SyncStatus {
    if (this.isSyncing) return 'syncing';
    if (this.syncQueue.length > 0) return 'error';
    return 'idle';
  }

  // Subscribe to status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  // Force sync
  async syncNow(): Promise<void> {
    if (this.isOnline) {
      await this.sync();
    }
  }

  // Get pending count
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  // ============================================
  // Private Methods
  // ============================================

  private async sync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;
    
    this.isSyncing = true;
    this.notifyListeners('syncing');
    
    const toSync = [...this.syncQueue];
    
    for (const op of toSync) {
      try {
        await this.processOperation(op);
        // Success - remove from queue
        this.syncQueue = this.syncQueue.filter(item => item.id !== op.id);
        await this.saveQueue();
      } catch (error) {
        console.error(`[Sync] Failed to sync ${op.id}:`, error);
        
        // Increment retry count
        const index = this.syncQueue.findIndex(item => item.id === op.id);
        if (index !== -1) {
          this.syncQueue[index].retries++;
          
          // Remove if max retries reached
          if (this.syncQueue[index].retries >= this.maxRetries) {
            console.warn(`[Sync] Max retries reached for ${op.id}, removing from queue`);
            this.syncQueue.splice(index, 1);
            await this.saveQueue();
          }
        }
      }
    }
    
    this.isSyncing = false;
    this.notifyListeners(this.syncQueue.length > 0 ? 'error' : 'idle');
    
    // Update last sync time
    await offlineStorage.setLastSync();
  }

  private async processOperation(op: SyncOperation): Promise<void> {
    switch (op.entity) {
      case 'trip':
        await this.processTripOperation(op);
        break;
      case 'draft':
        await this.processDraftOperation(op);
        break;
      case 'settings':
        await this.processSettingsOperation(op);
        break;
    }
  }

  private async processTripOperation(op: SyncOperation): Promise<void> {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    switch (op.type) {
      case 'create':
        await apiClient.createTrip(token, op.data);
        break;
      case 'update':
        await apiClient.updateTrip(token, op.data.id, op.data);
        break;
      case 'delete':
        await apiClient.deleteTrip(token, op.data.id);
        break;
    }
  }

  private async processDraftOperation(op: SyncOperation): Promise<void> {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    // Sync draft to server
    const response = await fetch('http://192.168.0.26:3001/api/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(op.data),
    });
    
    if (!response.ok) throw new Error('Failed to sync draft');
  }

  private async processSettingsOperation(op: SyncOperation): Promise<void> {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    await apiClient.updateSettings(token, op.data);
  }

  private async saveQueue(): Promise<void> {
    await offlineStorage.save('sync_queue', this.syncQueue);
  }

  private notifyListeners(status: SyncStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }
}

export const syncManager = new SyncManager();
