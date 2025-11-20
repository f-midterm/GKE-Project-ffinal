<#!
.SYNOPSIS
  Build local Docker images for backend and frontend used by Kubernetes manifests.

.DESCRIPTION
  Builds the images with tags:
    - apartment-backend:prod
    - apartment-frontend:prod

  For the frontend, this script temporarily swaps nginx.prod.conf with nginx.k8s.conf
  so the container proxies /api to the Kubernetes backend service (backend-service:8080).

.NOTES
  Requires Docker Desktop running. Designed for Windows PowerShell 5.1.
#>

param(
  [switch]$NoFrontendSwap
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# Resolve repo root (parent of k8s)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Split-Path -Parent $scriptDir
Set-Location $repoRoot

Write-Section "Repository root: $repoRoot"

# Verify Docker is available
try {
  docker version | Out-Null
} catch {
  Write-Error "Docker does not appear to be running or accessible. Please start Docker Desktop and retry."
}

# --- Build backend ---
Write-Section "Building backend image (apartment-backend:prod)"
docker build `
  -t apartment-backend:prod `
  -f "$repoRoot/backend/Dockerfile.prod" `
  "$repoRoot/backend"

# --- Build frontend ---
Write-Section "Building frontend image (apartment-frontend:prod)"
$frontendDir = Join-Path $repoRoot 'frontend'
$prodConf = Join-Path $frontendDir 'nginx.prod.conf'
$k8sConf = Join-Path $frontendDir 'nginx.k8s.conf'
$backupConf = Join-Path $frontendDir 'nginx.prod.conf.bak'

if (-not $NoFrontendSwap) {
  if (-not (Test-Path $k8sConf)) {
    Write-Warning "K8s Nginx config not found at $k8sConf. Proceeding without swap."
  } else {
    Write-Host "Temporarily swapping nginx.prod.conf -> nginx.k8s.conf for K8s build" -ForegroundColor Yellow
    if (Test-Path $backupConf) { Remove-Item $backupConf -Force }
    Copy-Item $prodConf $backupConf -Force
    Copy-Item $k8sConf $prodConf -Force
  }
}

try {
  docker build `
    -t apartment-frontend:prod `
    -f "$repoRoot/frontend/Dockerfile.prod" `
    "$repoRoot/frontend"
}
finally {
  if (-not $NoFrontendSwap -and (Test-Path $backupConf)) {
    Write-Host "Restoring original nginx.prod.conf" -ForegroundColor Yellow
    Move-Item $backupConf $prodConf -Force
  }
}

Write-Section "Build complete"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Select-String -Pattern "apartment-"

Write-Host "`n[SUCCESS] Images ready for Kubernetes deployment!" -ForegroundColor Green
Write-Host "Backend:  apartment-backend:prod" -ForegroundColor Cyan
Write-Host "Frontend: apartment-frontend:prod (with K8s Nginx config)" -ForegroundColor Cyan
Write-Host "`nDocker Desktop K8s uses the local daemon - images are already available." -ForegroundColor Yellow
