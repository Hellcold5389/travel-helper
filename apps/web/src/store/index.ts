import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  userId: string | null;
  nationality: string | null;
  setUserId: (id: string) => void;
  setNationality: (nationality: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      nationality: null,
      setUserId: (id) => set({ userId: id }),
      setNationality: (nationality) => set({ nationality }),
      clearUser: () => set({ userId: null, nationality: null }),
    }),
    {
      name: 'travel-helper-user',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Generate a random user ID for web users (not logged in)
export const getOrCreateUserId = (): string => {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem('travel-helper-web-user-id');
  if (stored) return stored;
  
  const newId = 'web_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('travel-helper-web-user-id', newId);
  return newId;
};