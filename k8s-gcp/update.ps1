<#
.SYNOPSIS
  Update all components in GKE with Cloud Build + Rollout Restart

.DESCRIPTION
  Rebuilds images using Cloud Build, then forces rollout restart

.PARAMETER ProjectId
  GCP Project ID (optional - auto-detected from gcloud if not provided)

.PARAMETER Tag
  Image tag (default: "prod")

.EXAMPLE
  .\update.ps1

.EXAMPLE
  .\update.ps1 -Tag "v1.0.1"
#>

param(
  [string]$ProjectId,
  [string]$Tag = "prod",
  [string]$Namespace = "beliv-apartment"
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

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

# Auto-detect Project ID if not provided
if (-not $ProjectId) {
  Write-Host "Detecting Project ID from gcloud config..." -ForegroundColor Cyan
  $ProjectId = gcloud config get-value project 2>$null
  if (-not $ProjectId) {
    Write-Host "[ERROR] No Project ID found! Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
  }
  Write-Success "Auto-detected Project ID: $ProjectId"
}

Write-Host "`n🔄 GKE Update - Build & Rollout" -ForegroundColor Magenta
Write-Host "Project: $ProjectId" -ForegroundColor Gray
Write-Host "Namespace: $Namespace" -ForegroundColor Gray
Write-Host "Tag: $Tag" -ForegroundColor Gray
Write-Host "Action: Build images + Rollout restart`n" -ForegroundColor Gray

# ============================================
# STEP 1: Build Images with Cloud Build
# ============================================
Write-Section "Step 1: Building Docker Images (Cloud Build)"

try {
    & "$scriptDir\cloud-build.ps1" -ProjectId $ProjectId -Tag $Tag
    Write-Success "Images built and pushed successfully"
} catch {
    Write-Host "[ERROR] Failed to build images: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 2: Update Image References
# ============================================
Write-Section "Step 2: Updating Image Paths"

$backendDeployment = "$scriptDir\backend\deployment.yaml"
$frontendDeployment = "$scriptDir\frontend\deployment.yaml"

(Get-Content $backendDeployment) -replace 'image: .*apartment-backend:.*', "image: gcr.io/$ProjectId/apartment-backend:$Tag" | Set-Content $backendDeployment
(Get-Content $frontendDeployment) -replace 'image: .*apartment-frontend:.*', "image: gcr.io/$ProjectId/apartment-frontend:$Tag" | Set-Content $frontendDeployment

Write-Success "Images updated to gcr.io/$ProjectId"

# ============================================
# STEP 3: Apply Deployments
# ============================================
Write-Section "Step 3: Applying Updated Deployments"

kubectl apply -f $backendDeployment | Out-Null
kubectl apply -f $frontendDeployment | Out-Null

Write-Success "Deployments applied"

# ============================================
# STEP 4: Force Rollout Restart
# ============================================
Write-Section "Step 4: Rolling Out New Pods"

Write-Info "Restarting backend deployment..."
kubectl rollout restart deployment/backend -n $Namespace | Out-Null

Write-Info "Restarting frontend deployment..."
kubectl rollout restart deployment/frontend -n $Namespace | Out-Null

Write-Success "Rollout initiated"

# ============================================
# STEP 5: Monitor Rollout Status
# ============================================
Write-Section "Step 5: Monitoring Rollout Progress"

Write-Info "Waiting for backend rollout..."
kubectl rollout status deployment/backend -n $Namespace --timeout=5m

Write-Info "Waiting for frontend rollout..."
kubectl rollout status deployment/frontend -n $Namespace --timeout=5m

Write-Success "All deployments updated successfully"

# ============================================
# STEP 6: Verification
# ============================================
Write-Section "Deployment Status"

Write-Info "Current pods:"
kubectl get pods -n $Namespace

Write-Host "`nDeployment images:" -ForegroundColor Yellow
Write-Host "Backend:  " -NoNewline -ForegroundColor Gray
kubectl get deployment backend -n $Namespace -o jsonpath='{.spec.template.spec.containers[0].image}'
Write-Host ""
Write-Host "Frontend: " -NoNewline -ForegroundColor Gray
kubectl get deployment frontend -n $Namespace -o jsonpath='{.spec.template.spec.containers[0].image}'
Write-Host "`n"

# ============================================
# Complete
# ============================================
Write-Section "Update Complete!"

Write-Host "Images rebuilt on Cloud Build" -ForegroundColor Green
Write-Host "Pods restarted with new images" -ForegroundColor Green
Write-Host "Rollout completed successfully`n" -ForegroundColor Green

Write-Host "Application URL: https://beliv.pipatpongpri.dev" -ForegroundColor Cyan
Write-Host "`nUseful commands:" -ForegroundColor Gray
Write-Host "  kubectl get pods -n $Namespace" -ForegroundColor Gray
Write-Host "  kubectl logs -n $Namespace deployment/backend -f" -ForegroundColor Gray
Write-Host "  kubectl logs -n $Namespace deployment/frontend -f" -ForegroundColor Gray
Write-Host "  kubectl describe pod -n $Namespace <pod-name>`n" -ForegroundColor Gray
