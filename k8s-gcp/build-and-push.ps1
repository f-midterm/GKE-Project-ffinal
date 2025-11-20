<#
.SYNOPSIS
  Build Docker images and push to Google Container Registry (GCR)

.DESCRIPTION
  This script:
  1. Builds backend and frontend Docker images
  2. Tags them for Google Container Registry
  3. Pushes them to GCR
  
.PARAMETER ProjectId
  GCP Project ID (optional - auto-detected from gcloud if not provided)

.PARAMETER Tag
  Image tag (default: "prod")

.EXAMPLE
  .\build-and-push.ps1
  # Auto-detect Project ID from gcloud config

.EXAMPLE
  .\build-and-push.ps1 -ProjectId "my-project-123456"

.EXAMPLE
  .\build-and-push.ps1 -Tag "v1.0.0"
#>

param(
  [string]$ProjectId,
  [string]$Tag = "prod"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section($msg) { 
  Write-Host "`n============================================" -ForegroundColor Cyan
  Write-Host "  $msg" -ForegroundColor Cyan
  Write-Host "============================================`n" -ForegroundColor Cyan
}

function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Get script and repo directories
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

# Auto-detect Project ID if not provided
if (-not $ProjectId) {
  Write-Host "Detecting Project ID from gcloud config..." -ForegroundColor Cyan
  $ProjectId = gcloud config get-value project 2>$null
  if (-not $ProjectId) {
    Write-Error "No Project ID found! Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
  }
  Write-Success "Auto-detected Project ID: $ProjectId"
}

Write-Host "`n🚀 Building and Pushing Docker Images to GCR" -ForegroundColor Magenta
Write-Host "Project ID: $ProjectId" -ForegroundColor White
Write-Host "Tag: $Tag" -ForegroundColor White
Write-Host "Repo Root: $repoRoot`n" -ForegroundColor White

# Verify gcloud is installed
Write-Section "Verifying Prerequisites"
try {
  $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
  Write-Success "gcloud CLI: $gcloudVersion"
} catch {
  Write-Error "gcloud CLI not found! Please install: https://cloud.google.com/sdk/docs/install"
  exit 1
}

# Verify docker is installed
try {
  $dockerVersion = docker --version
  Write-Success "Docker: $dockerVersion"
} catch {
  Write-Error "Docker not found! Please install Docker Desktop"
  exit 1
}

# Configure Docker to use gcloud as credential helper
Write-Section "Configuring Docker for GCR"
Write-Info "Configuring gcloud Docker credential helper..."
gcloud auth configure-docker --quiet
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to configure Docker for GCR"
  exit 1
}
Write-Success "Docker configured for GCR"

# Enable Container Registry API
Write-Section "Enabling GCP APIs"
Write-Info "Enabling Container Registry API..."
gcloud services enable containerregistry.googleapis.com --project=$ProjectId
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to enable Container Registry API"
  exit 1
}
Write-Success "Container Registry API enabled"

# Build and push backend
Write-Section "Building Backend Image"
Set-Location "$repoRoot\backend"

Write-Info "Building backend Docker image..."
docker build -t apartment-backend:$Tag -f Dockerfile.prod .
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to build backend image"
  exit 1
}
Write-Success "Backend image built: apartment-backend:$Tag"

Write-Info "Tagging backend image for GCR..."
docker tag apartment-backend:$Tag gcr.io/$ProjectId/apartment-backend:$Tag
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to tag backend image"
  exit 1
}
Write-Success "Backend image tagged: gcr.io/$ProjectId/apartment-backend:$Tag"

Write-Info "Pushing backend image to GCR..."
docker push gcr.io/$ProjectId/apartment-backend:$Tag
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to push backend image"
  exit 1
}
Write-Success "Backend image pushed to GCR"

# Build and push frontend
Write-Section "Building Frontend Image"
Set-Location "$repoRoot\frontend"

# Backup current nginx config
$nginxProd = "nginx.prod.conf"
$nginxK8s = "nginx.k8s.conf"
$nginxBackup = "nginx.prod.conf.backup"

if (Test-Path $nginxK8s) {
  Write-Info "Swapping nginx config for Kubernetes..."
  if (Test-Path $nginxProd) {
    Copy-Item $nginxProd $nginxBackup -Force
  }
  Copy-Item $nginxK8s $nginxProd -Force
  Write-Success "Using nginx.k8s.conf for build"
}

Write-Info "Building frontend Docker image..."
docker build -t apartment-frontend:$Tag -f Dockerfile.prod .
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to build frontend image"
  # Restore nginx config
  if (Test-Path $nginxBackup) {
    Copy-Item $nginxBackup $nginxProd -Force
    Remove-Item $nginxBackup -Force
  }
  exit 1
}
Write-Success "Frontend image built: apartment-frontend:$Tag"

# Restore nginx config
if (Test-Path $nginxBackup) {
  Copy-Item $nginxBackup $nginxProd -Force
  Remove-Item $nginxBackup -Force
  Write-Success "Nginx config restored"
}

Write-Info "Tagging frontend image for GCR..."
docker tag apartment-frontend:$Tag gcr.io/$ProjectId/apartment-frontend:$Tag
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to tag frontend image"
  exit 1
}
Write-Success "Frontend image tagged: gcr.io/$ProjectId/apartment-frontend:$Tag"

Write-Info "Pushing frontend image to GCR..."
docker push gcr.io/$ProjectId/apartment-frontend:$Tag
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to push frontend image"
  exit 1
}
Write-Success "Frontend image pushed to GCR"

# Return to k8s-gcp directory
Set-Location $scriptDir

Write-Section "Build and Push Complete!"
Write-Host "Images successfully pushed to Google Container Registry:`n" -ForegroundColor Green
Write-Host "  Backend:  gcr.io/$ProjectId/apartment-backend:$Tag" -ForegroundColor White
Write-Host "  Frontend: gcr.io/$ProjectId/apartment-frontend:$Tag`n" -ForegroundColor White

Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "  .\deploy.ps1 -ProjectId `"$ProjectId`"`n" -ForegroundColor Cyan
Write-Host "Note: deploy.ps1 will handle everything (HTTP to HTTPS, DNS setup, etc.)" -ForegroundColor Gray


