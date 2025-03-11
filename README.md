# Financial & Credential Management App

A secure web application for managing financial data and credentials with robust data protection and Google Drive backup integration.

## Features

- 💳 Credit & Debit Card Management
- 🏦 Bank Account Tracking
- 💰 Loan Management with Repayment Tracking
- 🔐 Secure Password Storage
- 📊 Business Analytics
  - Customer Credit Management
  - Expense Tracking
  - Daily Sales Recording
- 📄 Document Management
- 🔄 Google Drive Backup & Restore
- 📱 Mobile Support (Android)

## Tech Stack

- Frontend: React + TypeScript
- Backend: Express.js
- Authentication: Passport.js
- Form Validation: Zod
- Mobile: Capacitor
- UI Components: shadcn/ui
- Styling: Tailwind CSS

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Google Cloud Platform account (for Drive backup)

## Environment Variables

Create a `.env` file with:

```env
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the application at `http://localhost:5000`

## Building for Production

```bash
npm run build
```

## Android Build

1. Install Android Studio
2. Configure Capacitor:
```bash
npx cap add android
```

3. Build the app:
```bash
npm run build
npx cap sync
npx cap open android
```

## Features Guide

### User Authentication
- Register with username/password
- Secure session management
- Biometric authentication support

### Financial Data Management
- Add/Edit/Delete credit and debit cards
- Manage bank accounts
- Track loans and repayments
- Record daily business sales
- Monitor expenses

### Security Features
- Encrypted data storage
- Secure credential management
- Protected card numbers and CVV display
- Session security

### Google Drive Integration
- Automatic data backup
- Data restore functionality
- Secure OAuth2 authentication

## Security Best Practices

- Never share your credentials
- Always logout after sessions
- Use strong passwords
- Enable biometric authentication when available
- Regularly backup your data

## Troubleshooting

### Common Issues

1. Session Errors
   - Clear browser cookies
   - Restart the application

2. Google Drive Sync Issues
   - Verify Google Cloud credentials
   - Check internet connectivity
   - Ensure proper OAuth2 setup

3. Mobile Build Issues
   - Update Android Studio
   - Check Capacitor configuration
   - Verify build settings

### Support

For technical issues or feature requests, please open an issue in the repository.

## License

MIT License
