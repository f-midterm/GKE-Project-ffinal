<#!
.SYNOPSIS
  Manage Kubernetes deployment for the application.

.DESCRIPTION
  Provides simple commands:
    - up:      Apply all manifests (namespace, database, backend, frontend, ingress)
    - down:    Delete all resources in order (ingress, frontend, backend, database)
    - status:  Show core resources in the superproject-ns namespace
    - logs:    Tail logs for a deployment (backend|frontend)
    - restart: Roll out restart for a deployment (backend|frontend)

.NOTES
  Requires kubectl configured to target your cluster. Designed for Windows PowerShell 5.1.
#>

param(
  [ValidateSet('up','down','status','logs','restart')]
  [string]$Command = 'up',

  [ValidateSet('backend','frontend')]
  [string]$Target,

  [string]$Namespace = 'superproject-ns',

  [switch]$SkipBuild,
  [switch]$ResetDatabase
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Step($msg) { Write-Host "- $msg" -ForegroundColor DarkCyan }

function Test-IngressController {
  try {
    $null = kubectl get deploy ingress-nginx-controller -n ingress-nginx --no-headers 2>$null
    return $LASTEXITCODE -eq 0
  } catch { return $false }
}

function Wait-Deployment($name, $ns) {
  Write-Step "Waiting for deployment/$name to be ready..."
  try {
    kubectl rollout status deployment/$name -n $ns --timeout=180s | Write-Host
  } catch {
    Write-Host "Warning: rollout wait for deployment/$name timed out or failed. Continuing..." -ForegroundColor Yellow
  }
}

function Wait-StatefulSet($name, $ns) {
  Write-Step "Waiting for statefulset/$name to be ready..."
  try {
    kubectl rollout status statefulset/$name -n $ns --timeout=240s | Write-Host
  } catch {
    Write-Host "Warning: rollout wait for statefulset/$name timed out or failed. Continuing..." -ForegroundColor Yellow
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

switch ($Command) {
  'up' {
    Write-Section "One-command deploy: build images, apply manifests, wait, and expose access"

    # 1) Build local images (frontend+backend)
    $buildScript = Join-Path $scriptDir 'build-images.ps1'
    if (-not $SkipBuild -and (Test-Path $buildScript)) {
      Write-Step "Building local Docker images (this may take a few minutes)..."
      try { & $buildScript } finally { Set-Location $scriptDir }
    } else {
      if ($SkipBuild) {
        Write-Host "[INFO] Skipping image build as requested (-SkipBuild)." -ForegroundColor Yellow
      } elseif (-not (Test-Path $buildScript)) {
        Write-Host "Warning: build-images.ps1 not found; skipping image build." -ForegroundColor Yellow
      }
    }

    # 2) Ensure namespace exists
    Write-Section "Apply namespace"
    kubectl apply -f .\namespace.yaml | Write-Host

    # 3) Database: apply in safe order (secret, configmap, pvc, optional pvc reset, service, statefulset)
    Write-Section "Apply database (MySQL)"
    kubectl apply -n $Namespace -f .\database\secret.yaml      | Write-Host

    # Generate ConfigMap from backend/init.sql if present to avoid drift
    $initSqlPath = Resolve-Path -ErrorAction SilentlyContinue (Join-Path $scriptDir '..\backend\init.sql')
    if ($initSqlPath) {
      Write-Step "Creating/Updating ConfigMap from backend/init.sql"
      $tempFile = New-TemporaryFile
      try {
        # Build the ConfigMap YAML from file
        kubectl create configmap mysql-init-cm --from-file=init.sql=$initSqlPath -n $Namespace --dry-run=client -o yaml | Out-File -FilePath $tempFile -Encoding utf8
        kubectl apply -f $tempFile | Write-Host
      } finally {
        Remove-Item -ErrorAction SilentlyContinue $tempFile
      }
    } else {
      Write-Step "backend/init.sql not found; applying static ConfigMap manifest"
      kubectl apply -n $Namespace -f .\database\configmap.yaml   | Write-Host
    }

    kubectl apply -n $Namespace -f .\database\pvc.yaml         | Write-Host

    if ($ResetDatabase) {
      Write-Host "[WARN] -ResetDatabase specified: deleting PVC 'mysql-pvc' to reinitialize schema (data loss)." -ForegroundColor Yellow
      kubectl delete pvc mysql-pvc -n $Namespace --ignore-not-found | Write-Host
      # Re-apply PVC after deletion
      kubectl apply -n $Namespace -f .\database\pvc.yaml         | Write-Host
    }

    kubectl apply -n $Namespace -f .\database\service.yaml     | Write-Host
    kubectl apply -n $Namespace -f .\database\statefulset.yaml | Write-Host
    Wait-StatefulSet -name 'mysql' -ns $Namespace

    # 4) Backend: configmap, secret, pvc, service then deployment
    Write-Section "Apply backend"
    kubectl apply -n $Namespace -f .\backend\configmap.yaml   | Write-Host
    kubectl apply -n $Namespace -f .\backend\secret.yaml      | Write-Host
    kubectl apply -n $Namespace -f .\backend\pvc.yaml         | Write-Host
    kubectl apply -n $Namespace -f .\backend\service.yaml     | Write-Host
    kubectl apply -n $Namespace -f .\backend\deployment.yaml  | Write-Host
    
    # Apply ServiceMonitor for Prometheus scraping (if exists and CRD is available)
    if (Test-Path .\backend\servicemonitor.yaml) {
      # Check if ServiceMonitor CRD exists (installed by kube-prometheus-stack)
      $crdExists = kubectl get crd servicemonitors.monitoring.coreos.com 2>$null
      if ($LASTEXITCODE -eq 0) {
        Write-Step "Applying ServiceMonitor for backend metrics..."
        kubectl apply -n $Namespace -f .\backend\servicemonitor.yaml | Write-Host
      } else {
        Write-Host "[INFO] ServiceMonitor CRD not found. Deploy monitoring stack first with: cd ..\monitor; .\deploy-monitoring.ps1" -ForegroundColor Yellow
      }
    }
    
    Wait-Deployment -name 'backend' -ns $Namespace

    # 5) Frontend: service then deployment
    Write-Section "Apply frontend"
    kubectl apply -n $Namespace -f .\frontend\service.yaml    | Write-Host
    kubectl apply -n $Namespace -f .\frontend\deployment.yaml | Write-Host
    Wait-Deployment -name 'frontend' -ns $Namespace

    # 6) Ingress: preferred path if controller exists
    Write-Section "Configure access"
    $hasIngress = Test-IngressController
    if ($hasIngress) {
      Write-Step "Ingress-NGINX detected; applying ingress rules."
      kubectl apply -n $Namespace -f .\ingress\ingress.yaml | Write-Host
      
      # Apply Prometheus Ingress for monitoring (if exists)
      if (Test-Path .\monitoring\prometheus-ingress.yaml) {
        Write-Step "Applying Prometheus Ingress for monitoring access..."
        kubectl apply -n $Namespace -f .\monitoring\prometheus-ingress.yaml | Write-Host
      }
    } else {
      Write-Step "Ingress-NGINX not detected; exposing NodePorts as fallback."
      # Patch frontend service to NodePort: 30080
      $frontendPatch = @{ spec = @{ type = 'NodePort'; ports = @(@{ port = 80; targetPort = 80; protocol = 'TCP'; name = 'http'; nodePort = 30080 }) } } | ConvertTo-Json -Depth 6
      kubectl patch svc frontend-service -n $Namespace -p $frontendPatch | Write-Host
      # Patch backend service to NodePort: 30081
      $backendPatch = @{ spec = @{ type = 'NodePort'; ports = @(@{ port = 8080; targetPort = 8080; protocol = 'TCP'; name = 'http'; nodePort = 30081 }) } } | ConvertTo-Json -Depth 6
      kubectl patch svc backend-service -n $Namespace -p $backendPatch | Write-Host
    }

    # 7) Final status
    Write-Section "Status"
    kubectl get pods -n $Namespace -o wide
    kubectl get svc -n $Namespace
    if ($hasIngress) { kubectl get ingress -n $Namespace }

    # 8) Quick checks and endpoints
    Write-Section "Access"
    if ($hasIngress) {
      Write-Host "Frontend: http://localhost/" -ForegroundColor Green
      Write-Host "API health: http://localhost/api/health" -ForegroundColor Green
    } else {
      Write-Host "Frontend (NodePort): http://localhost:30080/" -ForegroundColor Green
      Write-Host "API health (NodePort via frontend proxy): http://localhost:30080/api/health" -ForegroundColor Green
      Write-Host "API direct (NodePort): http://localhost:30081/health" -ForegroundColor Green
    }

    # Optional sanity checks (non-blocking)
    try {
      if ($hasIngress) {
        $res = Invoke-WebRequest http://localhost/api/health -UseBasicParsing -TimeoutSec 15 -Method Get
      } else {
        $res = Invoke-WebRequest http://localhost:30080/api/health -UseBasicParsing -TimeoutSec 15 -Method Get
      }
      Write-Host ("Health check: " + $res.StatusCode) -ForegroundColor Green
    } catch {
      Write-Host "Health check request failed (will not block deploy)." -ForegroundColor Yellow
    }

    # If backend not fully available, provide actionable guidance
    try {
      $deployJson = kubectl get deploy backend -n $Namespace -o json | ConvertFrom-Json
      $desired = $deployJson.spec.replicas
      $available = ($deployJson.status.availableReplicas | ForEach-Object { $_ })
      if (-not $available) { $available = 0 }
      if ($available -lt $desired) {
        Write-Host "[WARN] backend replicas available: $available/$desired" -ForegroundColor Yellow
        Write-Host "       If errors mention Schema-validation or missing columns, run one of:" -ForegroundColor Yellow
        Write-Host "         .\update_sql.ps1 -BackupFirst -MigrateAuditColumns" -ForegroundColor White
        Write-Host "         .\deploy.ps1 -ResetDatabase" -ForegroundColor White
      }
    } catch { }
  }
  'down' {
    Write-Section "Deleting manifests (ingress -> frontend -> backend -> database)"
    kubectl delete -n $Namespace -f .\ingress  --ignore-not-found | Write-Host
    kubectl delete -n $Namespace -f .\frontend --ignore-not-found | Write-Host
    kubectl delete -n $Namespace -f .\backend  --ignore-not-found | Write-Host
    kubectl delete -n $Namespace -f .\database --ignore-not-found | Write-Host
    kubectl delete -f .\namespace.yaml --ignore-not-found | Write-Host
  }
  'status' {
    Write-Section "Current status"
    kubectl get pods -n $Namespace -o wide
    kubectl get svc -n $Namespace
    kubectl get ingress -n $Namespace
    kubectl get pvc -n $Namespace
  }
  'logs' {
    if (-not $Target) { throw "Please provide -Target backend|frontend" }
    Write-Section "Tailing logs for deployment/$Target"
    kubectl logs -n $Namespace deployment/$Target -f --tail=200
  }
  'restart' {
    if (-not $Target) { throw "Please provide -Target backend|frontend" }
    Write-Section "Rolling restart deployment/$Target"
    kubectl rollout restart deployment/$Target -n $Namespace
    kubectl rollout status deployment/$Target -n $Namespace
  }
}

