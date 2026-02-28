import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameGoals = pgTable("game_goals", {
  id: serial("id").primaryKey(),
  amount: text("amount").notNull(),
  question: text("question").notNull(),
  status: text("status").notNull().default('pending'),
});

export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sphere: text("sphere").notNull(),
  coverImage: text("cover_image").notNull(),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  actionType: text("action_type").notNull(),
  requiredDecks: integer("required_decks").array().notNull(),
  tips: text("tips"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default('locked'), // 'locked', 'available', 'in_progress', 'completed'
  notes: text("notes").default(''),
  timerMinutes: integer("timer_minutes").notNull().default(30),
  startTime: text("start_time"), // ISO string of when the session actually started
  deckIds: integer("deck_ids").array().notNull(),
});

export const cardNotes = pgTable("card_notes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  cardId: integer("card_id").notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
});

export const insertGoalSchema = createInsertSchema(gameGoals).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export const insertDeckSchema = createInsertSchema(decks).omit({ id: true });
export const insertCardSchema = createInsertSchema(cards).omit({ id: true });
export const insertCardNoteSchema = createInsertSchema(cardNotes).omit({ id: true });

export type GameGoal = typeof gameGoals.$inferSelect;
export type InsertGameGoal = z.infer<typeof insertGoalSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = z.infer<typeof insertDeckSchema>;

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;

export type CardNote = typeof cardNotes.$inferSelect;
export type InsertCardNote = z.infer<typeof insertCardNoteSchema>;