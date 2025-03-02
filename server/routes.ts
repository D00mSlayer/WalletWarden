import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCreditCardSchema, insertDebitCardSchema, insertBankAccountSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/credit-cards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const cards = await storage.getCreditCards(req.user.id);
    res.json(cards);
  });

  app.post("/api/credit-cards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertCreditCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const card = await storage.createCreditCard(req.user.id, parsed.data);
    res.status(201).json(card);
  });

  app.patch("/api/credit-cards/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertCreditCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const card = await storage.getCreditCard(parseInt(req.params.id));
    if (!card || card.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updateCreditCard(card.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/credit-cards/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const card = await storage.getCreditCard(parseInt(req.params.id));
    if (!card || card.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteCreditCard(card.id);
    res.sendStatus(204);
  });

  // Debit Card Routes
  app.get("/api/debit-cards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const cards = await storage.getDebitCards(req.user.id);
    res.json(cards);
  });

  app.post("/api/debit-cards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertDebitCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const card = await storage.createDebitCard(req.user.id, parsed.data);
    res.status(201).json(card);
  });

  app.patch("/api/debit-cards/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertDebitCardSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const card = await storage.getDebitCard(parseInt(req.params.id));
    if (!card || card.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updateDebitCard(card.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/debit-cards/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const card = await storage.getDebitCard(parseInt(req.params.id));
    if (!card || card.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteDebitCard(card.id);
    res.sendStatus(204);
  });

  // Bank Account Routes
  app.get("/api/bank-accounts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const accounts = await storage.getBankAccounts(req.user.id);
    res.json(accounts);
  });

  app.post("/api/bank-accounts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertBankAccountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const account = await storage.createBankAccount(req.user.id, parsed.data);
    res.status(201).json(account);
  });

  app.patch("/api/bank-accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertBankAccountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const account = await storage.getBankAccount(parseInt(req.params.id));
    if (!account || account.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updateBankAccount(account.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const account = await storage.getBankAccount(parseInt(req.params.id));
    if (!account || account.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteBankAccount(account.id);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}