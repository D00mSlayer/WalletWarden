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
  try {
    // Ensure OAuth client is configured with current URL
    const client = configureOAuth2Client(baseUrl);

    const scopes = [
      'https://www.googleapis.com/auth/drive.file' // Only request drive.file scope
    ];

    console.log('[Google Drive] Generating auth URL with scopes:', scopes);

    // Generate a state parameter to prevent CSRF
    const state = Math.random().toString(36).substring(7);

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      // Only show consent screen if we don't have a refresh token
      prompt: 'consent'
    });

    console.log('[Google Drive] Generated auth URL:', url);
    return { url, state };
  } catch (error) {
    console.error('[Google Drive] Error generating auth URL:', error);
    throw error;
  }
}

export async function handleCallback(code: string, baseUrl: string, expectedState?: string, providedState?: string) {
  console.log('[Google Drive] Handling OAuth callback');

  // Verify state parameter if provided
  if (expectedState && providedState && expectedState !== providedState) {
    throw new Error('Invalid state parameter');
  }

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

async function findOrCreateBackupFolder(drive: any) {
  const folderName = 'Financial App Backups';

  // Check if folder already exists
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files && response.data.files.length > 0) {
    console.log('[Google Drive] Found existing backup folder:', response.data.files[0].id);
    return response.data.files[0].id;
  }

  // Create new folder
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  console.log('[Google Drive] Created new backup folder:', folder.data.id);
  return folder.data.id;
}

export async function backupToGoogleDrive(userId: number, baseUrl: string, tokens: any) {
  try {
    console.log('[Google Drive] Starting backup for user:', userId);

    // Ensure OAuth client is configured with current URL
    const client = configureOAuth2Client(baseUrl);
    client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: client });

    // Get or create backup folder
    const folderId = await findOrCreateBackupFolder(drive);

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
      loanRepayments: {} as { [key: number]: any[] }
    };

    // Add loan repayments
    const loans = await storage.getLoans(userId);
    for (const loan of loans) {
      data.loanRepayments[loan.id] = await storage.getRepayments(loan.id);
    }

    // Check if there's an existing backup file and delete it
    const existingFiles = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (existingFiles.data.files && existingFiles.data.files.length > 0) {
      for (const file of existingFiles.data.files) {
        await drive.files.delete({ fileId: file.id });
        console.log('[Google Drive] Deleted old backup file:', file.id);
      }
    }

    // Create backup file with timestamp
    const timestamp = new Date().toISOString();
    const fileMetadata = {
      name: `backup-${timestamp}.json`,
      mimeType: 'application/json',
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2)
    };

    console.log('[Google Drive] Uploading backup file:', fileMetadata.name);

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink'
    });

    console.log('[Google Drive] Backup successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Google Drive] Failed to backup to Google Drive:', error);
    throw error;
  }
}

export async function getLatestBackup(baseUrl: string, tokens: any) {
  try {
    console.log('[Google Drive] Fetching latest backup');

    // Configure client
    const client = configureOAuth2Client(baseUrl);
    client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: client });

    // Find backup folder
    const folderId = await findOrCreateBackupFolder(drive);

    // Get latest backup file
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      orderBy: 'createdTime desc',
      pageSize: 1,
      fields: 'files(id, name, createdTime)',
      spaces: 'drive'
    });

    if (!response.data.files || response.data.files.length === 0) {
      throw new Error('No backup files found');
    }

    const file = response.data.files[0];
    console.log('[Google Drive] Found latest backup:', file);

    // Download file content
    const fileResponse = await drive.files.get({
      fileId: file.id!,
      alt: 'media'
    });

    return fileResponse.data;
  } catch (error) {
    console.error('[Google Drive] Failed to fetch latest backup:', error);
    throw error;
  }
}