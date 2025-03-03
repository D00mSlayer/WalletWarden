import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/google/callback'
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function getAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/drive.file'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}

export async function handleCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export async function backupToGoogleDrive(userId: number) {
  try {
    // Fetch all data for the user
    const data = {
      creditCards: await storage.getCreditCards(userId),
      debitCards: await storage.getDebitCards(userId),
      bankAccounts: await storage.getBankAccounts(userId),
      loans: await storage.getLoans(userId),
      passwords: await storage.getPasswords(userId),
      documents: await storage.getDocuments(userId),
      customerCredits: await storage.getCustomerCredits(userId),
      expenses: await storage.getExpenses(userId),
      dailySales: await storage.getDailySales(userId),
    };

    // Create backup file
    const fileMetadata = {
      name: `financial-app-backup-${new Date().toISOString()}.json`,
      mimeType: 'application/json',
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2),
    };

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    });

    return response.data;
  } catch (error) {
    console.error('Failed to backup to Google Drive:', error);
    throw error;
  }
}
