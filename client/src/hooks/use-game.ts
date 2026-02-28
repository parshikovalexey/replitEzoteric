import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Goals
export function useGoals() {
  return useQuery({
    queryKey: [api.goals.get.path],
    queryFn: async () => {
      const res = await fetch(api.goals.get.path);
      if (!res.ok) throw new Error("Failed to fetch goals");
      return api.goals.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: string; status?: string }) => {
      const res = await fetch(api.goals.create.path, {
        method: api.goals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return api.goals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.goals.get.path] }),
  });
}

// Sessions
export function useSessions() {
  return useQuery({
    queryKey: [api.sessions.list.path],
    queryFn: async () => {
      const res = await fetch(api.sessions.list.path);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return api.sessions.list.responses[200].parse(await res.json());
    },
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: [api.sessions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.sessions.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch session");
      return api.sessions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status?: string; notes?: string; startTime?: string }) => {
      const url = buildUrl(api.sessions.update.path, { id });
      const res = await fetch(url, {
        method: api.sessions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update session");
      return api.sessions.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.sessions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.sessions.get.path, variables.id] });
    },
  });
}

// Decks
export function useDecks() {
  return useQuery({
    queryKey: [api.decks.list.path],
    queryFn: async () => {
      const res = await fetch(api.decks.list.path);
      if (!res.ok) throw new Error("Failed to fetch decks");
      return api.decks.list.responses[200].parse(await res.json());
    },
  });
}

export function useDeck(id: number) {
  return useQuery({
    queryKey: [api.decks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.decks.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch deck");
      return api.decks.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Cards
export function useCardsByDeck(deckId: number) {
  return useQuery({
    queryKey: [api.cards.listByDeck.path, deckId],
    queryFn: async () => {
      const url = buildUrl(api.cards.listByDeck.path, { deckId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch cards");
      return api.cards.listByDeck.responses[200].parse(await res.json());
    },
    enabled: !!deckId,
  });
}

// Notes
export function useNotesBySession(sessionId: number) {
  return useQuery({
    queryKey: [api.notes.listBySession.path, sessionId],
    queryFn: async () => {
      const url = buildUrl(api.notes.listBySession.path, { sessionId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return api.notes.listBySession.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { sessionId: number; cardId: number; content: string; parentId?: number | null }) => {
      const res = await fetch(api.notes.save.path, {
        method: api.notes.save.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save note");
      return api.notes.save.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.notes.listBySession.path, variables.sessionId] });
    },
  });
}

  export function useAllCards() {
    return useQuery({
      queryKey: ["/api/cards"],
      queryFn: async () => {
        const res = await fetch("/api/cards");
        if (!res.ok) throw new Error("Failed to fetch cards");
        return await res.json();
      },
    });
  }

  export function useAllNotes() {
    return useQuery({
      queryKey: ["/api/notes"],
      queryFn: async () => {
        const res = await fetch("/api/notes");
        if (!res.ok) throw new Error("Failed to fetch notes");
        return await res.json();
      },
    });
  }
  