// Expo Go compatible key-value storage
// Uses expo-file-system instead of @react-native-async-storage/async-storage
import * as FileSystem from 'expo-file-system';

const STORAGE_DIR = FileSystem.documentDirectory + '.kv/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
}

function keyToPath(key: string): string {
  return STORAGE_DIR + encodeURIComponent(key) + '.txt';
}

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const path = keyToPath(key);
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(path);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await ensureDir();
      await FileSystem.writeAsStringAsync(keyToPath(key), value);
    } catch (error) {
      console.error('Storage.setItem error:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(keyToPath(key), { idempotent: true });
    } catch {}
  },

  async multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map(k => this.removeItem(k)));
  },
};
