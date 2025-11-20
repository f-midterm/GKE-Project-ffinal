#!/bin/bash
#
# Deploy Prometheus & Grafana Monitoring Stack
#
# Usage:
#   ./deploy-monitoring.sh [OPTIONS]
#
# Options:
#   --namespace <name>   - Target namespace (default: superproject-ns)
#   --install-helm       - Auto-install Helm if not present
#
# Description:
#   Installs kube-prometheus-stack using Helm with custom values
#   Includes Prometheus, Grafana, and ServiceMonitors

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source library functions
if [ -f "$SCRIPT_DIR/library.sh" ]; then
  source "$SCRIPT_DIR/library.sh"
else
  echo "Error: library.sh not found in $SCRIPT_DIR"
  exit 1
fi

# Configuration
NAMESPACE="superproject-ns"
RELEASE_NAME="monitoring"
HELM_REPO_NAME="prometheus-community"
HELM_REPO_URL="https://prometheus-community.github.io/helm-charts"
CHART_NAME="kube-prometheus-stack"
AUTO_INSTALL_HELM=false

VALUES_FILE="${SCRIPT_DIR}/values.yaml"
GRAFANA_SECRET_FILE="${SCRIPT_DIR}/grafana-admin-secret.yaml"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --install-helm)
      AUTO_INSTALL_HELM=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --namespace <name>   Target namespace (default: superproject-ns)"
      echo "  --install-helm       Auto-install Helm if not present"
      echo "  --help, -h           Show this help message"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check kubectl
  if ! check_kubectl; then
    exit 1
  fi
  
  # Check Helm or install if requested
  if ! check_helm; then
    if [ "$AUTO_INSTALL_HELM" = true ]; then
      if ! install_helm; then
        print_error "Failed to install Helm automatically"
        echo ""
        echo "Please install Helm manually:"
        echo "  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
        exit 1
      fi
    else
      print_error "Helm is not installed!"
      echo ""
      echo "Options:"
      echo "  1. Run with --install-helm flag: ./deploy-monitoring.sh --install-helm"
      echo "  2. Install manually: curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
      exit 1
    fi
  fi
  
  # Check values file
  if [[ ! -f "$VALUES_FILE" ]]; then
    print_error "Values file not found: $VALUES_FILE"
    exit 1
  fi
  print_success "Values file found: $VALUES_FILE"
}

# Apply Grafana admin secret
apply_grafana_secret() {
  print_header "Applying Grafana Admin Secret"
  
  if [[ ! -f "$GRAFANA_SECRET_FILE" ]]; then
    print_warning "Grafana secret file not found: $GRAFANA_SECRET_FILE"
    print_info "Skipping secret creation (will use Helm defaults)"
    return 0
  fi
  
  print_info "Applying Grafana admin secret..."
  if kubectl apply -f "${GRAFANA_SECRET_FILE}" -n "${NAMESPACE}"; then
    print_success "Grafana admin secret applied"
  else
    print_warning "Failed to apply secret (may already exist)"
  fi
}

# Install monitoring stack
install_monitoring() {
  print_header "Installing/Upgrading Monitoring Stack"
  
  print_info "Installing ${CHART_NAME} using Helm..."
  echo ""
  
  if helm upgrade --install "${RELEASE_NAME}" \
    "${HELM_REPO_NAME}/${CHART_NAME}" \
    --namespace "${NAMESPACE}" \
    --values "${VALUES_FILE}" \
    --wait \
    --timeout 10m; then
    
    echo ""
    print_success "Monitoring stack deployed successfully!"
    return 0
  else
    echo ""
    print_error "Failed to deploy monitoring stack"
    return 1
  fi
}

# Show access information
show_access_info() {
  print_header "Access Information"
  
  echo -e "${GREEN}Grafana Dashboard:${NC}"
  echo "  URL: http://grafana.localhost"
  echo "  Username: admin"
  echo ""
  echo "To get the Grafana admin password:"
  echo "  kubectl get secret grafana-admin-secret -n ${NAMESPACE} -o jsonpath='{.data.admin-password}' | base64 --decode; echo"
  echo ""
  echo -e "${GREEN}Prometheus:${NC}"
  echo "  Access via port-forward:"
  echo "  kubectl port-forward -n ${NAMESPACE} svc/${RELEASE_NAME}-kube-prometheus-prometheus 9090:9090"
  echo "  Then visit: http://localhost:9090"
  echo ""
  echo -e "${YELLOW}Important:${NC}"
  echo "  Add to /etc/hosts (Linux/macOS) or C:\\Windows\\System32\\drivers\\etc\\hosts (Windows):"
  echo "  127.0.0.1 grafana.localhost"
  echo ""
  echo -e "${BLUE}Next Steps:${NC}"
  echo "  1. Update hosts file with the entry above"
  echo "  2. Visit http://grafana.localhost"
  echo "  3. Login with admin credentials"
  echo "  4. Import dashboard: ${SCRIPT_DIR}/grafana-dashboard-backend.json"
}

# Wait for pods
wait_for_deployment() {
  print_header "Waiting for Pods to be Ready"
  
  print_info "This may take a few minutes..."
  
  if wait_for_pods "${NAMESPACE}" "app.kubernetes.io/instance=${RELEASE_NAME}" 300; then
    local POD_STATUS=$(get_pod_status "${NAMESPACE}" "app.kubernetes.io/instance=${RELEASE_NAME}")
    print_success "Pods are ready: ${POD_STATUS}"
    return 0
  else
    print_warning "Some pods may still be starting"
    echo ""
    echo "Check pod status with:"
    echo "  kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}"
    return 1
  fi
}

# Main execution
main() {
  print_header "Monitoring Stack Deployment"
  
  # Check prerequisites
  check_prerequisites
  
  # Ensure namespace exists
  print_header "Ensuring Namespace"
  ensure_namespace "${NAMESPACE}"
  
  # Setup Helm repository
  print_header "Setting Up Helm Repository"
  add_helm_repo "${HELM_REPO_NAME}" "${HELM_REPO_URL}"
  
  # Apply Grafana secret
  apply_grafana_secret
  
  # Install monitoring stack
  if ! install_monitoring; then
    exit 1
  fi
  
  # Wait for pods
  wait_for_deployment
  
  # Show access information
  show_access_info
  
  print_header "Deployment Complete"
  print_success "Monitoring stack is now running!"
  echo ""
  print_info "Run ./test-monitoring.sh to verify the installation"
}

# Run main function
main
