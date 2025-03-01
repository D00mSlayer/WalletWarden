import { User, InsertUser, CreditCard, InsertCreditCard } from "@shared/schema";
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
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creditCards: Map<number, CreditCard>;
  private currentUserId: number;
  private currentCardId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.creditCards = new Map();
    this.currentUserId = 1;
    this.currentCardId = 1;
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
}

export const storage = new MemStorage();
