<#
.SYNOPSIS
  Production-safe update script for backend and frontend applications.

.DESCRIPTION
  Updates backend and frontend in Kubernetes without touching the database:
    1. Rebuilds Docker images (backend + frontend)
    2. Applies updated deployment manifests
    3. Performs rolling restart to pick new images
    4. Waits for rollouts to complete
    5. Validates health endpoints

  Use this for code changes, config updates, or dependency upgrades.
  Database schema migrations should be handled separately.

.PARAMETER SkipBuild
  Skip image rebuild; only update Kubernetes manifests and restart.

.PARAMETER SkipHealthCheck
  Skip post-deployment health validation.

.PARAMETER Namespace
  Target Kubernetes namespace (default: superproject-ns).

.EXAMPLE
  .\update.ps1
  # Full update: rebuild images, deploy, validate

.EXAMPLE
  .\update.ps1 -SkipBuild
  # Fast update: only apply manifests and restart (no rebuild)

.NOTES
  Requires kubectl configured and Docker running.
  Designed for Windows PowerShell 5.1+.
#>

param(
  [switch]$SkipBuild,
  [switch]$SkipHealthCheck,
  [string]$Namespace = 'superproject-ns'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$startTime = Get-Date

Write-Host "`n=== Production Update Script ===" -ForegroundColor Cyan
Write-Host "Target namespace: $Namespace" -ForegroundColor White
Write-Host "Skip build: $SkipBuild" -ForegroundColor White
Write-Host ""

# ============================================
# Step 1: Build Images (optional)
# ============================================
if (-not $SkipBuild) {
  Write-Host "`n=== Building Docker images ===" -ForegroundColor Cyan
  $buildScript = Join-Path $scriptDir 'build-images.ps1'
  
  if (-not (Test-Path $buildScript)) {
    Write-Host "[ERROR] build-images.ps1 not found. Cannot rebuild images." -ForegroundColor Red
    exit 1
  }

  try {
    & $buildScript
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[ERROR] Image build failed with exit code $LASTEXITCODE" -ForegroundColor Red
      exit 1
    }
    Set-Location $scriptDir  # Return to k8s folder
    Write-Host "[SUCCESS] Images built successfully" -ForegroundColor Green
  }
  catch {
    Write-Host "[ERROR] Image build failed: $_" -ForegroundColor Red
    exit 1
  }
}
else {
  Write-Host "[INFO] Skipping image build (using existing images)" -ForegroundColor Yellow
}

# ============================================
# Step 2: Update Backend
# ============================================
Write-Host "`n=== Updating Backend ===" -ForegroundColor Cyan

try {
  kubectl apply -n $Namespace -f .\backend\service.yaml | Write-Host
  kubectl apply -n $Namespace -f .\backend\deployment.yaml | Write-Host
  
  Write-Host "- Restarting backend deployment..." -ForegroundColor DarkCyan
  kubectl rollout restart deployment/backend -n $Namespace | Write-Host
  
  Write-Host "- Waiting for backend rollout to complete..." -ForegroundColor DarkCyan
  kubectl rollout status deployment/backend -n $Namespace --timeout=300s | Write-Host
  
  Write-Host "[SUCCESS] Backend updated successfully" -ForegroundColor Green
}
catch {
  Write-Host "[ERROR] Backend update failed: $_" -ForegroundColor Red
  Write-Host "[INFO] Consider manual rollback: kubectl rollout undo deployment/backend -n $Namespace" -ForegroundColor Yellow
  exit 1
}

# ============================================
# Step 3: Update Frontend
# ============================================
Write-Host "`n=== Updating Frontend ===" -ForegroundColor Cyan

try {
  kubectl apply -n $Namespace -f .\frontend\service.yaml | Write-Host
  kubectl apply -n $Namespace -f .\frontend\deployment.yaml | Write-Host
  
  Write-Host "- Restarting frontend deployment..." -ForegroundColor DarkCyan
  kubectl rollout restart deployment/frontend -n $Namespace | Write-Host
  
  Write-Host "- Waiting for frontend rollout to complete..." -ForegroundColor DarkCyan
  kubectl rollout status deployment/frontend -n $Namespace --timeout=300s | Write-Host
  
  Write-Host "[SUCCESS] Frontend updated successfully" -ForegroundColor Green
}
catch {
  Write-Host "[ERROR] Frontend update failed: $_" -ForegroundColor Red
  Write-Host "[INFO] Consider manual rollback: kubectl rollout undo deployment/frontend -n $Namespace" -ForegroundColor Yellow
  exit 1
}

# ============================================
# Step 4: Refresh Ingress (optional)
# ============================================
Write-Host "`n=== Refreshing Ingress ===" -ForegroundColor Cyan

