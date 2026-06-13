// src/store/useHistoryStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useHistoryStore = create(
  persist(
    (set) => ({
      sessions: [],
      filter:   'ALL',

      addSession: (session) =>
        set((s) => ({
          sessions: [session, ...s.sessions].slice(0, 50), // cap at 50
        })),

      setFilter: (filter) => set({ filter }),

      clearHistory: () => set({ sessions: [] }),
    }),
    { name: 'stratum-history' }
  )
);
