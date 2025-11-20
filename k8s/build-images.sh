#!/bin/bash
#
# build-images.sh
# Build Docker images for backend and frontend used by Kubernetes manifests.
#
# Builds the images with tags:
#   - apartment-backend:prod
#   - apartment-frontend:prod
#
# For the frontend, this script temporarily swaps nginx.prod.conf with nginx.k8s.conf
# so the container proxies /api to the Kubernetes backend service (backend-service:8080).

set -e

NO_FRONTEND_SWAP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-frontend-swap)
      NO_FRONTEND_SWAP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--no-frontend-swap]"
      exit 1
      ;;
  esac
done

function write_section() {
  echo -e "\n=== $1 ==="
}

# Resolve repo root (parent of k8s)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

write_section "Repository root: $REPO_ROOT"

# Verify Docker is available
if ! docker version >/dev/null 2>&1; then
  echo "[ERROR] Docker does not appear to be running or accessible."
  echo "Please start Docker and retry."
  exit 1
fi

# --- Build backend ---
write_section "Building backend image (apartment-backend:prod)"
docker build \
  -t apartment-backend:prod \
  -f "$REPO_ROOT/backend/Dockerfile.prod" \
  "$REPO_ROOT/backend"

# --- Build frontend ---
write_section "Building frontend image (apartment-frontend:prod)"
FRONTEND_DIR="$REPO_ROOT/frontend"
PROD_CONF="$FRONTEND_DIR/nginx.prod.conf"
K8S_CONF="$FRONTEND_DIR/nginx.k8s.conf"
BACKUP_CONF="$FRONTEND_DIR/nginx.prod.conf.bak"

if [ "$NO_FRONTEND_SWAP" = false ]; then
  if [ ! -f "$K8S_CONF" ]; then
    echo "[WARN] K8s Nginx config not found at $K8S_CONF. Proceeding without swap."
  else
    echo "Temporarily swapping nginx.prod.conf -> nginx.k8s.conf for K8s build"
    [ -f "$BACKUP_CONF" ] && rm -f "$BACKUP_CONF"
    cp "$PROD_CONF" "$BACKUP_CONF"
    cp "$K8S_CONF" "$PROD_CONF"
  fi
fi

# Build frontend with cleanup
function cleanup_nginx_config() {
  if [ "$NO_FRONTEND_SWAP" = false ] && [ -f "$BACKUP_CONF" ]; then
    echo "Restoring original nginx.prod.conf"
    mv -f "$BACKUP_CONF" "$PROD_CONF"
  fi
}

trap cleanup_nginx_config EXIT

docker build \
  -t apartment-frontend:prod \
  -f "$REPO_ROOT/frontend/Dockerfile.prod" \
  "$REPO_ROOT/frontend"

write_section "Build complete"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep "apartment-"

echo -e "\n[SUCCESS] Images ready for Kubernetes deployment!"
echo "Backend:  apartment-backend:prod"
echo "Frontend: apartment-frontend:prod (with K8s Nginx config)"
echo ""
echo "Next steps for Minikube:"
echo "  minikube image load apartment-backend:prod"
echo "  minikube image load apartment-frontend:prod"
echo ""
echo "Next steps for Kind:"
echo "  kind load docker-image apartment-backend:prod --name <cluster-name>"
echo "  kind load docker-image apartment-frontend:prod --name <cluster-name>"
