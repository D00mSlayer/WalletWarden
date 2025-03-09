import { User, InsertUser, CreditCard, InsertCreditCard, DebitCard, InsertDebitCard, BankAccount, InsertBankAccount, Loan, InsertLoan, Repayment, InsertRepayment, Password, InsertPassword, CustomerCredit, InsertCustomerCredit, DailySales, InsertDailySales, Expense, InsertExpense, Document, InsertDocument } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCreditCards(userId: number): Promise<CreditCard[]>;
  getCreditCard(userId: number, id: number): Promise<CreditCard | undefined>;
  createCreditCard(userId: number, card: InsertCreditCard): Promise<CreditCard>;
  updateCreditCard(userId: number, id: number, card: InsertCreditCard): Promise<CreditCard>;
  deleteCreditCard(userId: number, id: number): Promise<void>;

  getDebitCards(userId: number): Promise<DebitCard[]>;
  getDebitCard(userId: number, id: number): Promise<DebitCard | undefined>;
  createDebitCard(userId: number, card: InsertDebitCard): Promise<DebitCard>;
  updateDebitCard(userId: number, id: number, card: InsertDebitCard): Promise<DebitCard>;
  deleteDebitCard(userId: number, id: number): Promise<void>;

  getBankAccounts(userId: number): Promise<BankAccount[]>;
  getBankAccount(userId: number, id: number): Promise<BankAccount | undefined>;
  createBankAccount(userId: number, account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(userId: number, id: number, account: InsertBankAccount): Promise<BankAccount>;
  deleteBankAccount(userId: number, id: number): Promise<void>;

  getLoans(userId: number): Promise<Loan[]>;
  getLoan(userId: number, id: number): Promise<Loan | undefined>;
  createLoan(userId: number, loan: InsertLoan): Promise<Loan>;
  updateLoan(userId: number, id: number, loan: Partial<InsertLoan>): Promise<Loan>;
  completeLoan(userId: number, id: number): Promise<Loan>;
  deleteLoan(userId: number, id: number): Promise<void>;

  getRepayments(loanId: number): Promise<Repayment[]>;
  createRepayment(loanId: number, repayment: InsertRepayment): Promise<Repayment>;
  deleteRepayment(id: number): Promise<void>;

  getPasswords(userId: number): Promise<Password[]>;
  getPassword(userId: number, id: number): Promise<Password | undefined>;
  createPassword(userId: number, password: InsertPassword): Promise<Password>;
  updatePassword(userId: number, id: number, password: InsertPassword): Promise<Password>;
  deletePassword(userId: number, id: number): Promise<void>;

  getCustomerCredits(userId: number): Promise<CustomerCredit[]>;
  getCustomerCredit(userId: number, id: number): Promise<CustomerCredit | undefined>;
  createCustomerCredit(userId: number, credit: InsertCustomerCredit): Promise<CustomerCredit>;
  markCustomerCreditPaid(userId: number, id: number): Promise<CustomerCredit>;
  deleteCustomerCredit(userId: number, id: number): Promise<void>;

  getDailySales(userId: number): Promise<DailySales[]>;
  getDailySalesById(userId: number, id: number): Promise<DailySales | undefined>;
  createDailySales(userId: number, sales: InsertDailySales): Promise<DailySales>;
  updateDailySales(userId: number, id: number, sales: InsertDailySales): Promise<DailySales>;
  deleteDailySales(userId: number, id: number): Promise<void>;

  getExpenses(userId: number): Promise<Expense[]>;
  getExpense(userId: number, id: number): Promise<Expense | undefined>;
  createExpense(userId: number, expense: InsertExpense): Promise<Expense>;
  deleteExpense(userId: number, id: number): Promise<void>;

  getDocuments(userId: number): Promise<Document[]>;
  getDocument(userId: number, id: number): Promise<Document | undefined>;
  createDocument(userId: number, document: InsertDocument): Promise<Document>;
  updateDocument(userId: number, id: number, document: InsertDocument): Promise<Document>;
  deleteDocument(userId: number, id: number): Promise<void>;

  sessionStore: session.Store;

  getUserByDriveEmail(email: string): Promise<User | undefined>;
  updateUserDriveEmail(userId: number, email: string): Promise<void>;
  clearUserData(userId: number): Promise<void>;
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
  private currentUserId: number = 1;
  private currentIds: Map<string, number>;
  sessionStore: session.Store;

  constructor() {
    // Initialize all storage maps
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

    // Initialize ID counters
    this.currentIds = new Map([
      ['card', 1],
      ['account', 1],
      ['loan', 1],
      ['repayment', 1],
      ['password', 1],
      ['credit', 1],
      ['sales', 1],
      ['expense', 1],
      ['document', 1]
    ]);

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  private getNextId(type: string): number {
    const currentId = this.currentIds.get(type) || 1;
    this.currentIds.set(type, currentId + 1);
    return currentId;
  }

  private validateUserAccess(userId: number, item: { userId: number } | undefined, errorMessage: string): void {
    if (!item || item.userId !== userId) {
      throw new Error(errorMessage);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      driveBackupId: null,
      driveEmail: null,
      biometricEnabled: false,
      biometricToken: null
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByDriveEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.driveEmail === email);
  }

  async updateUserDriveEmail(userId: number, email: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    // Check if email is already used by another user
    const existingUser = await this.getUserByDriveEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("This Google account is already linked to another user");
    }

    user.driveEmail = email;
    this.users.set(userId, user);
  }

  async getCreditCards(userId: number): Promise<CreditCard[]> {
    return Array.from(this.creditCards.values()).filter(card => card.userId === userId);
  }

  async getCreditCard(userId: number, id: number): Promise<CreditCard | undefined> {
    const card = this.creditCards.get(id);
    this.validateUserAccess(userId, card, "Credit card not found or user does not have access");
    return card;
  }

  async createCreditCard(userId: number, card: InsertCreditCard): Promise<CreditCard> {
    const id = this.getNextId('card');
    const creditCard: CreditCard = { ...card, id, userId };
    this.creditCards.set(id, creditCard);
    return creditCard;
  }

  async updateCreditCard(userId: number, id: number, card: InsertCreditCard): Promise<CreditCard> {
    const existing = await this.getCreditCard(userId, id);
    if (!existing) throw new Error("Credit card not found");
    const updated: CreditCard = { ...card, id, userId };
    this.creditCards.set(id, updated);
    return updated;
  }

  async deleteCreditCard(userId: number, id: number): Promise<void> {
    const card = await this.getCreditCard(userId, id);
    if (!card) throw new Error("Credit card not found");
    this.creditCards.delete(id);
  }

  async getDebitCards(userId: number): Promise<DebitCard[]> {
    return Array.from(this.debitCards.values()).filter(card => card.userId === userId);
  }

  async getDebitCard(userId: number, id: number): Promise<DebitCard | undefined> {
    const card = this.debitCards.get(id);
    this.validateUserAccess(userId, card, "Debit card not found or user does not have access");
    return card;
  }

  async createDebitCard(userId: number, card: InsertDebitCard): Promise<DebitCard> {
    const id = this.getNextId('card');
    const debitCard: DebitCard = { ...card, id, userId };
    this.debitCards.set(id, debitCard);
    return debitCard;
  }

  async updateDebitCard(userId: number, id: number, card: InsertDebitCard): Promise<DebitCard> {
    const existing = await this.getDebitCard(userId, id);
    if (!existing) throw new Error("Debit card not found");
    const updated: DebitCard = { ...card, id, userId };
    this.debitCards.set(id, updated);
    return updated;
  }

  async deleteDebitCard(userId: number, id: number): Promise<void> {
    const card = await this.getDebitCard(userId, id);
    if (!card) throw new Error("Debit card not found");
    this.debitCards.delete(id);
  }

  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    return Array.from(this.bankAccounts.values()).filter(account => account.userId === userId);
  }

  async getBankAccount(userId: number, id: number): Promise<BankAccount | undefined> {
    const account = this.bankAccounts.get(id);
    this.validateUserAccess(userId, account, "Bank account not found or user does not have access");
    return account;
  }

  async createBankAccount(userId: number, account: InsertBankAccount): Promise<BankAccount> {
    const id = this.getNextId('account');
    const bankAccount: BankAccount = { ...account, id, userId };
    this.bankAccounts.set(id, bankAccount);
    return bankAccount;
  }

  async updateBankAccount(userId: number, id: number, account: InsertBankAccount): Promise<BankAccount> {
    const existing = await this.getBankAccount(userId, id);
    if (!existing) throw new Error("Bank account not found");
    const updated: BankAccount = { ...account, id, userId };
    this.bankAccounts.set(id, updated);
    return updated;
  }

  async deleteBankAccount(userId: number, id: number): Promise<void> {
    const account = await this.getBankAccount(userId, id);
    if (!account) throw new Error("Bank account not found");
    this.bankAccounts.delete(id);
  }

  async getLoans(userId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(loan => loan.userId === userId);
  }

  async getLoan(userId: number, id: number): Promise<Loan | undefined> {
    const loan = this.loans.get(id);
    this.validateUserAccess(userId, loan, "Loan not found or user does not have access");
    return loan;
  }

  async createLoan(userId: number, loan: InsertLoan): Promise<Loan> {
    const id = this.getNextId('loan');
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

  async updateLoan(userId: number, id: number, loan: Partial<InsertLoan>): Promise<Loan> {
    const existing = await this.getLoan(userId, id);
    if (!existing) throw new Error("Loan not found");
    const updated: Loan = { ...existing, ...loan };
    this.loans.set(id, updated);
    return updated;
  }

  async completeLoan(userId: number, id: number): Promise<Loan> {
    const existing = await this.getLoan(userId, id);
    if (!existing) throw new Error("Loan not found");
    const updated: Loan = {
      ...existing,
      status: "completed",
      completedAt: new Date(),
    };
    this.loans.set(id, updated);
    return updated;
  }

  async deleteLoan(userId: number, id: number): Promise<void> {
    const loan = await this.getLoan(userId, id);
    if (!loan) throw new Error("Loan not found");
    this.loans.delete(id);
    // Also delete associated repayments
    this.repayments = new Map([...this.repayments].filter(([_, repayment]) => repayment.loanId !== id));
  }

  async getRepayments(loanId: number): Promise<Repayment[]> {
    return Array.from(this.repayments.values()).filter(repayment => repayment.loanId === loanId);
  }

  async createRepayment(loanId: number, repayment: InsertRepayment): Promise<Repayment> {
    const id = this.getNextId('repayment');
    const newRepayment: Repayment = {
      ...repayment,
      id,
      loanId,
      date: repayment.date ? new Date(repayment.date) : new Date(),
      amount: String(repayment.amount),
      note: repayment.note || null,
    };
    this.repayments.set(id, newRepayment);
    return newRepayment;
  }

  async deleteRepayment(id: number): Promise<void> {
    const repayment = this.repayments.get(id);
    if (!repayment) throw new Error("Repayment not found");
    this.repayments.delete(id);
  }

  async getPasswords(userId: number): Promise<Password[]> {
    return Array.from(this.passwords.values()).filter(password => password.userId === userId);
  }

  async getPassword(userId: number, id: number): Promise<Password | undefined> {
    const password = this.passwords.get(id);
    this.validateUserAccess(userId, password, "Password not found or user does not have access");
    return password;
  }

  async createPassword(userId: number, password: InsertPassword): Promise<Password> {
    const id = this.getNextId('password');
    const newPassword: Password = { ...password, id, userId };
    this.passwords.set(id, newPassword);
    return newPassword;
  }

  async updatePassword(userId: number, id: number, password: InsertPassword): Promise<Password> {
    const existing = await this.getPassword(userId, id);
    if (!existing) throw new Error("Password not found");
    const updated: Password = { ...password, id, userId };
    this.passwords.set(id, updated);
    return updated;
  }

  async deletePassword(userId: number, id: number): Promise<void> {
    const password = await this.getPassword(userId, id);
    if (!password) throw new Error("Password not found");
    this.passwords.delete(id);
  }

  async getCustomerCredits(userId: number): Promise<CustomerCredit[]> {
    return Array.from(this.customerCredits.values()).filter(credit => credit.userId === userId);
  }

  async getCustomerCredit(userId: number, id: number): Promise<CustomerCredit | undefined> {
    const credit = this.customerCredits.get(id);
    this.validateUserAccess(userId, credit, "Customer credit not found or user does not have access");
    return credit;
  }

  async createCustomerCredit(userId: number, credit: InsertCustomerCredit): Promise<CustomerCredit> {
    const id = this.getNextId('credit');
    const newCredit: CustomerCredit = {
      ...credit,
      id,
      userId,
      date: new Date(),
      status: "pending",
      paidDate: null,
      amount: String(credit.amount),
      purpose: credit.purpose || null,
      notes: credit.notes || null,
    };
    this.customerCredits.set(id, newCredit);
    return newCredit;
  }

  async markCustomerCreditPaid(userId: number, id: number): Promise<CustomerCredit> {
    const credit = await this.getCustomerCredit(userId, id);
    if (!credit) throw new Error("Credit not found");
    const updated: CustomerCredit = {
      ...credit,
      status: "paid",
      paidDate: new Date(),
    };
    this.customerCredits.set(id, updated);
    return updated;
  }

  async deleteCustomerCredit(userId: number, id: number): Promise<void> {
    const credit = await this.getCustomerCredit(userId, id);
    if (!credit) throw new Error("Customer credit not found");
    this.customerCredits.delete(id);
  }

  async getDailySales(userId: number): Promise<DailySales[]> {
    return Array.from(this.dailySales.values())
      .filter(sales => sales.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getDailySalesById(userId: number, id: number): Promise<DailySales | undefined> {
    const sales = this.dailySales.get(id);
    this.validateUserAccess(userId, sales, "Daily sales record not found or user does not have access");
    return sales;
  }

  async createDailySales(userId: number, sales: InsertDailySales): Promise<DailySales> {
    const id = this.getNextId('sales');
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

  async updateDailySales(userId: number, id: number, sales: InsertDailySales): Promise<DailySales> {
    const existing = await this.getDailySalesById(userId, id);
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

  async deleteDailySales(userId: number, id: number): Promise<void> {
    const sales = await this.getDailySalesById(userId, id);
    if (!sales) throw new Error("Daily sales record not found");
    this.dailySales.delete(id);
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
  }

  async getExpense(userId: number, id: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    this.validateUserAccess(userId, expense, "Expense not found or user does not have access");
    return expense;
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const id = this.getNextId('expense');
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

  async deleteExpense(userId: number, id: number): Promise<void> {
    const expense = await this.getExpense(userId, id);
    if (!expense) throw new Error("Expense not found");
    this.expenses.delete(id);
  }

  async getDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.userId === userId);
  }

  async getDocument(userId: number, id: number): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    this.validateUserAccess(userId, doc, "Document not found or user does not have access");
    return doc;
  }

  async createDocument(userId: number, document: InsertDocument): Promise<Document> {
    const id = this.getNextId('document');
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

  async updateDocument(userId: number, id: number, document: InsertDocument): Promise<Document> {
    const existing = await this.getDocument(userId, id);
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

  async deleteDocument(userId: number, id: number): Promise<void> {
    const doc = await this.getDocument(userId, id);
    if (!doc) throw new Error("Document not found");
    this.documents.delete(id);
  }

  async clearUserData(userId: number): Promise<void> {
    if (!this.users.has(userId)) {
      throw new Error("User not found");
    }

    // Delete all data associated with this user
    this.creditCards = new Map([...this.creditCards].filter(([_, card]) => card.userId !== userId));
    this.debitCards = new Map([...this.debitCards].filter(([_, card]) => card.userId !== userId));
    this.bankAccounts = new Map([...this.bankAccounts].filter(([_, acc]) => acc.userId !== userId));
    this.loans = new Map([...this.loans].filter(([_, loan]) => loan.userId !== userId));
    this.passwords = new Map([...this.passwords].filter(([_, pwd]) => pwd.userId !== userId));
    this.customerCredits = new Map([...this.customerCredits].filter(([_, credit]) => credit.userId !== userId));
    this.dailySales = new Map([...this.dailySales].filter(([_, sale]) => sale.userId !== userId));
    this.expenses = new Map([...this.expenses].filter(([_, exp]) => exp.userId !== userId));
    this.documents = new Map([...this.documents].filter(([_, doc]) => doc.userId !== userId));

    // Clear repayments for user's loans
    this.repayments = new Map([...this.repayments].filter(([_, repay]) => {
      const loan = this.loans.get(repay.loanId);
      return loan && loan.userId !== userId;
    }));
  }

  async initializeStorage(): Promise<void> {
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
    this.currentIds = new Map([
      ['card', 1],
      ['account', 1],
      ['loan', 1],
      ['repayment', 1],
      ['password', 1],
      ['credit', 1],
      ['sales', 1],
      ['expense', 1],
      ['document', 1]
    ]);
  }
}

// Initialize storage and export a singleton instance
export const storage = new MemStorage();
// Clear all data on startup to ensure clean state
storage.initializeStorage();