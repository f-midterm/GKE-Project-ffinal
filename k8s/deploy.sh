#!/bin/bash
#
# Manage Kubernetes deployment for the application.
#
# Usage:
#   ./deploy.sh [COMMAND] [OPTIONS]
#
# Commands:
#   up       - Apply all manifests (namespace, database, backend, frontend, ingress)
#   down     - Delete all resources in order (ingress, frontend, backend, database)
#   status   - Show core resources in the superproject-ns namespace
#   logs     - Tail logs for a deployment (backend|frontend)
#   restart  - Roll out restart for a deployment (backend|frontend)
#
# Options:
#   --target <backend|frontend>  - Specify target for logs/restart commands
#   --namespace <name>           - Kubernetes namespace (default: superproject-ns)
#   --skip-build                 - Skip building Docker images
#   --reset-database             - Delete and recreate database PVC (data loss!)
#
# Notes:
#   Requires kubectl configured to target your cluster.

set -e

# Default values
COMMAND="${1:-up}"
NAMESPACE="superproject-ns"
TARGET=""
SKIP_BUILD=false
RESET_DATABASE=false

# Parse arguments
shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --reset-database)
      RESET_DATABASE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Color output functions
write_section() {
  echo -e "\n\033[1;36m=== $1 ===\033[0m"
}

write_step() {
  echo -e "\033[0;36m- $1\033[0m"
}

write_warning() {
  echo -e "\033[1;33m$1\033[0m"
}

write_success() {
  echo -e "\033[1;32m$1\033[0m"
}

write_error() {
  echo -e "\033[1;31m$1\033[0m"
}

# Check if ingress controller exists
test_ingress_controller() {
  kubectl get deploy ingress-nginx-controller -n ingress-nginx --no-headers &>/dev/null
  return $?
}

# Wait for deployment to be ready
wait_deployment() {
  local name=$1
  local ns=$2
  write_step "Waiting for deployment/$name to be ready..."
  if ! kubectl rollout status deployment/$name -n $ns --timeout=180s; then
    write_warning "Warning: rollout wait for deployment/$name timed out or failed. Continuing..."
  fi
}

