import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documentTypes = [
  "Aadhaar Card",
  "Aadhaar Card (Masked)",
  "PAN Card",
  "Driving License",
  "Passport",
  "Rental Agreement",
  "Vehicle Insurance",
  "Vehicle Registration Certificate",
  "COVID-19 Certificate",
  "Electricity Bill",
  "Business Registration Certificate",
  "Other"
] as const;

export const documentTypeToTags: Record<string, string[]> = {
  "Aadhaar Card": ["aadhaar"],
  "Aadhaar Card (Masked)": ["aadhaar"],
  "PAN Card": ["pan"],
  "Driving License": ["dl"],
  "Passport": ["passport"],
  "Rental Agreement": ["rental"],
  "Vehicle Insurance": ["vehicle"],
  "Vehicle Registration Certificate": ["vehicle"],
  "COVID-19 Certificate": ["covid"],
  "Electricity Bill": ["electricity"],
  "Business Registration Certificate": ["business"],
};

// Update users table to include driveBackupId and biometricEnabled
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  driveBackupId: text("drive_backup_id"), // Unique folder ID for Google Drive backups
  driveEmail: text("drive_email"), // Store Google account email
  biometricEnabled: boolean("biometric_enabled").notNull().default(false),
  biometricToken: text("biometric_token"), // Token for biometric verification
});

// Update user schema
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  useBiometric: z.boolean().optional(),
});

export const creditCards = pgTable("credit_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cardName: text("card_name").notNull(),
  cardNumber: text("card_number").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  cardNetwork: text("card_network").notNull(),
  issuer: text("issuer").notNull(),
  tags: text("tags").array().notNull().default([]),
});

export const debitCards = pgTable("debit_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cardName: text("card_name").notNull(),
  cardNumber: text("card_number").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  cardNetwork: text("card_network").notNull(),
  issuer: text("issuer").notNull(),
  tags: text("tags").array().notNull().default([]),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull(),
  customerId: text("customer_id"),
  ifscCode: text("ifsc_code").notNull(),
  netBankingPassword: text("net_banking_password"),
  mpin: text("mpin"),
  tags: text("tags").array().notNull().default([]),
});

export const passwords = pgTable("passwords", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  personName: text("person_name").notNull(),
  serviceName: text("service_name").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  isActualPassword: boolean("is_actual_password").notNull().default(false),
  notes: text("notes"),
});

export const cardNetworks = ["Visa", "Mastercard", "Rupay", "American Express"] as const;
export const bankIssuers = [
  "Axis Bank",
  "ICICI Bank",
  "RBL Bank",
  "HDFC Bank",
  "American Express",
  "CSB Bank",
  "SBI Bank",
  "YES Bank",
  "IDFC Bank",
  "IndusInd Bank",
  "Kotak Mahindra Bank",
  "AU Small Finance Bank"
] as const;

export const accountTypes = ["Savings", "Current"] as const;

const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of current year

// Business Schema
export const customerCredits = pgTable("customer_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  customerName: text("customer_name").notNull(),
  amount: decimal("amount").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending or paid
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
});

export const expenseCategories = [
  "Inventory",
  "Marketing",
  "Packaging",
  "Transport",
  "Commission",
  "Salary",
  "Rent",
  "Electricity",
  "Internet",
  "Water",
  "Others"
] as const;

export const paymentSources = ["Business", "Personal", "Other"] as const;
export const paymentMethods = ["Cash", "UPI", "Card"] as const;

// Define share type for shared expenses
const shareSchema = z.object({
  payerType: z.enum(paymentSources),
  payerName: z.string().optional(), // Required when payerType is "Other"
  amount: z.number().min(0, "Share amount cannot be negative"),
  paymentMethod: z.enum(paymentMethods),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  description: text("description"),
  isSharedExpense: boolean("is_shared_expense").notNull().default(false),
  // Fields for individual expense
  paidBy: text("paid_by"),
  payerName: text("payer_name"), // When paidBy is "Other"
  paymentMethod: text("payment_method"),
  // Fields for shared expense
  shares: jsonb("shares").array(), // Array of share objects
});

