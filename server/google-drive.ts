import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

// Get the current Replit workspace URL
const REPLIT_URL = process.env.REPL_SLUG
  ? `https://workspace-${process.env.REPL_SLUG}.picard.replit.dev`
  : 'http://localhost:5000';

console.log('[Google Drive] Using redirect URI:', `${REPLIT_URL}/api/google/callback`);

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // Use the actual workspace URL for the redirect URI
  `${REPLIT_URL}/api/google/callback`
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file' // Only request drive.file scope
  ];

  console.log('[Google Drive] Generating auth URL with scopes:', scopes);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  console.log('[Google Drive] Generated auth URL:', url);
  return url;
}

export async function handleCallback(code: string) {
  console.log('[Google Drive] Handling OAuth callback');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('[Google Drive] Successfully obtained tokens');
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('[Google Drive] Error getting tokens:', error);
    throw error;
  }
}

export async function backupToGoogleDrive(userId: number) {
  try {
    console.log('[Google Drive] Starting backup for user:', userId);

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
      parents: ['root'] // Save in root folder
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2),
    };

    console.log('[Google Drive] Uploading backup file:', fileMetadata.name);

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink',
    });

    console.log('[Google Drive] Backup successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Google Drive] Failed to backup to Google Drive:', error);
    throw error;
  }
}