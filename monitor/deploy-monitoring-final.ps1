# Deploy Monitoring Stack (PowerShell Version)
# Auto-installs Helm if not present and deploys kube-prometheus-stack

param(
    [string]$Namespace = "superproject-ns"
)

# Configuration
$ReleaseName = "monitoring"
$HelmRepoName = "prometheus-community"
$HelmRepoUrl = "https://prometheus-community.github.io/helm-charts"
$ChartName = "kube-prometheus-stack"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ValuesFile = Join-Path $ScriptDir "values.yaml"
$GrafanaSecretFile = Join-Path $ScriptDir "grafana-admin-secret.yaml"
$HelmCommand = "helm"

# Check if local helm.exe exists
if (Test-Path "$ScriptDir\helm.exe") {
    $HelmCommand = "$ScriptDir\helm.exe"
    Write-Host "Using local Helm: $HelmCommand" -ForegroundColor Yellow
}

# Color functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    # Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    # Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
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

# Check if Helm is installed
function Test-Helm {
    try {
        $helmVersion = & $HelmCommand version --short 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Helm is ready ($helmVersion)"
            return $true
        }
    } catch {}
    return $false
}

# Install Helm locally
function Install-LocalHelm {
    Write-Header "Installing Helm Locally"
    
    $version = "v3.13.1"
    $downloadUrl = "https://get.helm.sh/helm-$version-windows-amd64.zip"
    $tempZip = Join-Path $env:TEMP "helm-download.zip"
    $tempDir = Join-Path $env:TEMP "helm-extract"
    
    try {
        Write-InfoMessage "Downloading Helm $version..."
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing -ErrorAction Stop
        Write-Success "Downloaded"
        
        Write-InfoMessage "Extracting..."
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force
        }
        Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
        Write-Success "Extracted"
        
        Write-InfoMessage "Installing to current directory..."
        $helmExe = Get-ChildItem -Path "$tempDir\windows-amd64" -Filter "helm.exe" -ErrorAction Stop
        Copy-Item -Path $helmExe.FullName -Destination "$ScriptDir\helm.exe" -Force
        Write-Success "Installed: $ScriptDir\helm.exe"
        
        # Update Helm command to use local version
        $script:HelmCommand = "$ScriptDir\helm.exe"
        
        # Cleanup
        Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        
        # Test
        $helmVersion = & $script:HelmCommand version --short
        Write-Success "Helm is ready: $helmVersion"
        return $true
    }
    catch {
        Write-TestError "Failed to install Helm: $_"
        return $false
    }
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check kubectl
    try {
        $null = kubectl cluster-info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "kubectl is configured"
        } else {
            Write-TestError "kubectl is not configured or cluster is not reachable!"
            return $false
        }
    } catch {
        Write-TestError "kubectl is not installed!"
        return $false
    }
    
    # Check or install Helm
    if (-not (Test-Helm)) {
        Write-Warning "Helm not found, installing locally..."
        if (-not (Install-LocalHelm)) {
            return $false
        }
    }
    
    # Check values file
    if (-not (Test-Path $ValuesFile)) {
        Write-TestError "Values file not found: $ValuesFile"
        return $false
    }
    Write-Success "Values file found"
    
    return $true
}

# Ensure namespace exists
function Ensure-Namespace {
    Write-Header "Ensuring Namespace"
    
    kubectl get namespace $Namespace 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Namespace '$Namespace' exists"
    } else {
        Write-InfoMessage "Creating namespace '$Namespace'..."
        kubectl create namespace $Namespace
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Namespace '$Namespace' created"
        } else {
            Write-TestError "Failed to create namespace"
            return $false
        }
    }
    return $true
}

# Add Helm repository
function Add-HelmRepo {
    Write-Header "Setting Up Helm Repository"
    
    Write-InfoMessage "Adding Prometheus Community Helm repository..."
    $existingRepos = & $HelmCommand repo list 2>$null
    
    if ($existingRepos -match $HelmRepoName) {
        Write-Warning "Repository '$HelmRepoName' already exists"
    } else {
        & $HelmCommand repo add $HelmRepoName $HelmRepoUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Repository '$HelmRepoName' added"
        } else {
            Write-TestError "Failed to add repository"
            return $false
        }
    }
    
    Write-InfoMessage "Updating Helm repositories..."
    & $HelmCommand repo update
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Helm repositories updated"
    }
    
    return $true
}

