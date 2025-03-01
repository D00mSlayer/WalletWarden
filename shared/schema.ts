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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const cardNetworks = ["Visa", "Mastercard", "Rupay", "American Express"] as const;

const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of current year

const creditCardFormSchema = z.object({
  cardNetwork: z.enum(cardNetworks),
  cardNumber: z.string(),
  cvv: z.string(),
  expiryDate: z.string(),
  cardName: z.string(),
  issuer: z.string(),
});

export const insertCreditCardSchema = creditCardFormSchema.refine(
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
  (data) => {
    const isAmex = data.cardNetwork === "American Express";
    return {
      message: `Validation failed: Please check card number (${isAmex ? "15" : "16"} digits), CVV (${
        isAmex ? "4" : "3"
      } digits), and expiry date (MM/YY format, ${currentYear} or later)`,
    };
  }
);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;