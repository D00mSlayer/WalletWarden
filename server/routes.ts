import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCreditCardSchema, insertDebitCardSchema, insertBankAccountSchema, insertLoanSchema, insertRepaymentSchema, insertPasswordSchema, insertCustomerCreditSchema } from "@shared/schema";

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

  // Loan Routes
  app.get("/api/loans", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const loans = await storage.getLoans(req.user.id);
    res.json(loans);
  });

  app.post("/api/loans", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertLoanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const loan = await storage.createLoan(req.user.id, parsed.data);
    res.status(201).json(loan);
  });

  app.patch("/api/loans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertLoanSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const loan = await storage.getLoan(parseInt(req.params.id));
    if (!loan || loan.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updateLoan(loan.id, parsed.data);
    res.json(updated);
  });

  app.post("/api/loans/:id/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const loan = await storage.getLoan(parseInt(req.params.id));
    if (!loan || loan.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.completeLoan(loan.id);
    res.json(updated);
  });

  app.delete("/api/loans/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const loan = await storage.getLoan(parseInt(req.params.id));
    if (!loan || loan.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteLoan(loan.id);
    res.sendStatus(204);
  });

  // Repayment Routes
  app.get("/api/loans/:id/repayments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const loan = await storage.getLoan(parseInt(req.params.id));
    if (!loan || loan.userId !== req.user.id) return res.sendStatus(404);

    const repayments = await storage.getRepayments(loan.id);
    res.json(repayments);
  });

  app.post("/api/loans/:id/repayments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertRepaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const loan = await storage.getLoan(parseInt(req.params.id));
    if (!loan || loan.userId !== req.user.id) return res.sendStatus(404);

    const repayment = await storage.createRepayment(loan.id, parsed.data);
    res.status(201).json(repayment);
  });

  app.delete("/api/loans/:id/repayments/:repaymentId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const loan = await storage.getLoan(parseInt(req.params.id));
    if (!loan || loan.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteRepayment(parseInt(req.params.repaymentId));
    res.sendStatus(204);
  });

  // Password Routes
  app.get("/api/passwords", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const passwords = await storage.getPasswords(req.user.id);
    res.json(passwords);
  });

  app.post("/api/passwords", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const password = await storage.createPassword(req.user.id, parsed.data);
    res.status(201).json(password);
  });

  app.patch("/api/passwords/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const password = await storage.getPassword(parseInt(req.params.id));
    if (!password || password.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updatePassword(password.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/passwords/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const password = await storage.getPassword(parseInt(req.params.id));
    if (!password || password.userId !== req.user.id) return res.sendStatus(404);

    await storage.deletePassword(password.id);
    res.sendStatus(204);
  });

  // Customer Credit Routes
  app.get("/api/business/credits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const credits = await storage.getCustomerCredits(req.user.id);
    res.json(credits);
  });

  app.post("/api/business/credits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertCustomerCreditSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const credit = await storage.createCustomerCredit(req.user.id, parsed.data);
    res.status(201).json(credit);
  });

  app.post("/api/business/credits/:id/paid", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const credit = await storage.getCustomerCredit(parseInt(req.params.id));
    if (!credit || credit.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.markCustomerCreditPaid(credit.id);
    res.json(updated);
  });

  app.delete("/api/business/credits/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const credit = await storage.getCustomerCredit(parseInt(req.params.id));
    if (!credit || credit.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteCustomerCredit(credit.id);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}