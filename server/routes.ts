import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Goals
  app.get(api.goals.get.path, async (req, res) => {
    const goals = await storage.getGoals();
    res.json(goals);
  });
  app.post(api.goals.create.path, async (req, res) => {
    try {
      const input = api.goals.create.input.parse(req.body);
      const goal = await storage.createGoal(input);
      res.status(201).json(goal);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: 'Internal error' });
    }
  });

  // Sessions
  app.get(api.sessions.list.path, async (req, res) => {
    const sessions = await storage.getSessions();
    res.json(sessions);
  });
  app.get(api.sessions.get.path, async (req, res) => {
    const session = await storage.getSession(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Not found" });
    res.json(session);
  });
  app.patch(api.sessions.update.path, async (req, res) => {
    try {
      const input = api.sessions.update.input.parse(req.body);
      const session = await storage.updateSession(Number(req.params.id), input);
      res.json(session);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(404).json({ message: "Not found" });
    }
  });

  // Decks
  app.get(api.decks.list.path, async (req, res) => {
    const decks = await storage.getDecks();
    res.json(decks);
  });
  app.get(api.decks.get.path, async (req, res) => {
    const deck = await storage.getDeck(Number(req.params.id));
    if (!deck) return res.status(404).json({ message: "Not found" });
    res.json(deck);
  });

  // Cards
  app.get(api.cards.listByDeck.path, async (req, res) => {
    const cards = await storage.getCardsByDeck(Number(req.params.deckId));
    res.json(cards);
  });

  // Notes
  app.get(api.notes.listBySession.path, async (req, res) => {
    const notes = await storage.getNotesBySession(Number(req.params.sessionId));
    res.json(notes);
  });
  app.post(api.notes.save.path, async (req, res) => {
    try {
      const input = api.notes.save.input.parse(req.body);
      const note = await storage.createNote(input);
      res.status(201).json(note);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      res.status(500).json({ message: 'Internal error' });
    }
  });

    app.get("/api/cards", async (_req, res) => {
      const decks = await storage.getDecks();
      let allCards: any[] = [];
      for (const deck of decks) {
        const cards = await storage.getCardsByDeck(deck.id);
        allCards = [...allCards, ...cards];
      }
      res.json(allCards);
    });

    app.get("/api/notes", async (_req, res) => {
      const sessions = await storage.getSessions();
      let allNotes: any[] = [];
      for (const session of sessions) {
        const notes = await storage.getNotesBySession(session.id);
        allNotes = [...allNotes, ...notes];
      }
      res.json(allNotes);
    });

    return httpServer;
}