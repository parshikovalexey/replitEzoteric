import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gameDB } from "../lib/db";

// Determine if we're using local IndexedDB (static mode)
const USE_LOCAL_DB = import.meta.env.VITE_STATIC_MODE === 'true' || import.meta.env.DEV;

console.log('[use-game] USE_LOCAL_DB:', USE_LOCAL_DB, 'VITE_STATIC_MODE:', import.meta.env.VITE_STATIC_MODE, 'DEV:', import.meta.env.DEV);

// Goals
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getGoals();
      }
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: string; question?: string; status?: string }) => {
      if (USE_LOCAL_DB) {
        return gameDB.createGoal({ ...data, question: data.question || '', status: data.status || 'pending' });
      }
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useClearAllData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.clearAllData();
      }
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error("Failed to reset game");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

// Sessions
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getSessions();
      }
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getSession(id);
      }
      const res = await fetch(`/api/sessions/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string; notes?: string; startTime?: string }) => {
      if (USE_LOCAL_DB) {
        return gameDB.updateSession(id, data);
      }
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update session");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', variables.id] });
    },
  });
}

// Decks
export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getDecks();
      }
      const res = await fetch('/api/decks');
      if (!res.ok) throw new Error("Failed to fetch decks");
      return res.json();
    },
  });
}

export function useDeck(id: number) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getDeck(id);
      }
      const res = await fetch(`/api/decks/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch deck");
      return res.json();
    },
    enabled: !!id,
  });
}

// Cards
export function useCardsByDeck(deckId: number) {
  return useQuery({
    queryKey: ['cards', deckId],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getCardsByDeck(deckId);
      }
      const res = await fetch(`/api/cards?deckId=${deckId}`);
      if (!res.ok) throw new Error("Failed to fetch cards");
      return res.json();
    },
    enabled: !!deckId,
  });
}

// Notes
export function useNotesBySession(sessionId: number) {
  return useQuery({
    queryKey: ['notes', sessionId],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getNotesBySession(sessionId);
      }
      const res = await fetch(`/api/notes?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!sessionId,
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sessionId: number; cardId: number; content: string; parentId?: number | null; slotIndex?: number | null }) => {
      if (USE_LOCAL_DB) {
        return gameDB.createNote({
          sessionId: data.sessionId,
          cardId: data.cardId,
          content: data.content,
          parentId: data.parentId ?? null,
          slotIndex: data.slotIndex ?? null,
        });
      }
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save note");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.sessionId] });
    },
  });
}

export function useAllCards() {
  return useQuery({
    queryKey: ['allCards'],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getAllCards();
      }
      const res = await fetch('/api/cards');
      if (!res.ok) throw new Error("Failed to fetch cards");
      return res.json();
    },
  });
}

export function useAllNotes() {
  return useQuery({
    queryKey: ['allNotes'],
    queryFn: async () => {
      if (USE_LOCAL_DB) {
        return gameDB.getAllNotes();
      }
      const res = await fetch('/api/notes');
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
  });
}