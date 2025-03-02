import { User, InsertUser, CreditCard, InsertCreditCard, DebitCard, InsertDebitCard, BankAccount, InsertBankAccount } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCreditCards(userId: number): Promise<CreditCard[]>;
  getCreditCard(id: number): Promise<CreditCard | undefined>;
  createCreditCard(userId: number, card: InsertCreditCard): Promise<CreditCard>;
  updateCreditCard(id: number, card: InsertCreditCard): Promise<CreditCard>;
  deleteCreditCard(id: number): Promise<void>;

  getDebitCards(userId: number): Promise<DebitCard[]>;
  getDebitCard(id: number): Promise<DebitCard | undefined>;
  createDebitCard(userId: number, card: InsertDebitCard): Promise<DebitCard>;
  updateDebitCard(id: number, card: InsertDebitCard): Promise<DebitCard>;
  deleteDebitCard(id: number): Promise<void>;

  getBankAccounts(userId: number): Promise<BankAccount[]>;
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  createBankAccount(userId: number, account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, account: InsertBankAccount): Promise<BankAccount>;
  deleteBankAccount(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creditCards: Map<number, CreditCard>;
  private debitCards: Map<number, DebitCard>;
  private bankAccounts: Map<number, BankAccount>;
  private currentUserId: number;
  private currentCardId: number;
  private currentAccountId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.creditCards = new Map();
    this.debitCards = new Map();
    this.bankAccounts = new Map();
    this.currentUserId = 1;
    this.currentCardId = 1;
    this.currentAccountId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCreditCards(userId: number): Promise<CreditCard[]> {
    return Array.from(this.creditCards.values()).filter(
      (card) => card.userId === userId,
    );
  }

  async getCreditCard(id: number): Promise<CreditCard | undefined> {
    return this.creditCards.get(id);
  }

  async createCreditCard(userId: number, card: InsertCreditCard): Promise<CreditCard> {
    const id = this.currentCardId++;
    const creditCard: CreditCard = { ...card, id, userId };
    this.creditCards.set(id, creditCard);
    return creditCard;
  }

  async updateCreditCard(id: number, card: InsertCreditCard): Promise<CreditCard> {
    const existing = await this.getCreditCard(id);
    if (!existing) throw new Error("Credit card not found");

    const updated: CreditCard = { ...card, id, userId: existing.userId };
    this.creditCards.set(id, updated);
    return updated;
  }

  async deleteCreditCard(id: number): Promise<void> {
    this.creditCards.delete(id);
  }

  async getDebitCards(userId: number): Promise<DebitCard[]> {
    return Array.from(this.debitCards.values()).filter(
      (card) => card.userId === userId,
    );
  }

  async getDebitCard(id: number): Promise<DebitCard | undefined> {
    return this.debitCards.get(id);
  }

  async createDebitCard(userId: number, card: InsertDebitCard): Promise<DebitCard> {
    const id = this.currentCardId++;
    const debitCard: DebitCard = { ...card, id, userId };
    this.debitCards.set(id, debitCard);
    return debitCard;
  }

  async updateDebitCard(id: number, card: InsertDebitCard): Promise<DebitCard> {
    const existing = await this.getDebitCard(id);
    if (!existing) throw new Error("Debit card not found");

    const updated: DebitCard = { ...card, id, userId: existing.userId };
    this.debitCards.set(id, updated);
    return updated;
  }

  async deleteDebitCard(id: number): Promise<void> {
    this.debitCards.delete(id);
  }

  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    return Array.from(this.bankAccounts.values()).filter(
      (account) => account.userId === userId,
    );
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    return this.bankAccounts.get(id);
  }

  async createBankAccount(userId: number, account: InsertBankAccount): Promise<BankAccount> {
    const id = this.currentAccountId++;
    const bankAccount: BankAccount = { ...account, id, userId };
    this.bankAccounts.set(id, bankAccount);
    return bankAccount;
  }

  async updateBankAccount(id: number, account: InsertBankAccount): Promise<BankAccount> {
    const existing = await this.getBankAccount(id);
    if (!existing) throw new Error("Bank account not found");

    const updated: BankAccount = { ...account, id, userId: existing.userId };
    this.bankAccounts.set(id, updated);
    return updated;
  }

  async deleteBankAccount(id: number): Promise<void> {
    this.bankAccounts.delete(id);
  }
}

export const storage = new MemStorage();