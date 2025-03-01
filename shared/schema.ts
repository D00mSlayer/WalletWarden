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

export const insertCreditCardSchema = createInsertSchema(creditCards)
  .pick({
    cardName: true,
    cardNumber: true,
    expiryDate: true,
    cvv: true,
    cardNetwork: true,
    issuer: true,
  })
  .extend({
    cardNetwork: z.enum(cardNetworks),
    cardNumber: z.string()
      .refine(val => /^\d+$/.test(val), "Card number must contain only digits")
      .superRefine((val, ctx) => {
        const isAmex = ctx.parent.cardNetwork === "American Express";
        const requiredLength = isAmex ? 15 : 16;
        if (val.length !== requiredLength) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${requiredLength} digits required for ${ctx.parent.cardNetwork}`,
          });
        }
      }),
    cvv: z.string()
      .refine(val => /^\d+$/.test(val), "CVV must contain only digits")
      .superRefine((val, ctx) => {
        const isAmex = ctx.parent.cardNetwork === "American Express";
        const requiredLength = isAmex ? 4 : 3;
        if (val.length !== requiredLength) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${requiredLength} digits required for ${ctx.parent.cardNetwork}`,
          });
        }
      }),
    expiryDate: z.string()
      .refine(
        val => {
          if (!/^\d{2}\/\d{2}$/.test(val)) return false;
          const [month, year] = val.split("/").map(Number);
          return month >= 1 && month <= 12 && year >= currentYear;
        },
        `Expiry date must be in format MM/YY and ${currentYear} or later`
      ),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;