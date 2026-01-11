# Script to push Life-Lag project to GitHub
# Repository: https://github.com/alesol22308-tech/life-lag-tracker

Write-Host "=== Pushing Life-Lag to GitHub ===" -ForegroundColor Cyan

# Try to find git in common locations
$gitPaths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "git"  # Try if in PATH
)

$gitExe = $null
foreach ($path in $gitPaths) {
    if ($path -eq "git") {
        try {
            $gitExe = Get-Command git -ErrorAction Stop | Select-Object -ExpandProperty Source
            break
        } catch {
            continue
        }
    } else {
        if (Test-Path $path) {
            $gitExe = $path
            break
        }
    }
}

if (-not $gitExe) {
    Write-Host "ERROR: Git not found!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or add Git to your PATH environment variable." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found Git at: $gitExe" -ForegroundColor Green
Write-Host ""

# Change to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir
Write-Host "Working directory: $projectDir" -ForegroundColor Cyan
Write-Host ""

# Check if git repository exists
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    & $gitExe init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to initialize git repository" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Git repository already initialized" -ForegroundColor Green
}

# Check remote
$remoteUrl = & $gitExe remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    & $gitExe remote add origin https://github.com/alesol22308-tech/life-lag-tracker.git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to add remote" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Remote already configured: $remoteUrl" -ForegroundColor Green
    # Update remote URL if different
    $currentUrl = & $gitExe remote get-url origin
    if ($currentUrl -ne "https://github.com/alesol22308-tech/life-lag-tracker.git") {
        Write-Host "Updating remote URL..." -ForegroundColor Yellow
        & $gitExe remote set-url origin https://github.com/alesol22308-tech/life-lag-tracker.git
    }
}

Write-Host ""
Write-Host "Staging all files..." -ForegroundColor Yellow
& $gitExe add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to stage files" -ForegroundColor Red
    exit 1
}

Write-Host "Checking status..." -ForegroundColor Yellow
& $gitExe status --short

Write-Host ""
$hasChanges = & $gitExe diff --cached --quiet; $LASTEXITCODE -ne 0

if ($hasChanges -or -not (& $gitExe rev-parse --verify HEAD 2>$null)) {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    $commitMessage = "Initial commit" + $(if ((& $gitExe rev-parse --verify HEAD 2>$null)) { "" } else { "" })
    
    # Check if there are any commits
    $commitCount = (& $gitExe rev-list --count HEAD 2>$null) | Out-String | ForEach-Object { $_.Trim() }
    if ($commitCount -eq "" -or $commitCount -eq "0") {
        $commitMessage = "Initial commit"
    } else {
        $commitMessage = "Update project files"
    }
    
    & $gitExe commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to commit changes" -ForegroundColor Red
        exit 1
    }
    Write-Host "Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "No changes to commit" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
& $gitExe push -u origin main
if ($LASTEXITCODE -ne 0) {
    # Try master branch if main fails
    Write-Host "Main branch not found, trying master..." -ForegroundColor Yellow
    & $gitExe push -u origin master
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push to GitHub" -ForegroundColor Red
        Write-Host "You may need to:" -ForegroundColor Yellow
        Write-Host "  1. Set the default branch name: git branch -M main" -ForegroundColor Yellow
        Write-Host "  2. Or push to the correct branch manually" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "=== Successfully pushed to GitHub! ===" -ForegroundColor Green
Write-Host "Repository: https://github.com/alesol22308-tech/life-lag-tracker" -ForegroundColor Cyan