$ingressPath = Join-Path $scriptDir 'ingress\ingress.yaml'
if (Test-Path $ingressPath) {
  try {
    kubectl apply -n $Namespace -f $ingressPath | Write-Host
    Write-Host "[SUCCESS] Ingress refreshed" -ForegroundColor Green
  }
  catch {
    Write-Host "[WARN] Ingress update failed (non-critical): $_" -ForegroundColor Yellow
  }
}
else {
  Write-Host "[WARN] Ingress manifest not found; skipping ingress refresh" -ForegroundColor Yellow
}

# ============================================
# Step 5: Verify Deployment Status
# ============================================
Write-Host "`n=== Deployment Status ===" -ForegroundColor Cyan

kubectl get pods -n $Namespace -o wide
Write-Host ""
kubectl get svc -n $Namespace
Write-Host ""
kubectl get ingress -n $Namespace 2>$null

# ============================================
# Step 6: Health Checks
# ============================================
if (-not $SkipHealthCheck) {
  Write-Host "`n=== Health Validation ===" -ForegroundColor Cyan
  
  Start-Sleep -Seconds 5  # Allow services to stabilize
  
  $healthFailed = $false
  
  # Check backend health via Ingress or NodePort
  try {
    $healthUrl = "http://localhost/api/health"
    Write-Host "- Checking backend health at $healthUrl" -ForegroundColor DarkCyan
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15 -Method Get
    
    if ($response.StatusCode -eq 200) {
      Write-Host "[SUCCESS] Backend health check PASSED (200 OK)" -ForegroundColor Green
      $healthData = $response.Content | ConvertFrom-Json
      Write-Host "  Service: $($healthData.service)" -ForegroundColor DarkGray
      Write-Host "  Status: $($healthData.status)" -ForegroundColor DarkGray
    }
    else {
      Write-Host "[WARN] Backend health check returned status $($response.StatusCode)" -ForegroundColor Yellow
      $healthFailed = $true
    }
  }
  catch {
    Write-Host "[WARN] Backend health check failed: $_" -ForegroundColor Yellow
    Write-Host "  Trying NodePort fallback (30080)..." -ForegroundColor DarkGray
    
    try {
      $fallbackUrl = "http://localhost:30080/api/health"
      $response = Invoke-WebRequest -Uri $fallbackUrl -UseBasicParsing -TimeoutSec 10 -Method Get
      if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Backend health check PASSED via NodePort" -ForegroundColor Green
      }
      else {
        $healthFailed = $true
      }
    }
    catch {
      Write-Host "[ERROR] Backend is not responding to health checks" -ForegroundColor Red
      $healthFailed = $true
    }
  }
  
  # Check frontend availability
  try {
    $frontendUrl = "http://localhost/"
    Write-Host "- Checking frontend at $frontendUrl" -ForegroundColor DarkCyan
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10 -Method Get
    
    if ($response.StatusCode -eq 200) {
      Write-Host "[SUCCESS] Frontend health check PASSED (200 OK)" -ForegroundColor Green
    }
    else {
      Write-Host "[WARN] Frontend returned status $($response.StatusCode)" -ForegroundColor Yellow
      $healthFailed = $true
    }
  }
  catch {
    Write-Host "[WARN] Frontend health check failed: $_" -ForegroundColor Yellow
    $healthFailed = $true
  }
  
  if ($healthFailed) {
    Write-Host "`n=== Health Check Summary ===" -ForegroundColor Cyan
    Write-Host "[ERROR] One or more health checks FAILED" -ForegroundColor Red
    Write-Host "[WARN] Application may not be fully operational" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Rollback commands:" -ForegroundColor Yellow
    Write-Host "  kubectl rollout undo deployment/backend -n $Namespace" -ForegroundColor White
    Write-Host "  kubectl rollout undo deployment/frontend -n $Namespace" -ForegroundColor White
    Write-Host ""
    exit 1
  }
}
else {
  Write-Host "[INFO] Skipping health checks (use without -SkipHealthCheck to enable)" -ForegroundColor Yellow
}

# ============================================
# Summary
# ============================================
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n=== Update Complete ===" -ForegroundColor Cyan
Write-Host "[SUCCESS] Backend and frontend updated successfully!" -ForegroundColor Green
Write-Host "Duration: $($duration.TotalSeconds) seconds" -ForegroundColor White
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost/" -ForegroundColor Green
Write-Host "  API health: http://localhost/api/health" -ForegroundColor Green
Write-Host "  Login: http://localhost/login" -ForegroundColor Green
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor DarkGray
Write-Host "  Username: admin" -ForegroundColor DarkGray
Write-Host "  Password: admin123" -ForegroundColor DarkGray
Write-Host ""
