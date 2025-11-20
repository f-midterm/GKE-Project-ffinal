<#
.SYNOPSIS
  One-command deployment to GKE with Static IP and HTTPS

.DESCRIPTION
  Deploys apartment management system to GKE with:
  - Static IP (beliv-ip)
  - Managed Certificate (beliv-cert)
  - HTTPS Ingress
  
  Prerequisites:
  1. Create Static IP first: gcloud compute addresses create beliv-ip --global
  2. Configure DNS A record: beliv.pipatpongpri.dev -> [Static IP]

.PARAMETER ProjectId
  GCP Project ID (optional - auto-detected from gcloud if not provided)

.PARAMETER BuildImages
  Build and push Docker images before deploying (default: false)
  If false, uses existing images in GCR

.PARAMETER UseCloudBuild
  Use Cloud Build instead of local Docker (no Docker Desktop needed)
  Only works when -BuildImages is also specified

.EXAMPLE
  .\deploy.ps1
  # Deploy only (uses existing images)
  
.EXAMPLE
  .\deploy.ps1 -BuildImages
  # Build images locally (requires Docker Desktop), then deploy
  
.EXAMPLE
  .\deploy.ps1 -BuildImages -UseCloudBuild
  # Build images on GCP Cloud Build (no Docker Desktop needed), then deploy
  
.EXAMPLE
  .\deploy.ps1 -ProjectId "my-project-123456" -BuildImages
#>

param(
  [string]$ProjectId,
  [switch]$BuildImages,
  [switch]$UseCloudBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Domain = "beliv.pipatpongpri.dev"
$Namespace = "beliv-apartment"
$StaticIPName = "beliv-ip"

function Write-Section($msg) { 
  Write-Host "`n============================================" -ForegroundColor Cyan
  Write-Host "  $msg" -ForegroundColor Cyan
  Write-Host "============================================`n" -ForegroundColor Cyan
}

function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

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

Write-Host "`n🚀 GKE Deployment with Static IP & HTTPS" -ForegroundColor Magenta
Write-Host "Project: $ProjectId" -ForegroundColor White
Write-Host "Domain: $Domain" -ForegroundColor White
Write-Host "Static IP: $StaticIPName" -ForegroundColor White
if ($BuildImages) {
  if ($UseCloudBuild) {
    Write-Host "Build Images: Yes (Cloud Build - no Docker Desktop needed)`n" -ForegroundColor Yellow
  } else {
    Write-Host "Build Images: Yes (Local Docker - requires Docker Desktop)`n" -ForegroundColor Yellow
  }
} else {
  Write-Host "Build Images: No (using existing images)`n" -ForegroundColor Gray
}

# Build and push images if requested
if ($BuildImages) {
  Write-Section "Step 0: Building and Pushing Docker Images"
  
  if ($UseCloudBuild) {
    $buildScript = Join-Path $scriptDir "cloud-build.ps1"
    if (Test-Path $buildScript) {
      Write-Info "Running cloud-build.ps1 (no Docker Desktop needed)..."
      & $buildScript -ProjectId $ProjectId
      if ($LASTEXITCODE -ne 0) {
        Write-Error "Cloud Build failed!"
        exit 1
      }
      Write-Success "Images built on Cloud Build and pushed successfully"
    } else {
      Write-Error "cloud-build.ps1 not found at: $buildScript"
      exit 1
    }
  } else {
    $buildScript = Join-Path $scriptDir "build-and-push.ps1"
    if (Test-Path $buildScript) {
      Write-Info "Running build-and-push.ps1 (requires Docker Desktop)..."
      & $buildScript -ProjectId $ProjectId
      if ($LASTEXITCODE -ne 0) {
        Write-Error "Image build/push failed!"
        Write-Host "`nTip: If Docker is not running, use:" -ForegroundColor Yellow
        Write-Host "  .\deploy.ps1 -BuildImages -UseCloudBuild`n" -ForegroundColor Cyan
        exit 1
      }
      Write-Success "Images built and pushed successfully"
    } else {
      Write-Error "build-and-push.ps1 not found at: $buildScript"
      exit 1
    }
  }
}

# Check Static IP exists
Write-Section "Step 1: Verifying Static IP"
$ipAddress = gcloud compute addresses describe $StaticIPName --global --format="value(address)" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Static IP '$StaticIPName' not found!"
  Write-Host "`nCreate it first:" -ForegroundColor Yellow
  Write-Host "  gcloud compute addresses create $StaticIPName --global" -ForegroundColor Cyan
  Write-Host "`nThen configure DNS A record:" -ForegroundColor Yellow
  Write-Host "  $Domain -> [IP from above command]`n" -ForegroundColor Cyan
  exit 1
}
Write-Success "Static IP found: $ipAddress"

# Verify DNS
Write-Info "Checking DNS configuration..."
try {
  $resolvedIP = [System.Net.Dns]::GetHostAddresses($Domain)[0].IPAddressToString
  if ($resolvedIP -eq $ipAddress) {
    Write-Success "DNS correctly points to $ipAddress"
  } else {
    Write-Host "⚠️  DNS points to $resolvedIP instead of $ipAddress" -ForegroundColor Yellow
    Write-Host "   Update your DNS A record before certificate will work" -ForegroundColor Gray
  }
} catch {
  Write-Host "⚠️  DNS not configured yet" -ForegroundColor Yellow
  Write-Host "   Add A record: $Domain -> $ipAddress" -ForegroundColor Gray
}

