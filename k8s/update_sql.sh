#!/bin/bash
#
# update_sql.sh
# Update database schema in Kubernetes without losing data.
#
# Updates the MySQL database schema by:
#   1. Backing up the current database (optional)
#   2. Updating the ConfigMap with new schema
#   3. Restarting MySQL to apply changes
#   4. Restarting backend to reconnect
#
# WARNING: This will restart MySQL and may cause brief downtime.
# For production, consider using proper migration tools.
#
# Usage:
#   ./update_sql.sh [OPTIONS]
#
# Options:
#   --backup-first           Create a backup before applying schema changes
#   --apply-init-file        DANGER: applies full init.sql (drops tables!)
#   --no-migrate-audit       Skip audit column migration
#   --namespace NAME         Target namespace (default: superproject-ns)

set -e

BACKUP_FIRST=false
APPLY_INIT_FILE=false
MIGRATE_AUDIT_COLUMNS=true
NAMESPACE="superproject-ns"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --backup-first)
      BACKUP_FIRST=true
      shift
      ;;
    --apply-init-file)
      APPLY_INIT_FILE=true
      shift
      ;;
    --no-migrate-audit)
      MIGRATE_AUDIT_COLUMNS=false
      shift
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--backup-first] [--apply-init-file] [--no-migrate-audit] [--namespace NAME]"
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n=== Database Schema Update Script ==="
echo "Namespace: $NAMESPACE"
echo "Backup first: $BACKUP_FIRST"
echo ""

# Resolve init.sql from backend (authoritative)
INIT_SQL_PATH="../backend/init.sql"
if [ ! -f "$INIT_SQL_PATH" ]; then
  echo "[WARN] backend/init.sql not found; some operations may be unavailable."
  INIT_SQL_PATH=""
fi

# Warn user
echo "[WARNING] This will connect to MySQL in cluster and modify schema. Backup recommended."
echo ""
read -p "Continue with database schema update? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "[INFO] Schema update cancelled by user."
    exit 0
fi

# DB credentials (must match mysql-secret)
DB_USER="apartment"
DB_PASS="secure_password_change_me"
DB_NAME="apartment_db"

# ============================================
# Step 1: Backup (optional)
# ============================================
if [ "$BACKUP_FIRST" = true ]; then
    echo -e "\n=== Step 1: Creating database backup ==="
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="mysql_backup_${TIMESTAMP}.sql"
    
    echo "- Dumping database to $BACKUP_FILE..."
    
    if kubectl exec mysql-0 -n "$NAMESPACE" -- sh -c "mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > /tmp/backup.sql" 2>/dev/null; then
        echo "- Copying backup to local machine..."
        kubectl cp "$NAMESPACE/mysql-0:/tmp/backup.sql" "$BACKUP_FILE"
        echo "[SUCCESS] Backup saved to: $BACKUP_FILE"
    else
        echo "[ERROR] Backup failed"
        read -p "Continue without backup? (yes/no): " continue_anyway
        if [ "$continue_anyway" != "yes" ]; then
            exit 1
        fi
    fi
fi

# ============================================
# Step 2: Apply schema changes
# ============================================
echo -e "\n=== Step 2: Applying schema changes ==="

function invoke_mysql_script() {
  local script_content="$1"
  local tmp_file=$(mktemp)
  
  echo "$script_content" > "$tmp_file"
  kubectl cp "$tmp_file" "$NAMESPACE/mysql-0:/tmp/apply.sql"
  kubectl exec -n "$NAMESPACE" mysql-0 -- sh -c "mysql -u $DB_USER -p$DB_PASS $DB_NAME < /tmp/apply.sql"
  rm -f "$tmp_file"
  echo "[SUCCESS] SQL applied"
}

# Ensure pod is ready
echo "- Ensuring MySQL pod is ready..."
kubectl wait --for=condition=ready pod/mysql-0 -n "$NAMESPACE" --timeout=180s

if [ "$APPLY_INIT_FILE" = true ]; then
  if [ -z "$INIT_SQL_PATH" ] || [ ! -f "$INIT_SQL_PATH" ]; then
    echo "[ERROR] backend/init.sql not found"
    exit 1
  fi
  echo "- Applying FULL init.sql (tables will be dropped/recreated)"
  SQL_CONTENT=$(cat "$INIT_SQL_PATH")
  invoke_mysql_script "$SQL_CONTENT"
fi

if [ "$MIGRATE_AUDIT_COLUMNS" = true ]; then
  echo "- Applying safe additive migration for audit columns"
  MIGRATION="SET SESSION FOREIGN_KEY_CHECKS=0;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT NULL;
SET SESSION FOREIGN_KEY_CHECKS=1;"
  invoke_mysql_script "$MIGRATION"
fi

# ============================================
# Step 3: Restart Backend
# ============================================
echo -e "\n=== Step 3: Restarting Backend ==="

echo "- Restarting backend deployment..."
kubectl rollout restart deployment/backend -n "$NAMESPACE"

echo "- Waiting for backend rollout..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=180s

echo "[SUCCESS] Backend restarted"

# ============================================
# Step 4: Verify
# ============================================
echo -e "\n=== Step 4: Verification ==="

echo "- Pod status:"
kubectl get pods -n "$NAMESPACE"

echo ""
echo "- Testing backend health..."
if curl -s --max-time 10 "http://localhost/api/health" >/dev/null 2>&1; then
    echo "[SUCCESS] Backend health check passed"
    curl -s "http://localhost/api/health" | head -5
else
    echo "[WARN] Backend health check failed"
    echo "  This may be normal if the service is still starting up."
fi

echo -e "\n=== Schema Update Complete ==="
echo "[SUCCESS] Database schema has been updated!"
echo ""
echo "Next steps:"
echo "  1. Test the application thoroughly: http://localhost/"
echo "  2. Verify database schema: kubectl exec -it mysql-0 -n $NAMESPACE -- mysql -u $DB_USER -p$DB_PASS $DB_NAME -e 'DESCRIBE leases'"
echo "  3. Check backend logs: kubectl logs deployment/backend -n $NAMESPACE"
echo ""

if [ "$BACKUP_FIRST" = true ]; then
    echo "Backup file: $BACKUP_FILE"
    echo "To restore if needed:"
    echo "  kubectl cp $BACKUP_FILE $NAMESPACE/mysql-0:/tmp/backup.sql"
    echo "  kubectl exec -it mysql-0 -n $NAMESPACE -- mysql -u $DB_USER -p$DB_PASS $DB_NAME < /tmp/backup.sql"
    echo ""
fi
