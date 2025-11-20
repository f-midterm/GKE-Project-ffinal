<#
.SYNOPSIS
  Update database schema in Kubernetes without losing data.

.DESCRIPTION
  Updates the MySQL database schema by:
    1. Backing up the current database (optional)
    2. Updating the ConfigMap with new schema
    3. Restarting MySQL to apply changes
    4. Restarting backend to reconnect

  WARNING: This will restart MySQL and may cause brief downtime.
  For production, consider using proper migration tools.

.PARAMETER BackupFirst
  Create a backup before applying schema changes.

.PARAMETER Namespace
  Target Kubernetes namespace (default: superproject-ns).

.EXAMPLE
  .\update_sql.ps1
  # Update schema without backup

.EXAMPLE
  .\update_sql.ps1 -BackupFirst
  # Backup database before updating schema

.NOTES
  Before running:
    1. Update k8s/database/configmap.yaml with your new schema
    2. Ensure the schema changes are backward compatible or plan for downtime
  
  Requires kubectl configured.
  Designed for Windows PowerShell 5.1+.
#>

param(
  [switch]$BackupFirst,
  [string]$Namespace = 'superproject-ns',
  [switch]$ApplyInitFile,            # Danger: applies full init.sql (drops tables!)
  [switch]$MigrateAuditColumns = $true  # Safe additive migration for audit columns
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n=== Database Schema Update Script ===" -ForegroundColor Cyan
Write-Host "Namespace: $Namespace" -ForegroundColor White
Write-Host "Backup first: $BackupFirst" -ForegroundColor White
Write-Host ""

 # Resolve init.sql from backend (authoritative)
$initSqlPath = Resolve-Path -ErrorAction SilentlyContinue (Join-Path $scriptDir '..\\backend\\init.sql')
if (-not $initSqlPath) {
  Write-Host "[WARN] backend\\init.sql not found; some operations may be unavailable." -ForegroundColor Yellow
}

# Warn user
Write-Host "[WARNING] This will connect to MySQL in cluster and modify schema. Backup recommended." -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Continue with database schema update? (yes/no)"
if ($confirmation -ne 'yes') {
    Write-Host "[INFO] Schema update cancelled by user." -ForegroundColor Yellow
    exit 0
}

# ============================================
# Step 1: Backup (optional)
# ============================================
if ($BackupFirst) {
    Write-Host "`n=== Step 1: Creating database backup ===" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "mysql_backup_$timestamp.sql"
    
    try {
        Write-Host "- Dumping database to $backupFile..." -ForegroundColor DarkCyan
        
        $dumpCmd = "mysqldump -u apartment -psecure_password_change_me apartment_db > /tmp/backup.sql"
        kubectl exec mysql-0 -n $Namespace -- sh -c $dumpCmd
        
        Write-Host "- Copying backup to local machine..." -ForegroundColor DarkCyan
        kubectl cp "$Namespace/mysql-0:/tmp/backup.sql" $backupFile
        
        Write-Host "[SUCCESS] Backup saved to: $backupFile" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
        Write-Host "Continue without backup? (yes/no)" -ForegroundColor Yellow
        $continueAnyway = Read-Host
        if ($continueAnyway -ne 'yes') {
            exit 1
        }
    }
}

 # ============================================
# Step 2: Apply schema changes
# ============================================
Write-Host "`n=== Step 2: Applying schema changes ===" -ForegroundColor Cyan

# DB credentials (must match mysql-secret)
$dbUser = 'apartment'
$dbPass = 'secure_password_change_me'
$dbName = 'apartment_db'

function Invoke-MySqlScriptInPod($scriptContent) {
  $tmpLocal = New-TemporaryFile
  try {
    Set-Content -LiteralPath $tmpLocal -Value $scriptContent -Encoding UTF8
    kubectl cp $tmpLocal "$Namespace/mysql-0:/tmp/apply.sql"
    kubectl exec -n $Namespace mysql-0 -- sh -c "mysql -u $dbUser -p$dbPass $dbName < /tmp/apply.sql"
    Write-Host "[SUCCESS] SQL applied" -ForegroundColor Green
  } finally { Remove-Item -ErrorAction SilentlyContinue $tmpLocal }
}

try {
  # Ensure pod is ready
  Write-Host "- Ensuring MySQL pod is ready..." -ForegroundColor DarkCyan
  kubectl wait --for=condition=ready pod/mysql-0 -n $Namespace --timeout=180s | Out-Null

  if ($ApplyInitFile) {
    if (-not $initSqlPath) { throw "backend\\init.sql not found" }
    Write-Host "- Applying FULL init.sql (tables will be dropped/recreated)" -ForegroundColor Yellow
    $sql = Get-Content -Raw -LiteralPath $initSqlPath
    Invoke-MySqlScriptInPod -scriptContent $sql
  }

  if ($MigrateAuditColumns) {
    Write-Host "- Applying safe additive migration for audit columns" -ForegroundColor DarkCyan
    $migration = @'
SET SESSION FOREIGN_KEY_CHECKS=0;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL;
SET SESSION FOREIGN_KEY_CHECKS=1;
'@
    Invoke-MySqlScriptInPod -scriptContent $migration
  }
}
catch {
  Write-Host "[ERROR] Failed to apply schema changes: $_" -ForegroundColor Red
  exit 1
}

# ============================================
# Step 3: Restart Backend
# ============================================
Write-Host "`n=== Step 3: Restarting Backend ===" -ForegroundColor Cyan

try {
  Write-Host "- Restarting backend deployment..." -ForegroundColor DarkCyan
  kubectl rollout restart deployment/backend -n $Namespace
    
  Write-Host "- Waiting for backend rollout..." -ForegroundColor DarkCyan
  kubectl rollout status deployment/backend -n $Namespace --timeout=180s
    
  Write-Host "[SUCCESS] Backend restarted" -ForegroundColor Green
}
catch {
  Write-Host "[ERROR] Backend restart failed: $_" -ForegroundColor Red
  Write-Host "[INFO] Check deployment: kubectl get deployment backend -n $Namespace" -ForegroundColor Yellow
  exit 1
}

# ============================================
# Step 5: Verify
# ============================================
Write-Host "`n=== Step 5: Verification ===" -ForegroundColor Cyan

Write-Host "- Pod status:" -ForegroundColor DarkCyan
kubectl get pods -n $Namespace

Write-Host ""
Write-Host "- Testing backend health..." -ForegroundColor DarkCyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 10 -Method Get
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Backend health check passed" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "  Service: $($healthData.service)" -ForegroundColor DarkGray
        Write-Host "  Status: $($healthData.status)" -ForegroundColor DarkGray
    }
}
catch {
    Write-Host "[WARN] Backend health check failed: $_" -ForegroundColor Yellow
    Write-Host "  This may be normal if the service is still starting up." -ForegroundColor DarkGray
}

Write-Host "`n=== Schema Update Complete ===" -ForegroundColor Cyan
Write-Host "[SUCCESS] Database schema has been updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the application thoroughly: http://localhost/" -ForegroundColor White
Write-Host "  2. Verify database schema: kubectl exec -it mysql-0 -n $Namespace -- mysql -u apartment -p$($dbPass) $dbName -e 'DESCRIBE leases'" -ForegroundColor White
Write-Host "  3. Check backend logs: kubectl logs deployment/backend -n $Namespace" -ForegroundColor White
Write-Host ""

if ($BackupFirst) {
    Write-Host "Backup file: $backupFile" -ForegroundColor Cyan
    Write-Host "To restore if needed:" -ForegroundColor Yellow
    Write-Host "  kubectl cp $backupFile $Namespace/mysql-0:/tmp/backup.sql" -ForegroundColor White
    Write-Host "  kubectl exec -it mysql-0 -n $Namespace -- mysql -u apartment -p apartment_db < /tmp/backup.sql" -ForegroundColor White
    Write-Host ""
}
