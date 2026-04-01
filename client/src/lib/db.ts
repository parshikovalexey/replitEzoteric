import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import decksData from '../data/decks.json';
import cardsData from '../data/cards.json';
import sessionsData from '../data/sessions.json';

export interface GameGoal {
  id: number;
  amount: string;
  question: string;
  status: string;
}

export interface Deck {
  id: number;
  name: string;
  sphere: string;
  coverImage: string;
}

export interface Card {
  id: number;
  deckId: number;
  name: string;
  description?: string;
  image: string;
  orientation: string;
  actionType: string;
  requiredDecks: number[];
  tips?: string | null;
}

export interface Session {
  id: number;
  number: number;
  name: string;
  description: string;
  status: string;
  notes: string;
  timerMinutes: number;
  startTime: string | null;
  deckIds: number[];
}

export interface CardNote {
  id: number;
  sessionId: number;
  cardId: number;
  content: string;
  parentId: number | null;
  slotIndex: number | null;
}

interface GameDB extends DBSchema {
  goals: {
    key: number;
    value: GameGoal;
  };
  decks: {
    key: number;
    value: Deck;
  };
  cards: {
    key: number;
    value: Card;
  };
  sessions: {
    key: number;
    value: Session;
  };
  notes: {
    key: number;
    value: CardNote;
  };
}

const DB_NAME = 'ezoteric-game';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GameDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('decks')) {
          const deckStore = db.createObjectStore('decks', { keyPath: 'id' });
          decksData.forEach(deck => deckStore.put(deck as Deck));
        }
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardsData.forEach(card => cardStore.put(card as Card));
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsData.forEach(session => sessionStore.put(session as Session));
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export const gameDB = {
  async getGoals(): Promise<GameGoal[]> {
    const db = await getDB();
    return db.getAll('goals');
  },

  async createGoal(goal: Omit<GameGoal, 'id'>): Promise<GameGoal> {
    const db = await getDB();
    const id = await db.add('goals', goal as GameGoal);
    return { ...goal, id: id as number };
  },

  async getDecks(): Promise<Deck[]> {
    const db = await getDB();
    return db.getAll('decks');
  },

  async getDeck(id: number): Promise<Deck | undefined> {
    const db = await getDB();
    return db.get('decks', id);
  },

  async getCardsByDeck(deckId: number): Promise<Card[]> {
    const db = await getDB();
    const all = await db.getAll('cards');
    return all.filter(c => c.deckId === deckId);
  },

  async getAllCards(): Promise<Card[]> {
    const db = await getDB();
    return db.getAll('cards');
  },

  async getSessions(): Promise<Session[]> {
    const db = await getDB();
    return db.getAll('sessions');
  },

  async getSession(id: number): Promise<Session | undefined> {
    const db = await getDB();
    return db.get('sessions', id);
  },

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const db = await getDB();
    const session = await db.get('sessions', id);
    if (!session) throw new Error('Session not found');
    
    const updated = { ...session, ...updates };
    await db.put('sessions', updated);

    if (updates.status === 'completed') {
      const nextSessionNumber = session.number + 1;
      const allSessions = await db.getAll('sessions');
      const nextSession = allSessions.find(s => s.number === nextSessionNumber);
      if (nextSession && nextSession.status === 'locked') {
        nextSession.status = 'available';
        await db.put('sessions', nextSession);
      }
    }

    return updated;
  },

  async getNotesBySession(sessionId: number): Promise<CardNote[]> {
    const db = await getDB();
    const all = await db.getAll('notes');
    return all.filter(n => n.sessionId === sessionId);
  },

  async getAllNotes(): Promise<CardNote[]> {
    const db = await getDB();
    return db.getAll('notes');
  },

  async createNote(note: Omit<CardNote, 'id'>): Promise<CardNote> {
    const db = await getDB();
    const existing = (await db.getAll('notes')).find(
      n => n.sessionId === note.sessionId && 
           n.cardId === note.cardId && 
           n.parentId === note.parentId && 
           n.slotIndex === note.slotIndex
    );

    if (existing) {
      const updated = { ...existing, content: note.content };
      await db.put('notes', updated);
      return updated;
    }

    const id = await db.add('notes', note as CardNote);
    return { ...note, id: id as number };
  },

  async clearAllData(): Promise<void> {
    const db = await getDB();
    await db.clear('goals');
    await db.clear('notes');
    
    // Reset sessions to initial state
    const sessions = await db.getAll('sessions');
    for (const session of sessions) {
      const resetSession = {
        ...session,
        status: session.number === 1 ? 'available' : 'locked',
        notes: '',
        startTime: null
      };
      await db.put('sessions', resetSession);
    }
  },
};