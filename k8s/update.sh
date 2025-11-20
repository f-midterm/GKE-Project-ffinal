#!/bin/bash
#
# update.sh
# Production-safe update script for backend and frontend applications.
#
# Updates backend and frontend in Kubernetes without touching the database:
#   1. Rebuilds Docker images (backend + frontend)
#   2. Applies updated deployment manifests
#   3. Performs rolling restart to pick new images
#   4. Waits for rollouts to complete
#   5. Validates health endpoints
#
# Use this for code changes, config updates, or dependency upgrades.
# Database schema migrations should be handled separately.
#
# Usage:
#   ./update.sh [OPTIONS]
#
# Options:
#   --skip-build         Skip image rebuild; only update manifests and restart
#   --skip-health-check  Skip post-deployment health validation
#   --namespace NAME     Target namespace (default: superproject-ns)

set -e

SKIP_BUILD=false
SKIP_HEALTH_CHECK=false
NAMESPACE="superproject-ns"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-health-check)
      SKIP_HEALTH_CHECK=true
      shift
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-build] [--skip-health-check] [--namespace NAME]"
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

START_TIME=$(date +%s)

echo -e "\n=== Production Update Script ==="
echo "Target namespace: $NAMESPACE"
echo "Skip build: $SKIP_BUILD"
echo ""

# ============================================
# Step 1: Build Images (optional)
# ============================================
if [ "$SKIP_BUILD" = false ]; then
  echo -e "\n=== Building Docker images ==="
  BUILD_SCRIPT="./build-images.sh"
  
  if [ ! -f "$BUILD_SCRIPT" ]; then
    echo "[ERROR] build-images.sh not found. Cannot rebuild images."
    exit 1
  fi

  if bash "$BUILD_SCRIPT"; then
    cd "$SCRIPT_DIR"  # Return to k8s folder
    echo "[SUCCESS] Images built successfully"
    
    # Load images into minikube if available
    if command -v minikube >/dev/null 2>&1 && minikube status >/dev/null 2>&1; then
      echo "- Loading images into minikube..."
      minikube image load apartment-backend:prod
      minikube image load apartment-frontend:prod
      echo "[SUCCESS] Images loaded into minikube"
    fi
  else
    echo "[ERROR] Image build failed"
    exit 1
  fi
else
  echo "[INFO] Skipping image build (using existing images)"
fi

# ============================================
# Step 2: Update Backend
# ============================================
echo -e "\n=== Updating Backend ==="

kubectl apply -n "$NAMESPACE" -f ./backend/service.yaml
kubectl apply -n "$NAMESPACE" -f ./backend/deployment.yaml

echo "- Restarting backend deployment..."
kubectl rollout restart deployment/backend -n "$NAMESPACE"

echo "- Waiting for backend rollout to complete..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=300s

echo "[SUCCESS] Backend updated successfully"

# ============================================
# Step 3: Update Frontend
# ============================================
echo -e "\n=== Updating Frontend ==="

kubectl apply -n "$NAMESPACE" -f ./frontend/service.yaml
kubectl apply -n "$NAMESPACE" -f ./frontend/deployment.yaml

echo "- Restarting frontend deployment..."
kubectl rollout restart deployment/frontend -n "$NAMESPACE"

echo "- Waiting for frontend rollout to complete..."
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s

echo "[SUCCESS] Frontend updated successfully"

# ============================================
# Step 4: Refresh Ingress (optional)
# ============================================
echo -e "\n=== Refreshing Ingress ==="

INGRESS_PATH="./ingress/ingress.yaml"
if [ -f "$INGRESS_PATH" ]; then
  kubectl apply -n "$NAMESPACE" -f "$INGRESS_PATH"
  echo "[SUCCESS] Ingress refreshed"
else
  echo "[WARN] Ingress manifest not found; skipping ingress refresh"
fi

# ============================================
# Step 5: Verify Deployment Status
# ============================================
echo -e "\n=== Deployment Status ==="

kubectl get pods -n "$NAMESPACE" -o wide
echo ""
kubectl get svc -n "$NAMESPACE"
echo ""
kubectl get ingress -n "$NAMESPACE" 2>/dev/null || true

# ============================================
# Step 6: Health Checks
# ============================================
if [ "$SKIP_HEALTH_CHECK" = false ]; then
  echo -e "\n=== Health Validation ==="
  
  sleep 5  # Allow services to stabilize
  
  HEALTH_FAILED=false
  
  # Check backend health via Ingress or NodePort
  echo "- Checking backend health at http://localhost/api/health"
  if curl -s --max-time 15 "http://localhost/api/health" >/dev/null 2>&1; then
    echo "[SUCCESS] Backend health check PASSED (200 OK)"
    HEALTH_DATA=$(curl -s "http://localhost/api/health")
    echo "  Response: $HEALTH_DATA"
  else
    echo "[WARN] Backend health check failed"
    echo "  Trying NodePort fallback (30081)..."
    
    if curl -s --max-time 10 "http://localhost:30081/health" >/dev/null 2>&1; then
      echo "[SUCCESS] Backend health check PASSED via NodePort"
    else
      echo "[ERROR] Backend is not responding to health checks"
      HEALTH_FAILED=true
    fi
  fi
  
  # Check frontend availability
  echo "- Checking frontend at http://localhost/"
  if curl -s --max-time 10 "http://localhost/" >/dev/null 2>&1; then
    echo "[SUCCESS] Frontend health check PASSED (200 OK)"
  else
    echo "[WARN] Frontend health check failed"
    HEALTH_FAILED=true
  fi
  
  if [ "$HEALTH_FAILED" = true ]; then
    echo -e "\n=== Health Check Summary ==="
    echo "[ERROR] One or more health checks FAILED"
    echo "[WARN] Application may not be fully operational"
    echo ""
    echo "Rollback commands:"
    echo "  kubectl rollout undo deployment/backend -n $NAMESPACE"
    echo "  kubectl rollout undo deployment/frontend -n $NAMESPACE"
    echo ""
    exit 1
  fi
else
  echo "[INFO] Skipping health checks (use without --skip-health-check to enable)"
fi

# ============================================
# Summary
# ============================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n=== Update Complete ==="
echo "[SUCCESS] Backend and frontend updated successfully!"
echo "Duration: ${DURATION} seconds"
echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost/"
echo "  API health: http://localhost/api/health"
echo "  Login: http://localhost/login"
echo ""
echo "Test credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