# Verify kubectl
Write-Section "Step 2: Verifying Kubernetes Connection"
try {
  $clusterInfo = kubectl cluster-info 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Not connected" }
  Write-Success "Connected to GKE cluster"
} catch {
  Write-Error "Not connected to GKE!"
  Write-Host "Run: gcloud container clusters get-credentials CLUSTER_NAME --region REGION" -ForegroundColor Yellow
  exit 1
}

# Verify kubectl
Write-Section "Step 2: Verifying Kubernetes Connection"
try {
  $clusterInfo = kubectl cluster-info 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Not connected" }
  Write-Success "Connected to GKE cluster"
} catch {
  Write-Error "Not connected to GKE!"
  Write-Host "Run: gcloud container clusters get-credentials CLUSTER_NAME --region REGION" -ForegroundColor Yellow
  exit 1
}

# Update image paths
Write-Section "Step 3: Updating Image Paths"
$frontendDeploy = "$scriptDir\frontend\deployment.yaml"
$backendDeploy = "$scriptDir\backend\deployment.yaml"

(Get-Content $frontendDeploy) -replace 'gcr.io/[^/]+/', "gcr.io/$ProjectId/" | Set-Content $frontendDeploy
(Get-Content $backendDeploy) -replace 'gcr.io/[^/]+/', "gcr.io/$ProjectId/" | Set-Content $backendDeploy
Write-Success "Images updated to gcr.io/$ProjectId"

# Create namespace
Write-Section "Step 3: Creating Namespace"
kubectl apply -f "$scriptDir\namespace.yaml" | Out-Null
Write-Success "Namespace ready"

# Deploy database
Write-Section "Step 4: Deploying Database"
kubectl apply -f "$scriptDir\database\" | Out-Null
Write-Info "Waiting for MySQL pod..."
kubectl wait --for=condition=ready pod -l component=database -n $Namespace --timeout=300s | Out-Null
Write-Success "Database ready"

# Deploy backend
Write-Section "Step 5: Deploying Backend"
kubectl apply -f "$scriptDir\backend\configmap.yaml" | Out-Null
kubectl apply -f "$scriptDir\backend\secret.yaml" | Out-Null
kubectl apply -f "$scriptDir\backend\pvc.yaml" | Out-Null
kubectl apply -f "$scriptDir\backend\backendconfig.yaml" | Out-Null
kubectl apply -f "$scriptDir\backend\service.yaml" | Out-Null
kubectl apply -f "$scriptDir\backend\deployment.yaml" | Out-Null
Write-Info "Waiting for backend pods..."
kubectl wait --for=condition=ready pod -l component=backend -n $Namespace --timeout=300s | Out-Null
Write-Success "Backend ready"

# Deploy frontend
Write-Section "Step 6: Deploying Frontend"
kubectl apply -f "$scriptDir\frontend\" | Out-Null
Write-Info "Waiting for frontend pods..."
kubectl wait --for=condition=ready pod -l component=frontend -n $Namespace --timeout=300s | Out-Null
Write-Success "Frontend ready"

# Deploy Certificate
Write-Section "Step 7: Creating Managed Certificate"
kubectl apply -f "$scriptDir\ingress\certificate.yaml" | Out-Null
Write-Success "Certificate created (will provision in 15-60 minutes)"

# Deploy Ingress with HTTPS
Write-Section "Step 8: Deploying HTTPS Ingress"
kubectl apply -f "$scriptDir\ingress\ingress.yaml" | Out-Null
Write-Success "Ingress deployed with Static IP and Certificate"

# Check status
Write-Section "Deployment Status"
Write-Host "Checking Ingress IP..." -ForegroundColor Gray
Start-Sleep -Seconds 5
$ingressIP = kubectl get ingress apartment-ingress -n $Namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null

if ($ingressIP -eq $ipAddress) {
  Write-Success "Ingress using Static IP: $ipAddress"
} else {
  Write-Info "Ingress IP: $ingressIP (may take a moment to show correct IP)"
}

$certStatus = kubectl get managedcertificate beliv-cert -n $Namespace -o jsonpath='{.status.certificateStatus}' 2>$null
Write-Info "Certificate Status: $certStatus"

Write-Section "Deployment Complete!"
Write-Host "Application URL: https://$Domain" -ForegroundColor Cyan
Write-Host "Static IP: $ipAddress`n" -ForegroundColor White

if ($certStatus -ne "Active") {
  Write-Host "Certificate is provisioning (15-60 minutes)" -ForegroundColor Yellow
  Write-Host "Check status:" -ForegroundColor White
  Write-Host "  kubectl describe managedcertificate beliv-cert -n $Namespace`n" -ForegroundColor Gray
}

Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  kubectl get pods -n $Namespace" -ForegroundColor Gray
Write-Host "  kubectl get ingress -n $Namespace" -ForegroundColor Gray
Write-Host "  kubectl get managedcertificate -n $Namespace" -ForegroundColor Gray
Write-Host "  kubectl logs -n $Namespace deployment/backend -f`n" -ForegroundColor Gray


