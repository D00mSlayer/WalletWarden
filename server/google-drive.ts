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
    const client = configureOAuth2Client(baseUrl);

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    console.log('[Google Drive] Generating auth URL with scopes:', scopes);
    const state = Math.random().toString(36).substring(7);

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent'
    });

    console.log('[Google Drive] Generated auth URL:', url);
    return { url, state };
  } catch (error) {
    console.error('[Google Drive] Error generating auth URL:', error);
    throw error;
  }
}

export async function handleCallback(code: string, baseUrl: string) {
  console.log('[Google Drive] Handling OAuth callback');

  const client = configureOAuth2Client(baseUrl);

  try {
    const { tokens } = await client.getToken(code);
    console.log('[Google Drive] Successfully obtained tokens');

    // Get user email
    client.setCredentials(tokens);
    const oauth2 = google.oauth2('v2');
    const userInfo = await oauth2.userinfo.get({ auth: client });
    const email = userInfo.data.email;

    if (!email) {
      throw new Error('Could not get Google account email');
    }

    return { tokens, email };
  } catch (error) {
    console.error('[Google Drive] Error getting tokens:', error);
    throw error;
  }
}

async function findOrCreateBackupFolder(drive: any, userId: number, username: string) {
  const appFolderName = 'Financial App Backups';
  const userFolderName = `User_${userId}_${username}`;

  // Check if main app folder exists
  const appFolderResponse = await drive.files.list({
    q: `name='${appFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  let appFolderId;
  if (appFolderResponse.data.files && appFolderResponse.data.files.length > 0) {
    appFolderId = appFolderResponse.data.files[0].id;
    console.log('[Google Drive] Found existing app folder:', appFolderId);
  } else {
    // Create main app folder
    const appFolderMetadata = {
      name: appFolderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    const appFolder = await drive.files.create({
      requestBody: appFolderMetadata,
      fields: 'id'
    });
    appFolderId = appFolder.data.id;
    console.log('[Google Drive] Created new app folder:', appFolderId);
  }

  // Check if user folder exists and delete any duplicates
  const userFolderResponse = await drive.files.list({
    q: `name='${userFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  // Delete all existing user folders to prevent duplicates
  if (userFolderResponse.data.files && userFolderResponse.data.files.length > 0) {
    for (const file of userFolderResponse.data.files) {
      await drive.files.delete({ fileId: file.id });
      console.log('[Google Drive] Deleted existing user folder:', file.id);
    }
  }

  // Create new user folder
  const userFolderMetadata = {
    name: userFolderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [appFolderId]
  };

  const userFolder = await drive.files.create({
    requestBody: userFolderMetadata,
    fields: 'id'
  });

  console.log('[Google Drive] Created new user folder:', userFolder.data.id);
  return userFolder.data.id;
}

export async function backupToGoogleDrive(userId: number, username: string, baseUrl: string, tokens: any) {
  try {
    console.log('[Google Drive] Starting backup for user:', userId);

    const client = configureOAuth2Client(baseUrl);
    client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: client });

    const folderId = await findOrCreateBackupFolder(drive, userId, username);

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

    const loans = await storage.getLoans(userId);
    for (const loan of loans) {
      data.loanRepayments[loan.id] = await storage.getRepayments(loan.id);
    }

    // Delete existing backup files
    const existingFiles = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (existingFiles.data.files) {
      for (const file of existingFiles.data.files) {
        await drive.files.delete({ fileId: file.id });
        console.log('[Google Drive] Deleted old backup file:', file.id);
      }
    }

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

export async function getLatestBackup(userId: number, username: string, baseUrl: string, tokens: any) {
  try {
    console.log('[Google Drive] Fetching latest backup');

    const client = configureOAuth2Client(baseUrl);
    client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: client });

    const folderId = await findOrCreateBackupFolder(drive, userId, username);

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

    const fileResponse = await drive.files.get({
      fileId: file.id,
      alt: 'media'
    });

    return fileResponse.data;
  } catch (error) {
    console.error('[Google Drive] Failed to fetch latest backup:', error);
    throw error;
  }
}