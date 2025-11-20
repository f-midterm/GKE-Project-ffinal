<#
.SYNOPSIS
  Complete cleanup script for Kubernetes deployment.

.DESCRIPTION
  Removes all application resources from Kubernetes in the correct order:
    1. Ingress rules
    2. Frontend deployment and service
    3. Backend deployment and service
    4. MySQL StatefulSet, service, PVC, and ConfigMap
    5. Secrets
    6. Namespace (optional)

.PARAMETER KeepNamespace
  Keep the namespace instead of deleting it.

.PARAMETER KeepPVC
  Keep the PersistentVolumeClaim (preserves database data).

.PARAMETER Namespace
  Target Kubernetes namespace (default: superproject-ns).

.EXAMPLE
  .\delete_deploy.ps1
  # Full cleanup including namespace

.EXAMPLE
  .\delete_deploy.ps1 -KeepNamespace
  # Clean all resources but keep the namespace

.EXAMPLE
  .\delete_deploy.ps1 -KeepPVC
  # Keep database PVC (data persists for next deployment)

.NOTES
  Requires kubectl configured.
  Designed for Windows PowerShell 5.1+.
#>

param(
  [switch]$KeepNamespace,
  [switch]$KeepPVC,
  [string]$Namespace = 'superproject-ns'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'  # Continue on errors to clean as much as possible

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n=== Kubernetes Cleanup Script ===" -ForegroundColor Cyan
Write-Host "Namespace: $Namespace" -ForegroundColor White
Write-Host "Keep namespace: $KeepNamespace" -ForegroundColor White
Write-Host "Keep PVC: $KeepPVC" -ForegroundColor White
Write-Host ""

# Confirm deletion
$confirmation = Read-Host "This will delete all application resources in namespace '$Namespace'. Continue? (yes/no)"
if ($confirmation -ne 'yes') {
    Write-Host "[INFO] Cleanup cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host "`n=== Step 1: Delete Ingress ===" -ForegroundColor Cyan
kubectl delete ingress --all -n $Namespace --ignore-not-found
Start-Sleep -Seconds 2

Write-Host "`n=== Step 2: Delete Frontend ===" -ForegroundColor Cyan
kubectl delete deployment frontend -n $Namespace --ignore-not-found
kubectl delete service frontend-service -n $Namespace --ignore-not-found
Start-Sleep -Seconds 2

Write-Host "`n=== Step 3: Delete Backend ===" -ForegroundColor Cyan
kubectl delete deployment backend -n $Namespace --ignore-not-found
kubectl delete service backend-service -n $Namespace --ignore-not-found
Start-Sleep -Seconds 2

Write-Host "`n=== Step 4: Delete MySQL ===" -ForegroundColor Cyan
kubectl delete statefulset mysql -n $Namespace --ignore-not-found
kubectl delete service mysql-service -n $Namespace --ignore-not-found
kubectl delete configmap mysql-init-cm -n $Namespace --ignore-not-found

if (-not $KeepPVC) {
    Write-Host "- Deleting PersistentVolumeClaim (database data will be lost)..." -ForegroundColor Yellow
    kubectl delete pvc mysql-pvc -n $Namespace --ignore-not-found
} else {
    Write-Host "[INFO] Keeping PVC mysql-pvc (database data preserved)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

Write-Host "`n=== Step 5: Delete Secrets ===" -ForegroundColor Cyan
kubectl delete secret mysql-secret -n $Namespace --ignore-not-found
Start-Sleep -Seconds 2

if (-not $KeepNamespace) {
    Write-Host "`n=== Step 6: Delete Namespace ===" -ForegroundColor Cyan
    kubectl delete namespace $Namespace --ignore-not-found
    Write-Host "[SUCCESS] Namespace '$Namespace' deleted" -ForegroundColor Green
} else {
    Write-Host "`n[INFO] Keeping namespace '$Namespace'" -ForegroundColor Yellow
}

Write-Host "`n=== Cleanup Status ===" -ForegroundColor Cyan
if (-not $KeepNamespace) {
    Write-Host "[INFO] Namespace deleted. All resources removed." -ForegroundColor Green
} else {
    kubectl get all -n $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        kubectl get pvc -n $Namespace 2>$null
    }
}

Write-Host "`n=== Cleanup Complete ===" -ForegroundColor Cyan
Write-Host "[SUCCESS] All requested resources have been removed!" -ForegroundColor Green
Write-Host ""
Write-Host "To redeploy:" -ForegroundColor Yellow
Write-Host "  cd k8s" -ForegroundColor White
Write-Host "  .\deploy.ps1" -ForegroundColor White
Write-Host ""
