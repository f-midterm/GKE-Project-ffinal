<#
.SYNOPSIS
  Build Docker images using Google Cloud Build (no local Docker needed!)

.DESCRIPTION
  Uses Cloud Build to build and push images to GCR
  Advantages:
  - No Docker Desktop required
  - Faster builds (runs on GCP)
  - Better for CI/CD

.PARAMETER ProjectId
  GCP Project ID (optional - auto-detected from gcloud if not provided)

.PARAMETER Tag
  Image tag (default: "prod")

.EXAMPLE
  .\cloud-build.ps1

.EXAMPLE
  .\cloud-build.ps1 -Tag "v1.0.0"
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

Write-Host "`n`[Cloud Build`] Building Docker Images on GCP" -ForegroundColor Magenta
Write-Host "Project ID: $ProjectId" -ForegroundColor White
Write-Host "Tag: $Tag" -ForegroundColor White
Write-Host "Note: No local Docker required!`n" -ForegroundColor Gray

# Enable Cloud Build API
Write-Section "Enabling GCP APIs"
Write-Info "Enabling Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com --project=$ProjectId
gcloud services enable containerregistry.googleapis.com --project=$ProjectId
Write-Success "APIs enabled"

# Build backend
Write-Section "Building Backend (Cloud Build)"
Set-Location "$repoRoot\backend"

Write-Info "Submitting backend build to Cloud Build..."
gcloud builds submit --project=$ProjectId `
  --config=cloudbuild.yaml `
  --substitutions=TAG_NAME=$Tag `
  --timeout=15m

if ($LASTEXITCODE -ne 0) {
  Write-Error "Backend build failed"
  exit 1
}
Write-Success "Backend image built and pushed: gcr.io/$ProjectId/apartment-backend:$Tag"

# Build frontend
Write-Section "Building Frontend (Cloud Build)"
Set-Location "$repoRoot\frontend"

Write-Info "Submitting frontend build to Cloud Build..."
gcloud builds submit --project=$ProjectId `
  --config=cloudbuild.yaml `
  --substitutions=TAG_NAME=$Tag `
  --timeout=15m

if ($LASTEXITCODE -ne 0) {
  Write-Error "Frontend build failed"
  exit 1
}
Write-Success "Frontend image built and pushed: gcr.io/$ProjectId/apartment-frontend:$Tag"

# Return to k8s-gcp directory
Set-Location $scriptDir

Write-Section "Cloud Build Complete!"
Write-Host "Images successfully built and pushed to GCR:`n" -ForegroundColor Green
Write-Host "  Backend:  gcr.io/$ProjectId/apartment-backend:$Tag" -ForegroundColor White
Write-Host "  Frontend: gcr.io/$ProjectId/apartment-frontend:$Tag`n" -ForegroundColor White

Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "  .\deploy.ps1`n" -ForegroundColor Cyan
