import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Same validation for both credit and debit cards
const cardValidationSchema = cardFormSchema.refine(
  (data) => {
    // Card number validation
    if (!/^\d+$/.test(data.cardNumber)) return false;
    const isAmex = data.cardNetwork === "American Express";
    const requiredLength = isAmex ? 15 : 16;
    if (data.cardNumber.length !== requiredLength) return false;

    // CVV validation
    if (!/^\d+$/.test(data.cvv)) return false;
    const requiredCvvLength = isAmex ? 4 : 3;
    if (data.cvv.length !== requiredCvvLength) return false;

    // Expiry date validation
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

// Bank account schema with validation
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
    .min(1, "IFSC code is required")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  netBankingPassword: z.string().optional(),
  mpin: z.string()
    .regex(/^\d*$/, "mPIN must contain only digits")
    .max(6, "mPIN must not exceed 6 digits")
    .optional(),
  tags: z.array(z.string()).default([]),
});

export const insertCreditCardSchema = cardValidationSchema;
export const insertDebitCardSchema = cardValidationSchema;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type DebitCard = typeof debitCards.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type InsertDebitCard = z.infer<typeof insertDebitCardSchema>;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;