# Apply Grafana secret
function Apply-GrafanaSecret {
    Write-Header "Applying Grafana Admin Secret"
    
    if (-not (Test-Path $GrafanaSecretFile)) {
        Write-Warning "Grafana secret file not found"
        Write-InfoMessage "Skipping (will use Helm defaults)"
        return $true
    }
    
    Write-InfoMessage "Applying Grafana admin secret..."
    kubectl apply -f $GrafanaSecretFile -n $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Grafana admin secret applied"
    } else {
        Write-Warning "Secret may already exist"
    }
    
    return $true
}

# Install monitoring stack
function Install-MonitoringStack {
    Write-Header "Installing/Upgrading Monitoring Stack"
    
    Write-InfoMessage "Installing $ChartName using Helm..."
    Write-Host ""
    
    & $HelmCommand upgrade --install $ReleaseName `
        "$HelmRepoName/$ChartName" `
        --namespace $Namespace `
        --values $ValuesFile `
        --wait `
        --timeout 10m
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Monitoring stack deployed successfully!"
        return $true
    } else {
        Write-Host ""
        Write-TestError "Failed to deploy monitoring stack"
        return $false
    }
}

# Wait for pods
function Wait-ForPods {
    Write-Header "Waiting for Pods"
    
    Write-InfoMessage "Waiting for pods to be ready (this may take a few minutes)..."
    
    $timeout = 300
    $elapsed = 0
    $interval = 5
    
    while ($elapsed -lt $timeout) {
        $pods = kubectl get pods -n $Namespace -l "app.kubernetes.io/instance=$ReleaseName" --no-headers 2>$null
        
        if ($pods) {
            $total = ($pods | Measure-Object).Count
            $running = ($pods | Select-String "Running" | Measure-Object).Count
            
            if ($running -eq $total) {
                Write-Success "All $total pods are running"
                return $true
            }
            
            Write-Host "  Pods: $running/$total running..." -ForegroundColor Gray
        }
        
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }
    
    Write-Warning "Timeout reached, some pods may still be starting"
    return $false
}

# Show access information
function Show-AccessInfo {
    Write-Header "Access Information"
    
    Write-Host "Grafana Dashboard:" -ForegroundColor Green
    Write-Host "  URL: http://grafana.localhost"
    Write-Host "  Username: admin"
    Write-Host ""
    Write-Host "To get the Grafana admin password:"
    Write-Host '  kubectl get secret grafana-admin-secret -n' $Namespace '-o jsonpath="{.data.admin-password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }'
    Write-Host ""
    Write-Host "Prometheus:" -ForegroundColor Green
    Write-Host "  Access via port-forward:"
    Write-Host "  kubectl port-forward -n $Namespace svc/$ReleaseName-kube-prometheus-prometheus 9090:9090"
    Write-Host "  Then visit: http://localhost:9090"
    Write-Host ""
    Write-Host "Important:" -ForegroundColor Yellow
    Write-Host "  Add to C:\Windows\System32\drivers\etc\hosts:"
    Write-Host "  127.0.0.1 grafana.localhost"
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Update hosts file (Run as Administrator)"
    Write-Host "  2. Visit http://grafana.localhost"
    Write-Host "  3. Login with admin credentials"
    Write-Host "  4. Import dashboard: $ScriptDir\grafana-dashboard-backend.json"
}

# Main execution
function Main {
    Write-Header "Monitoring Stack Deployment"
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    # Ensure namespace
    if (-not (Ensure-Namespace)) {
        exit 1
    }
    
    # Setup Helm repository
    if (-not (Add-HelmRepo)) {
        exit 1
    }
    
    # Apply Grafana secret
    Apply-GrafanaSecret
    
    # Install monitoring stack
    if (-not (Install-MonitoringStack)) {
        exit 1
    }
    
    # Wait for pods
    Wait-ForPods
    
    # Show access information
    Show-AccessInfo
    
    Write-Header "Deployment Complete"
    Write-Success "Monitoring stack is now running!"
    Write-Host ""
    Write-InfoMessage "Run .\test-monitoring.ps1 to verify the installation"
}

# Run main function
Main
