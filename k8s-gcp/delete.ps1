<#
.SYNOPSIS
  Delete all application resources from GKE

.DESCRIPTION
  Removes namespace and all resources inside it

.EXAMPLE
  .\delete.ps1
#>

param(
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Namespace = "beliv-apartment"

function Write-Section($msg) { 
  Write-Host "`n============================================" -ForegroundColor Cyan
  Write-Host "  $msg" -ForegroundColor Cyan
  Write-Host "============================================`n" -ForegroundColor Cyan
}

function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Yellow }

Write-Host "`n[DELETE] Deleting GKE Resources" -ForegroundColor Red
Write-Host "Namespace: $Namespace`n" -ForegroundColor White

if (-not $Force) {
  $confirmation = Read-Host "Delete everything in namespace '$Namespace'? (yes/no)"
  if ($confirmation -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
  }
}

Write-Section "Deleting Namespace (this deletes everything inside)"
Write-Info "Deleting namespace $Namespace..."
kubectl delete namespace $Namespace --ignore-not-found=true

Write-Info "Waiting for namespace deletion..."
$timeout = 120
$elapsed = 0
while ($elapsed -lt $timeout) {
  $nsExists = kubectl get namespace $Namespace 2>&1
  if ($nsExists -match "NotFound" -or $LASTEXITCODE -ne 0) {
    break
  }
  Start-Sleep -Seconds 5
  $elapsed += 5
  Write-Host "  Still deleting... $elapsed seconds" -ForegroundColor Gray
}

$finalCheck = kubectl get namespace $Namespace 2>&1
if ($finalCheck -match "NotFound") {
  Write-Success "Namespace deleted"
} else {
  Write-Host "[WARNING] Namespace still exists (may take a few more minutes)" -ForegroundColor Yellow
}

Write-Section "Cleanup Complete!"
Write-Host "All application resources deleted`n" -ForegroundColor Green

Write-Host "Note: The following were NOT deleted:" -ForegroundColor Yellow
Write-Host "  - GKE Cluster itself" -ForegroundColor Gray
Write-Host "  - Container images in GCR" -ForegroundColor Gray
Write-Host "  - External IP address (will be released automatically)`n" -ForegroundColor Gray