export const fixedExpenseTypes = ["Salary", "Rent", "Electricity", "Internet", "Water", "Other"] as const;

export const fixedExpenses = pgTable("fixed_expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount").notNull(),
  paidBy: text("paid_by").notNull(),
  paymentMethod: text("payment_method").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending or paid
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
});

export const dailySales = pgTable("daily_sales", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  cashAmount: decimal("cash_amount").notNull().default("0"),
  upiAmount: decimal("upi_amount").notNull().default("0"),
  cardAmount: decimal("card_amount").notNull().default("0"),
  totalAmount: decimal("total_amount").notNull(),
  notes: text("notes"),
});

const cardFormSchema = z.object({
  cardNetwork: z.enum(cardNetworks, {
    required_error: "Please select a card network",
  }),
  cardNumber: z.string().min(1, "Card number is required"),
  cvv: z.string().min(1, "CVV is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  cardName: z.string().min(1, "Card name is required"),
  issuer: z.enum(bankIssuers, {
    required_error: "Please select a bank",
  }),
  tags: z.array(z.string()).default([]),
});

const cardValidationSchema = cardFormSchema.refine(
  (data) => {
    if (!/^\d+$/.test(data.cardNumber)) return false;
    const isAmex = data.cardNetwork === "American Express";
    const requiredLength = isAmex ? 15 : 16;
    if (data.cardNumber.length !== requiredLength) return false;

    if (!/^\d+$/.test(data.cvv)) return false;
    const requiredCvvLength = isAmex ? 4 : 3;
    if (data.cvv.length !== requiredCvvLength) return false;

    if (!/^\d{2}\/\d{2}$/.test(data.expiryDate)) return false;
    const [month, year] = data.expiryDate.split("/").map(Number);
    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;

    return true;
  },
  {
    message: "Please check all card details are valid: card number length, CVV length, and expiry date format (MM/YY)",
  }
);

export const insertBankAccountSchema = z.object({
  bankName: z.enum(bankIssuers, {
    required_error: "Please select a bank",
  }),
  accountType: z.enum(accountTypes, {
    required_error: "Please select account type",
  }),
  accountNumber: z.string()
    .min(1, "Account number is required")
    .regex(/^\d+$/, "Account number must contain only digits")
    .min(8, "Account number must be at least 8 digits")
    .max(18, "Account number must not exceed 18 digits"),
  customerId: z.string().optional(),
  ifscCode: z.string()
    .min(1, "IFSC code is required"),
  netBankingPassword: z.string().optional(),
  mpin: z.string()
    .regex(/^\d*$/, "mPIN must contain only digits")
    .max(6, "mPIN must not exceed 6 digits")
    .optional(),
  tags: z.array(z.string()).default([]),
});

export const insertCreditCardSchema = cardValidationSchema;
export const insertDebitCardSchema = cardValidationSchema;

export const insertPasswordSchema = z.object({
  personName: z.string().min(1, "Person name is required"),
  serviceName: z.string().min(1, "Service name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  isActualPassword: z.boolean(),
  notes: z.string().optional(),
});

// Validation Schemas
export const insertCustomerCreditSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

export const insertExpenseSchema = z.object({
  category: z.enum(expenseCategories, {
    required_error: "Please select an expense category",
  }),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().optional(),
  description: z.string().optional(),
  isSharedExpense: z.boolean(),
  // Individual expense fields
  paidBy: z.enum(paymentSources).optional(),
  payerName: z.string().optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  // Shared expense fields
  shares: z.array(shareSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.isSharedExpense) {
    // Validate shared expense
    if (!data.shares || data.shares.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one share is required for shared expenses",
        path: ["shares"],
      });
      return;
    }

    // Validate total shares match amount
    const totalShares = data.shares.reduce((sum, share) => sum + share.amount, 0);
    if (Math.abs(totalShares - data.amount) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total shares must equal the expense amount",
        path: ["shares"],
      });
      return;
    }

    // Validate payerName for "Other" type shares
    for (const share of data.shares) {
      if (share.payerType === "Other" && !share.payerName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Payer name is required when payer type is Other",
          path: ["shares"],
        });
        return;
      }
    }

    // Clear individual expense fields
    data.paidBy = undefined;
    data.payerName = undefined;
    data.paymentMethod = undefined;
  } else {
    // Validate individual expense
    if (!data.paidBy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select who paid for this expense",
        path: ["paidBy"],
      });
      return;
    }

    if (!data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select payment method",
        path: ["paymentMethod"],
      });
      return;
    }

    if (data.paidBy === "Other" && !data.payerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify who paid for the expense",
        path: ["payerName"],
      });
      return;
    }

    // Clear shared expense fields
    data.shares = undefined;
  }
});

