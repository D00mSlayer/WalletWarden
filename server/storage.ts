import { User, InsertUser, CreditCard, InsertCreditCard, DebitCard, InsertDebitCard, BankAccount, InsertBankAccount, Loan, InsertLoan, Repayment, InsertRepayment, Password, InsertPassword, CustomerCredit, InsertCustomerCredit, DailySales, InsertDailySales, Expense, InsertExpense, Document, InsertDocument } from "@shared/schema";
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

  getLoans(userId: number): Promise<Loan[]>;
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(userId: number, loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan>;
  completeLoan(id: number): Promise<Loan>;
  deleteLoan(id: number): Promise<void>;

  getRepayments(loanId: number): Promise<Repayment[]>;
  createRepayment(loanId: number, repayment: InsertRepayment): Promise<Repayment>;
  deleteRepayment(id: number): Promise<void>;

  getPasswords(userId: number): Promise<Password[]>;
  getPassword(id: number): Promise<Password | undefined>;
  createPassword(userId: number, password: InsertPassword): Promise<Password>;
  updatePassword(id: number, password: InsertPassword): Promise<Password>;
  deletePassword(id: number): Promise<void>;

  sessionStore: session.Store;
  getCustomerCredits(userId: number): Promise<CustomerCredit[]>;
  getCustomerCredit(id: number): Promise<CustomerCredit | undefined>;
  createCustomerCredit(userId: number, credit: InsertCustomerCredit): Promise<CustomerCredit>;
  markCustomerCreditPaid(id: number): Promise<CustomerCredit>;
  deleteCustomerCredit(id: number): Promise<void>;

  // Daily Sales methods
  getDailySales(userId: number): Promise<DailySales[]>;
  getDailySalesById(id: number): Promise<DailySales | undefined>;
  createDailySales(userId: number, sales: InsertDailySales): Promise<DailySales>;
  updateDailySales(id: number, sales: InsertDailySales): Promise<DailySales>;
  deleteDailySales(id: number): Promise<void>;

  getExpenses(userId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(userId: number, expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Document methods
  getDocuments(userId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(userId: number, document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creditCards: Map<number, CreditCard>;
  private debitCards: Map<number, DebitCard>;
  private bankAccounts: Map<number, BankAccount>;
  private loans: Map<number, Loan>;
  private repayments: Map<number, Repayment>;
  private passwords: Map<number, Password>;
  private customerCredits: Map<number, CustomerCredit>;
  private dailySales: Map<number, DailySales>;
  private expenses: Map<number, Expense>;
  private documents: Map<number, Document>;
  private currentUserId: number;
  private currentCardId: number;
  private currentAccountId: number;
  private currentLoanId: number;
  private currentRepaymentId: number;
  private currentPasswordId: number;
  private currentCustomerCreditId: number;
  private currentDailySalesId: number;
  private currentExpenseId: number;
  private currentDocumentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.creditCards = new Map();
    this.debitCards = new Map();
    this.bankAccounts = new Map();
    this.loans = new Map();
    this.repayments = new Map();
    this.passwords = new Map();
    this.customerCredits = new Map();
    this.dailySales = new Map();
    this.expenses = new Map();
    this.documents = new Map();
    this.currentUserId = 1;
    this.currentCardId = 1;
    this.currentAccountId = 1;
    this.currentLoanId = 1;
    this.currentRepaymentId = 1;
    this.currentPasswordId = 1;
    this.currentCustomerCreditId = 1;
    this.currentDailySalesId = 1;
    this.currentExpenseId = 1;
    this.currentDocumentId = 1;
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

  async getLoans(userId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.userId === userId,
    );
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }

  async createLoan(userId: number, loan: InsertLoan): Promise<Loan> {
    const id = this.currentLoanId++;
    const newLoan: Loan = {
      ...loan,
      id,
      userId,
      status: "active",
      createdAt: new Date(),
      completedAt: null,
    };
    this.loans.set(id, newLoan);
    return newLoan;
  }

  async updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan> {
    const existing = await this.getLoan(id);
    if (!existing) throw new Error("Loan not found");

    const updated: Loan = { ...existing, ...loan };
    this.loans.set(id, updated);
    return updated;
  }

  async completeLoan(id: number): Promise<Loan> {
    const existing = await this.getLoan(id);
    if (!existing) throw new Error("Loan not found");

    const updated: Loan = {
      ...existing,
      status: "completed",
      completedAt: new Date(),
    };
    this.loans.set(id, updated);
    return updated;
  }

  async deleteLoan(id: number): Promise<void> {
    this.loans.delete(id);
    // Also delete associated repayments
    for (const [repaymentId, repayment] of this.repayments) {
      if (repayment.loanId === id) {
        this.repayments.delete(repaymentId);
      }
    }
  }

  async getRepayments(loanId: number): Promise<Repayment[]> {
    return Array.from(this.repayments.values()).filter(
      (repayment) => repayment.loanId === loanId,
    );
  }

  async createRepayment(loanId: number, repayment: InsertRepayment): Promise<Repayment> {
    const id = this.currentRepaymentId++;
    const newRepayment: Repayment = {
      ...repayment,
      id,
      loanId,
      date: repayment.date ? new Date(repayment.date) : new Date(),
      amount: String(repayment.amount), // Convert to string as per schema
      note: repayment.note || null,
    };
    this.repayments.set(id, newRepayment);
    return newRepayment;
  }

  async deleteRepayment(id: number): Promise<void> {
    this.repayments.delete(id);
  }

  async getPasswords(userId: number): Promise<Password[]> {
    return Array.from(this.passwords.values()).filter(
      (password) => password.userId === userId,
    );
  }

  async getPassword(id: number): Promise<Password | undefined> {
    return this.passwords.get(id);
  }

  async createPassword(userId: number, password: InsertPassword): Promise<Password> {
    const id = this.currentPasswordId++;
    const newPassword: Password = { ...password, id, userId };
    this.passwords.set(id, newPassword);
    return newPassword;
  }

  async updatePassword(id: number, password: InsertPassword): Promise<Password> {
    const existing = await this.getPassword(id);
    if (!existing) throw new Error("Password not found");

    const updated: Password = { ...password, id, userId: existing.userId };
    this.passwords.set(id, updated);
    return updated;
  }

  async deletePassword(id: number): Promise<void> {
    this.passwords.delete(id);
  }

  async getCustomerCredits(userId: number): Promise<CustomerCredit[]> {
    return Array.from(this.customerCredits.values()).filter(
      (credit) => credit.userId === userId,
    );
  }

  async getCustomerCredit(id: number): Promise<CustomerCredit | undefined> {
    return this.customerCredits.get(id);
  }

  async createCustomerCredit(userId: number, credit: InsertCustomerCredit): Promise<CustomerCredit> {
    const id = this.currentCustomerCreditId++;
    const newCredit: CustomerCredit = {
      ...credit,
      id,
      userId,
      date: new Date(),
      status: "pending",
      paidDate: null,
      amount: String(credit.amount), // Convert to string as per schema
      purpose: credit.purpose || null,
      notes: credit.notes || null,
    };
    this.customerCredits.set(id, newCredit);
    return newCredit;
  }

  async markCustomerCreditPaid(id: number): Promise<CustomerCredit> {
    const credit = await this.getCustomerCredit(id);
    if (!credit) throw new Error("Credit not found");

    const updated: CustomerCredit = {
      ...credit,
      status: "paid",
      paidDate: new Date(),
    };
    this.customerCredits.set(id, updated);
    return updated;
  }

  async deleteCustomerCredit(id: number): Promise<void> {
    this.customerCredits.delete(id);
  }

  // Daily Sales implementations
  async getDailySales(userId: number): Promise<DailySales[]> {
    return Array.from(this.dailySales.values())
      .filter(sales => sales.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getDailySalesById(id: number): Promise<DailySales | undefined> {
    return this.dailySales.get(id);
  }

  async createDailySales(userId: number, sales: InsertDailySales): Promise<DailySales> {
    const id = this.currentDailySalesId++;
    const totalAmount = Number(sales.cashAmount) + Number(sales.cardAmount) + Number(sales.upiAmount);

    const newSales: DailySales = {
      id,
      userId,
      date: new Date(sales.date),
      cashAmount: String(sales.cashAmount),
      cardAmount: String(sales.cardAmount),
      upiAmount: String(sales.upiAmount),
      totalAmount: String(totalAmount),
      notes: sales.notes || "",
    };

    this.dailySales.set(id, newSales);
    return newSales;
  }

  async updateDailySales(id: number, sales: InsertDailySales): Promise<DailySales> {
    const existing = await this.getDailySalesById(id);
    if (!existing) throw new Error("Sales record not found");

    const totalAmount = Number(sales.cashAmount) + Number(sales.cardAmount) + Number(sales.upiAmount);

    const updated: DailySales = {
      ...existing,
      date: new Date(sales.date),
      cashAmount: String(sales.cashAmount),
      cardAmount: String(sales.cardAmount),
      upiAmount: String(sales.upiAmount),
      totalAmount: String(totalAmount),
      notes: sales.notes || "",
    };

    this.dailySales.set(id, updated);
    return updated;
  }

  async deleteDailySales(id: number): Promise<void> {
    this.dailySales.delete(id);
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId,
    );
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const newExpense: Expense = {
      ...expense,
      id,
      userId,
      date: expense.date ? new Date(expense.date) : new Date(),
      amount: String(expense.amount),
      description: expense.description || null,
    };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    this.expenses.delete(id);
  }

  async getDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.userId === userId,
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(userId: number, document: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const newDocument: Document = {
      ...document,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: document.description || null,
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, document: InsertDocument): Promise<Document> {
    const existing = await this.getDocument(id);
    if (!existing) throw new Error("Document not found");

    const updated: Document = {
      ...existing,
      ...document,
      updatedAt: new Date(),
      description: document.description || null,
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }
}

export const storage = new MemStorage();