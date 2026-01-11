# GitHub Setup in Cursor

This guide will help you connect your Life-Lag project to GitHub using Cursor's built-in Git integration.

## Prerequisites

1. **Git must be installed** - Cursor uses Git under the hood
   - Download from: https://git-scm.com/download/win
   - During installation, ensure "Add Git to PATH" is checked

2. **GitHub Account** - You already have the repo: https://github.com/alesol22308-tech/life-lag-tracker

## Steps to Connect GitHub in Cursor

### Method 1: Using Cursor's Source Control Panel (Recommended)

1. **Open Source Control in Cursor:**
   - Click the Source Control icon in the left sidebar (looks like a branch/fork icon)
   - Or press `Ctrl+Shift+G` (Windows)

2. **Initialize Repository:**
   - If you see "Initialize Repository", click it
   - This will create a `.git` folder

3. **Configure Git (if not already done):**
   - Open Cursor Settings (Ctrl+,)
   - Search for "git"
   - Set your Git path if needed
   - Configure your user name and email:
     ```
     git config --global user.name "Your Name"
     git config --global user.email "your.email@example.com"
     ```

4. **Add GitHub Remote:**
   - In Source Control, click the "..." menu (three dots)
   - Select "Remote" > "Add Remote..."
   - Name: `origin`
   - URL: `https://github.com/alesol22308-tech/life-lag-tracker.git`

5. **Stage and Commit:**
   - Click the "+" next to "Changes" to stage all files
   - Or click "+" next to individual files
   - Enter commit message: "Initial commit"
   - Click the checkmark to commit

6. **Push to GitHub:**
   - Click the "..." menu again
   - Select "Push" > "Push to..."
   - Choose "origin"
   - Select "main" as the branch
   - You'll be prompted to authenticate with GitHub

### Method 2: Using Cursor's Command Palette

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "Git: Initialize Repository" and select it
3. Type "Git: Add Remote" and enter:
   - Name: `origin`
   - URL: `https://github.com/alesol22308-tech/life-lag-tracker.git`
4. Stage files: "Git: Stage All Changes"
5. Commit: "Git: Commit All"
6. Push: "Git: Push"

### Authenticating with GitHub

When you push, Cursor will prompt you to authenticate. You can:
- Use GitHub Personal Access Token
- Use GitHub credentials
- Or set up SSH keys (more advanced)

## Quick Setup Script

If you prefer, you can also run the setup script I created:
```powershell
powershell -ExecutionPolicy Bypass -File .\push-to-github.ps1
```

## Troubleshooting

- **"Git not found"**: Install Git and restart Cursor
- **Authentication issues**: Check GitHub credentials in Cursor Settings
- **Branch name conflicts**: Use "main" branch (GitHub's default)

## After Setup

Once connected, you can:
- See file changes in Source Control panel
- Commit directly from Cursor
- Push/pull with one click
- View commit history
- Create branches and merge requests
