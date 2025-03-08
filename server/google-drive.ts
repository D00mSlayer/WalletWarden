import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

let oauth2Client: OAuth2Client;

export function configureOAuth2Client(baseUrl: string) {
  const redirectUri = `${baseUrl}/api/google/callback`;
  console.log('[Google Drive] Configuring OAuth client with redirect URI:', redirectUri);

  oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  return oauth2Client;
}

export async function getAuthUrl(baseUrl: string) {
  // Ensure OAuth client is configured with current URL
  const client = configureOAuth2Client(baseUrl);

  const scopes = [
    'https://www.googleapis.com/auth/drive.file' // Only request drive.file scope
  ];

  console.log('[Google Drive] Generating auth URL with scopes:', scopes);

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  console.log('[Google Drive] Generated auth URL:', url);
  return url;
}

export async function handleCallback(code: string, baseUrl: string) {
  console.log('[Google Drive] Handling OAuth callback');

  // Ensure OAuth client is configured with current URL
  const client = configureOAuth2Client(baseUrl);

  try {
    const { tokens } = await client.getToken(code);
    console.log('[Google Drive] Successfully obtained tokens');
    client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('[Google Drive] Error getting tokens:', error);
    throw error;
  }
}

export async function backupToGoogleDrive(userId: number, baseUrl: string) {
  try {
    console.log('[Google Drive] Starting backup for user:', userId);

    // Ensure OAuth client is configured with current URL
    const client = configureOAuth2Client(baseUrl);
    const drive = google.drive({ version: 'v3', auth: client });

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