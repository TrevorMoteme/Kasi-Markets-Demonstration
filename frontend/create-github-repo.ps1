# =============================================
# KASI GITHUB REPO SETUP - CLEAN VERSION
# =============================================

$GITHUB_USERNAME = "tmotet"
$REPO_NAME = "kasi-business-directory"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CREATING GITHUB REPOSITORY FOR KASI APP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Git
Write-Host "Checking Git..." -ForegroundColor Yellow
try {
    git --version
    Write-Host "Git found" -ForegroundColor Green
} catch {
    Write-Host "Git not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# Initialize Git
Write-Host "Initializing Git..." -ForegroundColor Yellow
git init

# Create .gitignore
Write-Host "Creating .gitignore..." -ForegroundColor Yellow
@"
# Python
__pycache__/
*.pyc
venv/
env/
backend/.env
backend/media/
backend/uploads/

# Node
node_modules/
frontend/.env
frontend/build/
frontend/dist/

# IDE
.vscode/
.idea/
.DS_Store
"@ | Out-File -FilePath .gitignore -Encoding UTF8

Write-Host ".gitignore created" -ForegroundColor Green

# Stage and commit
Write-Host "Committing files..." -ForegroundColor Yellow
git add .
git commit -m "Initial commit: KASI Business Directory Platform"

# Add remote
Write-Host "Adding remote..." -ForegroundColor Yellow
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "SUCCESS! Repository created!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Repo: https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Green

Read-Host "Press Enter to exit"
