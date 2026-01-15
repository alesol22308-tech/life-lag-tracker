# How to Start the Development Server

## The Problem
The magic link is trying to redirect to `localhost:3000`, but your development server isn't running.

## Solution: Start the Dev Server

### Option 1: Use Command Prompt or PowerShell
1. Press `Win + R`
2. Type `cmd` and press Enter
3. Navigate to your project:
   ```bash
   cd "C:\Users\123al\OneDrive\Documents\Life-Lag"
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Option 2: Use VS Code or Cursor Terminal
1. Open the integrated terminal (Ctrl + `)
2. Run:
   ```bash
   npm run dev
   ```

### Option 3: If Node.js Isn't Installed
If you get "npm not found":
1. Install Node.js from: https://nodejs.org/
2. Choose the LTS version
3. Restart your terminal
4. Run `npm run dev`

## After Starting the Server
1. Wait for the message: `Ready on http://localhost:3000`
2. Click the magic link from your email again
3. Or copy the URL from email and paste it in your browser

## The Magic Link Will Work Once Server is Running! ✅
