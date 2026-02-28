import {
  type GameGoal, type InsertGameGoal,
  type Session, type InsertSession,
  type Deck, type InsertDeck,
  type Card, type InsertCard,
  type CardNote, type InsertCardNote,
} from "@shared/schema";

export interface IStorage {
  // Goals
  getGoals(): Promise<GameGoal[]>;
  createGoal(goal: InsertGameGoal): Promise<GameGoal>;
  
  // Sessions
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  updateSession(id: number, updates: Partial<InsertSession>): Promise<Session>;
  
  // Decks
  getDecks(): Promise<Deck[]>;
  getDeck(id: number): Promise<Deck | undefined>;
  
  // Cards
  getCardsByDeck(deckId: number): Promise<Card[]>;
  
  // Notes
  getNotesBySession(sessionId: number): Promise<CardNote[]>;
  createNote(note: InsertCardNote): Promise<CardNote>;
}

export class MemStorage implements IStorage {
  private goals: Map<number, GameGoal>;
  private sessions: Map<number, Session>;
  private decks: Map<number, Deck>;
  private cards: Map<number, Card>;
  private notes: Map<number, CardNote>;
  
  private goalId: number = 1;
  private sessionId: number = 1;
  private deckId: number = 1;
  private cardId: number = 1;
  private noteId: number = 1;

  constructor() {
    this.goals = new Map();
    this.sessions = new Map();
    this.decks = new Map();
    this.cards = new Map();
    this.notes = new Map();
    
    this.seed();
  }
  
  private seed() {
    // Seed Decks
    const d1 = this.addDeck({ name: "Архетипы", sphere: "Самопознание", coverImage: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400" });
    const d2 = this.addDeck({ name: "Страхи", sphere: "Подсознание", coverImage: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400" });
    const d3 = this.addDeck({ name: "Действия", sphere: "Реализация", coverImage: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400" });
    const d4 = this.addDeck({ name: "Метафорические карты", sphere: "Подсознание", coverImage: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400" });
    
    // Seed Sessions
    const sessionData = [
      { number: 1, name: "Интуиция", description: "Работа с интуицией и внутренним голосом." },
      { number: 2, name: "Действия", description: "Углубление связи с интуитивными подсказками." },
      { number: 3, name: "Разум", description: "Переход от идей к конкретным шагам." },
      { number: 4, name: "Энергия", description: "Масштабирование действий и реализация." },
      { number: 5, name: "Синтез", description: "Логический анализ и структурирование." },
      { number: 6, name: "Мастерство", description: "Стратегическое планирование и ментальные установки." },
      { number: 7, name: "Реализация", description: "Наполнение энергией и завершение цикла." }
    ];

    for (let i = 0; i < 7; i++) {
      const data = sessionData[i];
      this.addSession({
        number: data.number,
        name: data.name,
        description: data.description,
        status: i === 0 ? 'available' : 'locked',
        notes: '',
        timerMinutes: 30,
        deckIds: (i + 1) % 2 !== 0 ? [d1.id, d2.id] : [d3.id]
      });
    }
    
    // Seed Cards for Decks
    [d1, d2, d3].forEach(deck => {
      for (let i = 1; i <= 10; i++) {
        this.addCard({
          deckId: deck.id,
          name: `Карта ${i} (${deck.name})`,
          description: `Описание и послание для карты ${i} из колоды ${deck.name}. Подумайте над этим.`,
          actionType: i % 3 === 0 ? 'nested' : 'standard',
          requiredDecks: i % 3 === 0 ? [d4.id] : []
        });
      }
    });

    // Seed 30 Metaphorical Cards
    for (let i = 1; i <= 30; i++) {
      this.addCard({
        deckId: d4.id,
        name: `МАК Карта ${i}`,
        description: `Метафорическое послание карты ${i}. Что вы видите на этом изображении? какие чувства оно вызывает?`,
        actionType: (i <= 7) ? 'nested' : 'standard',
        requiredDecks: (i <= 7) ? [d1.id] : [] // Links to Archetypes for 7 cards
      });
    }
  }

  private addDeck(d: InsertDeck) {
    const id = this.deckId++;
    const deck = { ...d, id };
    this.decks.set(id, deck);
    return deck;
  }
  private addSession(s: InsertSession) {
    const id = this.sessionId++;
    const session = { ...s, id };
    this.sessions.set(id, session);
    return session;
  }
  private addCard(c: InsertCard) {
    const id = this.cardId++;
    const card = { ...c, id };
    this.cards.set(id, card);
    return card;
  }

  async getGoals(): Promise<GameGoal[]> { return Array.from(this.goals.values()); }
  async createGoal(goal: InsertGameGoal): Promise<GameGoal> {
    const id = this.goalId++;
    const newGoal = { ...goal, id, question: goal.question || "" };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async getSessions(): Promise<Session[]> { return Array.from(this.sessions.values()); }
  async getSession(id: number): Promise<Session | undefined> { return this.sessions.get(id); }
  async updateSession(id: number, updates: Partial<InsertSession>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    const updated = { ...session, ...updates };
    this.sessions.set(id, updated);

    // Logic for unlocking next session
    if (updates.status === 'completed') {
      const nextSessionNumber = session.number + 1;
      const nextSession = Array.from(this.sessions.values()).find(s => s.number === nextSessionNumber);
      if (nextSession && nextSession.status === 'locked') {
        nextSession.status = 'available';
        this.sessions.set(nextSession.id, nextSession);
      }
    }

    return updated;
  }

  async getDecks(): Promise<Deck[]> { return Array.from(this.decks.values()); }
  async getDeck(id: number): Promise<Deck | undefined> { return this.decks.get(id); }

  async getCardsByDeck(deckId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(c => c.deckId === deckId);
  }

  async getNotesBySession(sessionId: number): Promise<CardNote[]> {
    return Array.from(this.notes.values()).filter(n => n.sessionId === sessionId);
  }
  async createNote(note: InsertCardNote): Promise<CardNote> {
    const id = this.noteId++;
    const newNote = { ...note, id, parentId: note.parentId ?? null };
    this.notes.set(id, newNote);
    return newNote;
  }
}

export const storage = new MemStorage();