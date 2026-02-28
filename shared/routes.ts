import { z } from 'zod';
import { 
  insertGoalSchema, gameGoals,
  insertSessionSchema, sessions,
  insertDeckSchema, decks,
  insertCardSchema, cards,
  insertCardNoteSchema, cardNotes 
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  goals: {
    get: {
      method: 'GET' as const,
      path: '/api/goals' as const,
      responses: { 200: z.array(z.custom<typeof gameGoals.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals' as const,
      input: insertGoalSchema,
      responses: { 201: z.custom<typeof gameGoals.$inferSelect>() }
    }
  },
  sessions: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions' as const,
      responses: { 200: z.array(z.custom<typeof sessions.$inferSelect>()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/sessions/:id' as const,
      responses: { 
        200: z.custom<typeof sessions.$inferSelect>(),
        404: errorSchemas.notFound 
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/sessions/:id' as const,
      input: insertSessionSchema.partial(),
      responses: { 
        200: z.custom<typeof sessions.$inferSelect>(),
        404: errorSchemas.notFound
      }
    }
  },
  decks: {
    list: {
      method: 'GET' as const,
      path: '/api/decks' as const,
      responses: { 200: z.array(z.custom<typeof decks.$inferSelect>()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/decks/:id' as const,
      responses: { 
        200: z.custom<typeof decks.$inferSelect>(),
        404: errorSchemas.notFound
      }
    }
  },
  cards: {
    listByDeck: {
      method: 'GET' as const,
      path: '/api/decks/:deckId/cards' as const,
      responses: { 200: z.array(z.custom<typeof cards.$inferSelect>()) }
    }
  },
  notes: {
    listBySession: {
      method: 'GET' as const,
      path: '/api/sessions/:sessionId/notes' as const,
      responses: { 200: z.array(z.custom<typeof cardNotes.$inferSelect>()) }
    },
    save: {
      method: 'POST' as const,
      path: '/api/notes' as const,
      input: insertCardNoteSchema,
      responses: { 201: z.custom<typeof cardNotes.$inferSelect>() }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}