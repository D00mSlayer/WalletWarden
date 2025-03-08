import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCreditCardSchema, insertDebitCardSchema, insertBankAccountSchema, insertLoanSchema, insertRepaymentSchema, insertPasswordSchema, insertCustomerCreditSchema, insertExpenseSchema, insertDailySalesSchema, insertDocumentSchema } from "@shared/schema";
import { getAuthUrl, handleCallback, backupToGoogleDrive } from './google-drive';

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

  // Expense Routes
  app.get("/api/business/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenses = await storage.getExpenses(req.user.id);
    res.json(expenses);
  });

  app.post("/api/business/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const expense = await storage.createExpense(req.user.id, parsed.data);
    res.status(201).json(expense);
  });

  app.delete("/api/business/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const expense = await storage.getExpense(parseInt(req.params.id));
    if (!expense || expense.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteExpense(expense.id);
    res.sendStatus(204);
  });

  // Add this route after the existing expense routes
  app.post("/api/business/expenses/import-csv", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[API] Importing expenses from CSV");

    try {
      const rows = req.body.data;
      const results = [];
      const errors = [];

      for (const [index, row] of rows.entries()) {
        try {
          // Validate row has all required columns
          if (row.length < 8) {
            throw new Error(`Missing columns. Expected 8 columns, got ${row.length}`);
          }

          // Set default date as October 15, 2024
          let date = new Date(2024, 9, 15); // Month is 0-based, so 9 is October

          // Try to parse date from notes if available
          const notes = row[7] || "";
          const dateMatch = notes.match(/(\w+)\s+(\d+)\s+(\d{4})/);
          if (dateMatch) {
            const months = {
              'january': 0, 'jan': 0,
              'february': 1, 'feb': 1,
              'march': 2, 'mar': 2,
              'april': 3, 'apr': 3,
              'may': 4,
              'june': 5, 'jun': 5,
              'july': 6, 'jul': 6,
              'august': 7, 'aug': 7,
              'september': 8, 'sep': 8,
              'october': 9, 'oct': 9,
              'november': 10, 'nov': 10,
              'december': 11, 'dec': 11
            };

            const monthStr = dateMatch[1].toLowerCase();
            const day = parseInt(dateMatch[2]);
            const year = parseInt(dateMatch[3]);

            if (months.hasOwnProperty(monthStr) && day >= 1 && day <= 31) {
              const parsedDate = new Date(year, months[monthStr], day);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate;
              }
            }
          }

          console.log(`[API] Processing row ${index + 1}:`, {
            category: row[0],
            description: row[1],
            date: date.toISOString(),
            paidByMe: parseFloat(row[4]) || 0,
            paidByBina: parseFloat(row[5]) || 0,
            paidByBusiness: parseFloat(row[6]) || 0
          });

          // Parse amounts
          const paidByMe = parseFloat(row[4]) || 0;
          const paidByBina = parseFloat(row[5]) || 0;
          const paidByBusiness = parseFloat(row[6]) || 0;

          if (paidByMe + paidByBina + paidByBusiness === 0) {
            throw new Error("No valid payment amounts found");
          }

          // For each non-zero amount, create a separate expense entry
          if (paidByMe > 0) {
            const data = {
              category: row[0],
              description: row[1] || "",
              date: date.toISOString(),
              amount: paidByMe,
              isSharedExpense: false,
              paidBy: "Personal",
              paymentMethod: "Cash", // Default since not specified in CSV
              notes: row[7] || "",
            };
            const expense = await storage.createExpense(req.user.id, data);
            results.push(expense);
          }

          if (paidByBina > 0) {
            const data = {
              category: row[0],
              description: row[1] || "",
              date: date.toISOString(),
              amount: paidByBina,
              isSharedExpense: false,
              paidBy: "Other",
              payerName: "Bina",
              paymentMethod: "Cash", // Default since not specified in CSV
              notes: row[7] || "",
            };
            const expense = await storage.createExpense(req.user.id, data);
            results.push(expense);
          }

          if (paidByBusiness > 0) {
            const data = {
              category: row[0],
              description: row[1] || "",
              date: date.toISOString(),
              amount: paidByBusiness,
              isSharedExpense: false,
              paidBy: "Business",
              paymentMethod: "Cash", // Default since not specified in CSV
              notes: row[7] || "",
            };
            const expense = await storage.createExpense(req.user.id, data);
            results.push(expense);
          }
        } catch (error) {
          console.error(`[API] Error importing row ${index + 1}:`, {
            error: error.message,
            rowData: row
          });
          errors.push({
            row: index + 1,
            data: row,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        imported: results.length,
        errors: errors.map(e => `Row ${e.row}: ${e.error} (Data: ${e.data.join(', ')})`)
      });
    } catch (error) {
      console.error("[API] Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });



  // Daily Sales Routes
  app.get("/api/business/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[API] Getting daily sales records");
    const sales = await storage.getDailySales(req.user.id);
    res.json(sales);
  });

  app.post("/api/business/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[API] Creating daily sales record with data:", req.body);
    const parsed = insertDailySalesSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("[API] Daily sales validation error:", parsed.error);
      return res.status(400).json(parsed.error);
    }

    try {
      const sales = await storage.createDailySales(req.user.id, parsed.data);
      console.log("[API] Created daily sales record:", sales);
      res.status(201).json(sales);
    } catch (error) {
      console.error("[API] Error creating sales record:", error);
      res.status(500).json({ message: "Failed to create sales record" });
    }
  });

  app.patch("/api/business/sales/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[API] Updating daily sales record:", req.params.id, "with data:", req.body);
    const parsed = insertDailySalesSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("[API] Daily sales update validation error:", parsed.error);
      return res.status(400).json(parsed.error);
    }

    try {
      const sales = await storage.getDailySalesById(parseInt(req.params.id));
      if (!sales || sales.userId !== req.user.id) return res.sendStatus(404);

      const updated = await storage.updateDailySales(sales.id, parsed.data);
      console.log("[API] Updated daily sales record:", updated);
      res.json(updated);
    } catch (error) {
      console.error("[API] Error updating sales record:", error);
      res.status(500).json({ message: "Failed to update sales record" });
    }
  });

  app.delete("/api/business/sales/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[API] Deleting daily sales record:", req.params.id);

    try {
      const sales = await storage.getDailySalesById(parseInt(req.params.id));
      if (!sales || sales.userId !== req.user.id) return res.sendStatus(404);

      await storage.deleteDailySales(sales.id);
      console.log("[API] Deleted daily sales record:", req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("[API] Error deleting sales record:", error);
      res.status(500).json({ message: "Failed to delete sales record" });
    }
  });

  // Add this route after the existing daily sales routes
  app.post("/api/business/sales/import-csv", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[API] Importing daily sales from CSV");

    try {
      const rows = req.body.data;
      const results = [];
      const errors = [];

      for (const [index, row] of rows.entries()) {
        try {
          if (!row[0] || !row[0].match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
            throw new Error(`Invalid date format in column 1. Expected MM/DD/YYYY or MM-DD-YYYY, got: ${row[0]}`);
          }

          // Parse date (supports both mm/dd/yyyy and mm-dd-yyyy formats)
          const dateParts = row[0].split(/[-/]/);
          const month = parseInt(dateParts[0]) - 1;
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);

          if (month < 0 || month > 11) {
            throw new Error(`Invalid month: ${month + 1}`);
          }
          if (day < 1 || day > 31) {
            throw new Error(`Invalid day: ${day}`);
          }

          const date = new Date(year, month, day);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${row[0]}`);
          }

          const data = {
            date: date.toISOString(),
            upiAmount: parseFloat(row[1]) || 0,
            cashAmount: parseFloat(row[2]) || 0,
            cardAmount: parseFloat(row[3]) || 0,
            notes: "",
          };

          console.log(`[API] Processing row ${index + 1}:`, {
            originalDate: row[0],
            parsedDate: date.toISOString(),
            data
          });

          const sales = await storage.createDailySales(req.user.id, data);
          results.push(sales);
        } catch (error) {
          console.error(`[API] Error importing row ${index + 1}:`, {
            error: error.message,
            rowData: row
          });
          errors.push({
            row: index + 1,
            data: row,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        imported: results.length,
        errors: errors.map(e => `Row ${e.row}: ${e.error} (Data: ${e.data.join(', ')})`)
      });
    } catch (error) {
      console.error("[API] Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });


  // Document Routes
  app.get("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const documents = await storage.getDocuments(req.user.id);
    res.json(documents);
  });

  app.post("/api/documents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertDocumentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const document = await storage.createDocument(req.user.id, parsed.data);
    res.status(201).json(document);
  });

  app.patch("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertDocumentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document || document.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updateDocument(document.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/documents/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document || document.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteDocument(document.id);
    res.sendStatus(204);
  });

  app.get("/api/google/auth-url", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const url = await getAuthUrl(baseUrl);
      res.json({ url });
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      res.status(500).json({ message: "Failed to get auth URL" });
    }
  });

  app.get("/api/google/callback", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const code = req.query.code as string;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const tokens = await handleCallback(code, baseUrl);
      req.session.googleTokens = tokens;

      // Return HTML that closes the popup and signals success
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage('google-auth-success', '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Failed to handle callback:', error);
      res.status(500).json({ message: "Failed to authenticate with Google" });
    }
  });

  app.post("/api/backup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.session.googleTokens) {
      return res.status(401).json({ message: "Google authentication required" });
    }
    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const file = await backupToGoogleDrive(req.user.id, baseUrl);
      res.json(file);
    } catch (error) {
      console.error('Failed to backup:', error);
      res.status(500).json({ message: "Failed to backup data" });
    }
  });

  app.get("/api/google/debug-redirect-uri", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/google/callback`;
    res.json({
      redirectUri,
      replit: {
        slug: process.env.REPL_SLUG,
        owner: process.env.REPL_OWNER,
        id: process.env.REPL_ID
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}