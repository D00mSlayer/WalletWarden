# Financial Tracker & Credential Management App

A secure financial and credential management web application with a mobile-first approach, focusing on robust data protection, user-friendly security experiences, and seamless expense tracking.

## Features

- 💳 Credit & Debit Card Management
- 🏦 Bank Account Tracking
- 💰 Loan Management with Repayment Tracking
- 🔐 Secure Password Storage
- 📊 Business Analytics
  - Customer Credit Management
  - Expense Tracking with Sharing Capability
  - Daily Sales Recording by Payment Method
- 📄 Document Management with Tagging
- 🔄 Google Drive Backup & Restore
- 📱 Mobile Support (Android)

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM (optional, can use in-memory storage)
- **Authentication**: Passport.js
- **Form Validation**: Zod
- **Data Fetching**: TanStack Query
- **Mobile**: Capacitor for Android packaging

## Prerequisites

Before setting up the application, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v12 or higher) - optional, can run with in-memory storage
- Git

## Environment Variables

The application requires the following environment variables to be set:

### Required Environment Variables

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `SESSION_SECRET` | Secret used for session encryption | `your-secure-random-string` |

### Database Variables (For PostgreSQL)

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:password@localhost:5432/finance_app` |
| `PGUSER` | PostgreSQL username | `postgres` |
| `PGPASSWORD` | PostgreSQL password | `your-password` |
| `PGDATABASE` | PostgreSQL database name | `finance_app` |
| `PGHOST` | PostgreSQL host | `localhost` |
| `PGPORT` | PostgreSQL port | `5432` |

### Google Drive Integration (Optional)

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-client-secret` |

## Setting Up Environment Variables

### Windows

1. Create a `.env` file in the root directory:

```
SESSION_SECRET=your-secure-random-string
DATABASE_URL=postgresql://user:password@localhost:5432/finance_app
PGUSER=postgres
PGPASSWORD=your-password
PGDATABASE=finance_app
PGHOST=localhost
PGPORT=5432
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

2. Alternatively, set them directly in PowerShell:

```powershell
$env:SESSION_SECRET = "your-secure-random-string"
$env:DATABASE_URL = "postgresql://user:password@localhost:5432/finance_app"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "your-password"
$env:PGDATABASE = "finance_app"
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "your-client-secret"
```

3. For permanent environment variables in Windows:
   - Open System Properties → Advanced → Environment Variables
   - Add each variable under User Variables or System Variables
   - Restart your terminal or IDE after setting variables

### Linux/macOS

1. Create a `.env` file in the root directory (same format as Windows)

2. Set them directly in your terminal:

```bash
export SESSION_SECRET="your-secure-random-string"
export DATABASE_URL="postgresql://user:password@localhost:5432/finance_app"
export PGUSER="postgres"
export PGPASSWORD="your-password"
export PGDATABASE="finance_app"
export PGHOST="localhost"
export PGPORT="5432"
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

3. For persistent variables, add them to your `~/.bashrc`, `~/.zshrc`, or equivalent:

```bash
echo 'export SESSION_SECRET="your-secure-random-string"' >> ~/.bashrc
echo 'export DATABASE_URL="postgresql://user:password@localhost:5432/finance_app"' >> ~/.bashrc
# Add other variables similarly
source ~/.bashrc  # Reload the configuration
```

## Installation and Setup

### Windows

1. Clone the repository:
   ```
   git clone <repository-url>
   cd financial-tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. If using PostgreSQL, create a database:
   ```
   # Using psql command line
   psql -U postgres -c "CREATE DATABASE finance_app;"
   
   # Or using pgAdmin: Create a new database named 'finance_app'
   ```

4. Run database migrations (if using PostgreSQL):
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application at http://localhost:5000

### Linux/macOS

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd financial-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. If using PostgreSQL, create a database:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE finance_app;"
   ```

4. Run database migrations (if using PostgreSQL):
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at http://localhost:5000

## Running in Production

For production deployment:

### Windows

```
npm run build
npm start
```

### Linux/macOS

```bash
npm run build
npm start
```

Consider using a process manager like PM2 for production deployments:

```bash
npm install -g pm2
pm2 start dist/server/index.js --name "financial-tracker"
```

## Android Build

The app can be built for Android using Capacitor:

1. Install Android Studio
2. Configure Capacitor:
   ```
   npx cap add android
   ```

3. Build the app:
   ```
   npm run build
   npx cap sync
   npx cap open android
   ```

4. From Android Studio, build and run the app on a device or emulator

## Database Options

### In-Memory Storage

By default, the application uses in-memory storage which is convenient for development and testing. All data will be lost when the server restarts.

### PostgreSQL Database

For persistent storage:
1. Install PostgreSQL
2. Create a database
3. Configure the environment variables
4. The application will automatically use PostgreSQL if `DATABASE_URL` is provided

## Google Drive Integration

To use the Google Drive backup and restore functionality:

1. Create a project in the [Google Developer Console](https://console.developers.google.com/)
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials (Web application type)
4. Set the redirect URI to `http://localhost:5000/api/google/callback` (adjust for your domain in production)
5. Set the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify PostgreSQL is running: 
     - Windows: Check Services app
     - Linux: `sudo systemctl status postgresql`
   - Check credentials in your environment variables
   - Test connection: `psql -U postgres -h localhost -d finance_app`

2. **Port Already in Use**:
   - Change the port by setting the `PORT` environment variable
   - Windows: `$env:PORT = "3000"`
   - Linux: `export PORT=3000`

3. **Google Drive Integration Issues**:
   - Verify redirect URIs match exactly (including http/https)
   - Check your application has the correct OAuth scopes

4. **Node.js or npm Issues**:
   - Verify versions: `node -v`, `npm -v`
   - Try clearing npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

### Command Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run db:push` | Push database schema changes |

## Security Best Practices

- Always use environment variables for secrets, never hardcode them
- Set a strong SESSION_SECRET value
- Use HTTPS in production
- Regularly backup your data
- Keep your Node.js and npm packages updated

## License

This project is licensed under the MIT License - see the LICENSE file for details.
