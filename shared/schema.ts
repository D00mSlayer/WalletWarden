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
  bankName: text("bank_name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const cardNetworks = ["Visa", "Mastercard", "Rupay", "American Express"] as const;

const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of current year

export const insertCreditCardSchema = createInsertSchema(creditCards)
  .pick({
    cardName: true,
    cardNumber: true,
    expiryDate: true,
    cvv: true,
    cardNetwork: true,
    bankName: true,
  })
  .extend({
    cardNetwork: z.enum(cardNetworks),
    cardNumber: z.string()
      .refine(val => /^\d+$/.test(val), "Card number must contain only digits")
      .refine(
        (val, { input }) => {
          const isAmex = input?.cardNetwork === "American Express";
          return isAmex ? val.length === 15 : val.length === 16;
        },
        ({ input }) => ({
          message: `${input?.cardNetwork === "American Express" ? "15" : "16"} digits required for ${input?.cardNetwork}`,
        })
      ),
    cvv: z.string()
      .refine(val => /^\d+$/.test(val), "CVV must contain only digits")
      .refine(
        (val, { input }) => {
          const isAmex = input?.cardNetwork === "American Express";
          return isAmex ? val.length === 4 : val.length === 3;
        },
        ({ input }) => ({
          message: `${input?.cardNetwork === "American Express" ? "4" : "3"} digits required for ${input?.cardNetwork}`,
        })
      ),
    expiryDate: z.string()
      .refine(
        (val) => {
          // Check basic format MM/YY
          if (!/^\d{2}\/\d{2}$/.test(val)) return false;

          const [month, year] = val.split("/").map(Number);
          // Month must be between 1 and 12
          if (month < 1 || month > 12) return false;

          // Year must be current year or later
          return year >= currentYear;
        },
        `Expiry date must be in format MM/YY and ${currentYear} or later`
      ),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;