# Wait for statefulset to be ready
wait_statefulset() {
  local name=$1
  local ns=$2
  write_step "Waiting for statefulset/$name to be ready..."
  if ! kubectl rollout status statefulset/$name -n $ns --timeout=240s; then
    write_warning "Warning: rollout wait for statefulset/$name timed out or failed. Continuing..."
  fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

case $COMMAND in
  up)
    write_section "One-command deploy: build images, apply manifests, wait, and expose access"

    # 1) Build local images (frontend+backend)
    BUILD_SCRIPT="$SCRIPT_DIR/build-images.sh"
    if [ "$SKIP_BUILD" = false ] && [ -f "$BUILD_SCRIPT" ]; then
      write_step "Building local Docker images (this may take a few minutes)..."
      bash "$BUILD_SCRIPT" || true
      cd "$SCRIPT_DIR"
    else
      if [ "$SKIP_BUILD" = true ]; then
        write_warning "[INFO] Skipping image build as requested (--skip-build)."
      elif [ ! -f "$BUILD_SCRIPT" ]; then
        write_warning "Warning: build-images.sh not found; skipping image build."
      fi
    fi

    # 2) Ensure namespace exists
    write_section "Apply namespace"
    kubectl apply -f ./namespace.yaml

    # 3) Database: apply in safe order
    write_section "Apply database (MySQL)"
    kubectl apply -n $NAMESPACE -f ./database/secret.yaml

    # Generate ConfigMap from backend/init.sql if present
    INIT_SQL_PATH="$SCRIPT_DIR/../backend/init.sql"
    if [ -f "$INIT_SQL_PATH" ]; then
      write_step "Creating/Updating ConfigMap from backend/init.sql"
      kubectl create configmap mysql-init-cm --from-file=init.sql="$INIT_SQL_PATH" \
        -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    else
      write_step "backend/init.sql not found; applying static ConfigMap manifest"
      kubectl apply -n $NAMESPACE -f ./database/configmap.yaml
    fi

    kubectl apply -n $NAMESPACE -f ./database/pvc.yaml

    if [ "$RESET_DATABASE" = true ]; then
      write_warning "[WARN] --reset-database specified: deleting PVC 'mysql-pvc' to reinitialize schema (data loss)."
      kubectl delete pvc mysql-pvc -n $NAMESPACE --ignore-not-found=true
      # Re-apply PVC after deletion
      kubectl apply -n $NAMESPACE -f ./database/pvc.yaml
    fi

    kubectl apply -n $NAMESPACE -f ./database/service.yaml
    kubectl apply -n $NAMESPACE -f ./database/statefulset.yaml
    wait_statefulset "mysql" "$NAMESPACE"

    # 4) Backend: service then deployment
    write_section "Apply backend"
    kubectl apply -n $NAMESPACE -f ./backend/service.yaml
    kubectl apply -n $NAMESPACE -f ./backend/deployment.yaml
    
    # Apply ServiceMonitor for Prometheus scraping (if exists)
    if [ -f ./backend/servicemonitor.yaml ]; then
      write_step "Applying ServiceMonitor for backend metrics..."
      kubectl apply -n $NAMESPACE -f ./backend/servicemonitor.yaml
    fi
    
    wait_deployment "backend" "$NAMESPACE"

    # 5) Frontend: service then deployment
    write_section "Apply frontend"
    kubectl apply -n $NAMESPACE -f ./frontend/service.yaml
    kubectl apply -n $NAMESPACE -f ./frontend/deployment.yaml
    wait_deployment "frontend" "$NAMESPACE"

    # 6) Ingress: preferred path if controller exists
    write_section "Configure access"
    if test_ingress_controller; then
      write_step "Ingress-NGINX detected; applying ingress rules."
      kubectl apply -n $NAMESPACE -f ./ingress/ingress.yaml
      
      # Apply Prometheus Ingress for monitoring (if exists)
      if [ -f ./monitoring/prometheus-ingress.yaml ]; then
        write_step "Applying Prometheus Ingress for monitoring access..."
        kubectl apply -n $NAMESPACE -f ./monitoring/prometheus-ingress.yaml
      fi
      
      HAS_INGRESS=true
    else
      write_step "Ingress-NGINX not detected; exposing NodePorts as fallback."
      # Patch frontend service to NodePort: 30080
      kubectl patch svc frontend-service -n $NAMESPACE -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":80,"protocol":"TCP","name":"http","nodePort":30080}]}}'
      # Patch backend service to NodePort: 30081
      kubectl patch svc backend-service -n $NAMESPACE -p '{"spec":{"type":"NodePort","ports":[{"port":8080,"targetPort":8080,"protocol":"TCP","name":"http","nodePort":30081}]}}'
      HAS_INGRESS=false
    fi

    # 7) Final status
    write_section "Status"
    kubectl get pods -n $NAMESPACE -o wide
    kubectl get svc -n $NAMESPACE
    if [ "$HAS_INGRESS" = true ]; then
      kubectl get ingress -n $NAMESPACE
    fi

    # 8) Quick checks and endpoints
    write_section "Access"
    if [ "$HAS_INGRESS" = true ]; then
      write_success "Frontend: http://localhost/"
      write_success "API health: http://localhost/api/health"
    else
      write_success "Frontend (NodePort): http://localhost:30080/"
      write_success "API health (NodePort via frontend proxy): http://localhost:30080/api/health"
      write_success "API direct (NodePort): http://localhost:30081/health"
    fi

    # Optional sanity checks (non-blocking)
    sleep 2
    if [ "$HAS_INGRESS" = true ]; then
      HEALTH_URL="http://localhost/api/health"
    else
      HEALTH_URL="http://localhost:30080/api/health"
    fi

    if curl -s -f -m 15 "$HEALTH_URL" &>/dev/null; then
      write_success "Health check: OK"
    else
      write_warning "Health check request failed (will not block deploy)."
    fi

    # If backend not fully available, provide actionable guidance
    BACKEND_STATUS=$(kubectl get deploy backend -n $NAMESPACE -o json 2>/dev/null || echo "{}")
    DESIRED=$(echo "$BACKEND_STATUS" | jq -r '.spec.replicas // 0')
    AVAILABLE=$(echo "$BACKEND_STATUS" | jq -r '.status.availableReplicas // 0')
    
    if [ "$AVAILABLE" -lt "$DESIRED" ]; then
      write_warning "[WARN] backend replicas available: $AVAILABLE/$DESIRED"
      write_warning "       If errors mention Schema-validation or missing columns, run one of:"
      echo "         ./update_sql.sh --backup-first --migrate-audit-columns"
      echo "         ./deploy.sh up --reset-database"
    fi
    ;;

  down)
    write_section "Deleting manifests (ingress -> frontend -> backend -> database)"
    kubectl delete -n $NAMESPACE -f ./ingress --ignore-not-found=true || true
    kubectl delete -n $NAMESPACE -f ./frontend --ignore-not-found=true || true
    kubectl delete -n $NAMESPACE -f ./backend --ignore-not-found=true || true
    kubectl delete -n $NAMESPACE -f ./database --ignore-not-found=true || true
    kubectl delete -f ./namespace.yaml --ignore-not-found=true || true
    ;;

  status)
    write_section "Current status"
    kubectl get pods -n $NAMESPACE -o wide
    kubectl get svc -n $NAMESPACE
    kubectl get ingress -n $NAMESPACE 2>/dev/null || true
    kubectl get pvc -n $NAMESPACE
    ;;

  logs)
    if [ -z "$TARGET" ]; then
      write_error "Please provide --target backend|frontend"
      exit 1
    fi
    write_section "Tailing logs for deployment/$TARGET"
    kubectl logs -n $NAMESPACE deployment/$TARGET -f --tail=200
    ;;

  restart)
    if [ -z "$TARGET" ]; then
      write_error "Please provide --target backend|frontend"
      exit 1
    fi
    write_section "Rolling restart deployment/$TARGET"
    kubectl rollout restart deployment/$TARGET -n $NAMESPACE
    kubectl rollout status deployment/$TARGET -n $NAMESPACE
    ;;

  *)
    write_error "Unknown command: $COMMAND"
    echo "Usage: $0 {up|down|status|logs|restart} [OPTIONS]"
    exit 1
    ;;
esac



#Make executable
# chmod +x deploy.sh

#Deploy everything
# ./deploy.sh up

#Deploy without building images
# ./deploy.sh up --skip-build

#Deploy with database reset
# ./deploy.sh up --reset-database

#Check status
# ./deploy.sh status

#View logs
# ./deploy.sh logs --target backend

#Restart a service
# ./deploy.sh restart --target frontend

#Tear down
# ./deploy.sh down