# Delete Monitoring Stack (PowerShell Version)
#
# Usage:
#   .\delete-monitoring.ps1 [OPTIONS]
#
# Options:
#   -Namespace <name>     Target namespace (default: superproject-ns)
#   -DeletePVCs           Also delete PersistentVolumeClaims (data will be lost!)
#   -DeleteNamespace      Also delete the namespace
#   -Force                Skip confirmation prompts

param(
    [string]$Namespace = "superproject-ns",
    [switch]$DeletePVCs,
    [switch]$DeleteNamespace,
    [switch]$Force
)

# Configuration
$ReleaseName = "monitoring"
$HelmCommand = if (Test-Path ".\helm.exe") { ".\helm.exe" } else { "helm" }

# Color functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-TestError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-InfoMessage {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

# Check if kubectl is configured
function Test-Kubectl {
    try {
        $null = kubectl cluster-info 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {}
    
    Write-TestError "kubectl is not configured or cluster is not reachable!"
    return $false
}

# Confirm deletion
function Confirm-Deletion {
    if ($Force) {
        return $true
    }
    
    Write-Host ""
    Write-Warning "You are about to delete the monitoring stack from namespace: $Namespace"
    if ($DeletePVCs) {
        Write-Warning "PersistentVolumeClaims will also be deleted (DATA LOSS!)"
    }
    if ($DeleteNamespace) {
        Write-Warning "The entire namespace will be deleted"
    }
    Write-Host ""
    
    $confirmation = Read-Host "Are you sure? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-InfoMessage "Deletion cancelled"
        exit 0
    }
    
    return $true
}

# Uninstall Helm release
function Uninstall-HelmRelease {
    Write-Header "Uninstalling Helm Release"
    
    $releases = & $HelmCommand list -n $Namespace 2>$null
    if ($releases -match $ReleaseName) {
        Write-InfoMessage "Uninstalling Helm release '$ReleaseName'..."
        & $HelmCommand uninstall $ReleaseName --namespace $Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Helm release '$ReleaseName' removed"
        } else {
            Write-TestError "Failed to uninstall Helm release"
            return $false
        }
    } else {
        Write-Warning "Helm release '$ReleaseName' not found in namespace '$Namespace'"
    }
    
    return $true
}

# Delete Grafana secret
function Remove-GrafanaSecret {
    Write-Header "Deleting Grafana Admin Secret"
    
    $secret = kubectl get secret grafana-admin-secret -n $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-InfoMessage "Deleting Grafana admin secret..."
        kubectl delete secret grafana-admin-secret -n $Namespace --ignore-not-found=true | Out-Null
        Write-Success "Grafana admin secret deleted"
    } else {
        Write-InfoMessage "Grafana admin secret not found (already deleted or never created)"
    }
}

# Delete PVCs
function Remove-PVCs {
    if (-not $DeletePVCs) {
        Write-Header "Skipping PVC Deletion"
        Write-Warning "PersistentVolumeClaims are NOT deleted"
        Write-Host ""
        Write-Host "To delete them manually:"
        Write-Host "  kubectl delete pvc -n $Namespace -l app.kubernetes.io/instance=$ReleaseName"
        return
    }
    
    Write-Header "Deleting PersistentVolumeClaims"
    
    $pvcs = kubectl get pvc -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" -o name 2>$null
    
    if (-not $pvcs) {
        Write-InfoMessage "No PVCs found for release '$ReleaseName'"
        return
    }
    
    Write-Warning "Deleting PVCs (data will be permanently lost!)..."
    $pvcs | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
    
    kubectl delete pvc -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PVCs deleted"
    } else {
        Write-Warning "Some PVCs may not have been deleted"
    }
}

# Delete ServiceMonitors
function Remove-ServiceMonitors {
    Write-Header "Cleaning Up ServiceMonitors"
    
    $servicemonitors = kubectl get servicemonitor -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" -o name 2>$null
    
    if (-not $servicemonitors) {
        Write-InfoMessage "No ServiceMonitors found"
        return
    }
    
    Write-InfoMessage "Deleting ServiceMonitors..."
    kubectl delete servicemonitor -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" --ignore-not-found=true 2>$null
    Write-Success "ServiceMonitors deleted"
}

# Delete namespace
function Remove-NamespaceIfRequested {
    if (-not $DeleteNamespace) {
        return
    }
    
    Write-Header "Deleting Namespace"
    
    Write-Warning "Deleting namespace '$Namespace' (this will delete ALL resources in it)..."
    
    kubectl delete namespace $Namespace --timeout=60s
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Namespace '$Namespace' deleted"
    } else {
        Write-TestError "Failed to delete namespace '$Namespace'"
        return $false
    }
    
    return $true
}

# Show remaining resources
function Show-RemainingResources {
    Write-Header "Checking Remaining Resources"
    
    if ($DeleteNamespace) {
        Write-InfoMessage "Namespace was deleted, no resources remaining"
        return
    }
    
    $pods = kubectl get pods -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" -o name 2>$null
    $pvcs = kubectl get pvc -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" -o name 2>$null
    
    if (-not $pods -and -not $pvcs) {
        Write-Success "All monitoring resources have been removed"
    } else {
        if ($pods) {
            Write-Warning "Some pods are still terminating:"
            $pods | ForEach-Object { Write-Host "  $_" }
        }
        if ($pvcs) {
            Write-InfoMessage "PVCs still exist (as expected):"
            $pvcs | ForEach-Object { Write-Host "  $_" }
        }
    }
}

# Main execution
function Main {
    Write-Header "Monitoring Stack Deletion"
    
    # Check kubectl
    if (-not (Test-Kubectl)) {
        exit 1
    }
    
    # Check if namespace exists
    kubectl get namespace $Namespace 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Namespace '$Namespace' does not exist"
        Write-InfoMessage "Nothing to delete"
        exit 0
    }
    
    # Confirm deletion
    if (-not (Confirm-Deletion)) {
        exit 0
    }
    
    # Uninstall Helm release
    Uninstall-HelmRelease
    
    # Delete Grafana secret
    Remove-GrafanaSecret
    
    # Delete ServiceMonitors
    Remove-ServiceMonitors
    
    # Delete PVCs if requested
    Remove-PVCs
    
    # Delete namespace if requested
    Remove-NamespaceIfRequested
    
    # Show remaining resources
    Show-RemainingResources
    
    Write-Header "Deletion Complete"
    Write-Success "Monitoring stack has been removed!"
    
    if (-not $DeletePVCs) {
        Write-Host ""
        Write-InfoMessage "Note: PVCs were not deleted. To remove them:"
        Write-Host "  .\delete-monitoring.ps1 -DeletePVCs"
    }
}

# Run main function
Main