export const insertFixedExpenseSchema = z.object({
  type: z.enum(fixedExpenseTypes, {
    required_error: "Please select expense type",
  }),
  amount: z.number().positive("Amount must be positive"),
  paidBy: z.enum(paymentSources, {
    required_error: "Please select who paid for this expense",
  }),
  paymentMethod: z.enum(paymentMethods, {
    required_error: "Please select payment method",
  }),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

export const insertDailySalesSchema = z.object({
  date: z.string().min(1, "Date is required"),
  cashAmount: z.number().min(0, "Cash amount cannot be negative"),
  upiAmount: z.number().min(0, "UPI amount cannot be negative"),
  cardAmount: z.number().min(0, "Card amount cannot be negative"),
  notes: z.string().optional(),
}).refine(data => {
  const total = Number(data.cashAmount) + Number(data.upiAmount) + Number(data.cardAmount);
  return total > 0;
}, {
  message: "At least one payment method must have a value greater than 0",
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  personName: text("person_name").notNull(),
  amount: decimal("amount").notNull(),
  type: text("type").notNull(), // "given" or "received"
  description: text("description"),
  status: text("status").notNull().default("active"), // "active" or "completed"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const repayments = pgTable("repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull(),
  amount: decimal("amount").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  note: text("note"),
});

export const insertLoanSchema = z.object({
  personName: z.string().min(1, "Person name is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["given", "received"], {
    required_error: "Please select loan type",
  }),
  description: z.string().optional(),
});

export const insertRepaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  note: z.string().optional(),
  date: z.string().optional(), // Allow custom date input
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type DebitCard = typeof debitCards.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type InsertDebitCard = z.infer<typeof insertDebitCardSchema>;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type Password = typeof passwords.$inferSelect;
export type InsertPassword = z.infer<typeof insertPasswordSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Repayment = typeof repayments.$inferSelect;
export type InsertRepayment = z.infer<typeof insertRepaymentSchema>;
export type CustomerCredit = typeof customerCredits.$inferSelect;
export type InsertCustomerCredit = z.infer<typeof insertCustomerCreditSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type FixedExpense = typeof fixedExpenses.$inferSelect;
export type InsertFixedExpense = z.infer<typeof insertFixedExpenseSchema>;
export type DailySales = typeof dailySales.$inferSelect;
export type InsertDailySales = z.infer<typeof insertDailySalesSchema>;
export type Share = z.infer<typeof shareSchema>;

// Add this near the top with other constants
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentType: text("document_type").notNull(),
  customType: text("custom_type"), // For "Other" document type
  additionalInfo: text("additional_info"), // Additional document information
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file data
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertDocumentSchema = z.object({
  documentType: z.enum(documentTypes, {
    required_error: "Please select document type",
  }),
  customType: z.string().optional(),
  additionalInfo: z.string().optional(),
  fileName: z.string().min(1, "File is required"),
  fileData: z.string().min(1, "File data is required"),
  tags: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  if (data.documentType === "Other" && !data.customType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify the document type",
      path: ["customType"],
    });
  }
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;