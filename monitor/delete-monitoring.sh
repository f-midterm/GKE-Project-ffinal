#!/bin/bash
#
# Delete Monitoring Stack
#
# Usage:
#   ./delete-monitoring.sh [OPTIONS]
#
# Options:
#   --namespace <name>    - Target namespace (default: superproject-ns)
#   --delete-pvcs         - Also delete PersistentVolumeClaims
#   --delete-namespace    - Also delete the namespace
#   --force               - Skip confirmation prompts
#
# Description:
#   Removes the monitoring stack deployed by deploy-monitoring.sh

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
DELETE_PVCS=false
DELETE_NAMESPACE=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --delete-pvcs)
      DELETE_PVCS=true
      shift
      ;;
    --delete-namespace)
      DELETE_NAMESPACE=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --namespace <name>    Target namespace (default: superproject-ns)"
      echo "  --delete-pvcs         Also delete PersistentVolumeClaims (data will be lost!)"
      echo "  --delete-namespace    Also delete the namespace"
      echo "  --force               Skip confirmation prompts"
      echo "  --help, -h            Show this help message"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Confirm deletion
confirm_deletion() {
  if [ "$FORCE" = true ]; then
    return 0
  fi
  
  echo ""
  print_warning "You are about to delete the monitoring stack from namespace: ${NAMESPACE}"
  if [ "$DELETE_PVCS" = true ]; then
    print_warning "PersistentVolumeClaims will also be deleted (DATA LOSS!)"
  fi
  if [ "$DELETE_NAMESPACE" = true ]; then
    print_warning "The entire namespace will be deleted"
  fi
  echo ""
  read -p "Are you sure? (yes/no): " -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Deletion cancelled"
    exit 0
  fi
}

# Uninstall Helm release
uninstall_helm_release() {
  print_header "Uninstalling Helm Release"
  
  if helm list -n "${NAMESPACE}" 2>/dev/null | grep -q "^${RELEASE_NAME}"; then
    print_info "Uninstalling Helm release '${RELEASE_NAME}'..."
    if helm uninstall "${RELEASE_NAME}" --namespace "${NAMESPACE}"; then
      print_success "Helm release '${RELEASE_NAME}' removed"
    else
      print_error "Failed to uninstall Helm release"
      return 1
    fi
  else
    print_warning "Helm release '${RELEASE_NAME}' not found in namespace '${NAMESPACE}'"
  fi
}

# Delete Grafana secret
delete_grafana_secret() {
  print_header "Deleting Grafana Admin Secret"
  
  if resource_exists "secret" "grafana-admin-secret" "${NAMESPACE}"; then
    print_info "Deleting Grafana admin secret..."
    if kubectl delete secret grafana-admin-secret -n "${NAMESPACE}" --ignore-not-found=true; then
      print_success "Grafana admin secret deleted"
    fi
  else
    print_info "Grafana admin secret not found (already deleted or never created)"
  fi
}

# Delete PVCs
delete_pvcs() {
  if [ "$DELETE_PVCS" != true ]; then
    print_header "Skipping PVC Deletion"
    print_warning "PersistentVolumeClaims are NOT deleted"
    echo ""
    echo "To delete them manually:"
    echo "  kubectl delete pvc -n ${NAMESPACE} -l app.kubernetes.io/instance=${RELEASE_NAME}"
    return 0
  fi
  
  print_header "Deleting PersistentVolumeClaims"
  
  local PVCS=$(kubectl get pvc -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${RELEASE_NAME}" -o name 2>/dev/null || true)
  
  if [ -z "$PVCS" ]; then
    print_info "No PVCs found for release '${RELEASE_NAME}'"
    return 0
  fi
  
  print_warning "Deleting PVCs (data will be permanently lost!)..."
  echo "$PVCS"
  echo ""
  
  if kubectl delete pvc -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${RELEASE_NAME}"; then
    print_success "PVCs deleted"
  else
    print_warning "Some PVCs may not have been deleted"
  fi
}

# Delete ServiceMonitors
delete_servicemonitors() {
  print_header "Cleaning Up ServiceMonitors"
  
  local SERVICEMONITORS=$(kubectl get servicemonitor -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${RELEASE_NAME}" -o name 2>/dev/null || true)
  
  if [ -z "$SERVICEMONITORS" ]; then
    print_info "No ServiceMonitors found"
    return 0
  fi
  
  print_info "Deleting ServiceMonitors..."
  if kubectl delete servicemonitor -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${RELEASE_NAME}" --ignore-not-found=true; then
    print_success "ServiceMonitors deleted"
  fi
}

# Delete namespace
delete_namespace_if_requested() {
  if [ "$DELETE_NAMESPACE" != true ]; then
    return 0
  fi
  
  print_header "Deleting Namespace"
  
  print_warning "Deleting namespace '${NAMESPACE}' (this will delete ALL resources in it)..."
  
  if kubectl delete namespace "${NAMESPACE}" --timeout=60s; then
    print_success "Namespace '${NAMESPACE}' deleted"
  else
    print_error "Failed to delete namespace '${NAMESPACE}'"
    return 1
  fi
}

# Show remaining resources
show_remaining_resources() {
  print_header "Checking Remaining Resources"
  
  if [ "$DELETE_NAMESPACE" = true ]; then
    print_info "Namespace was deleted, no resources remaining"
    return 0
  fi
  
  local PODS=$(kubectl get pods -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${RELEASE_NAME}" -o name 2>/dev/null || true)
  local PVCS=$(kubectl get pvc -n "${NAMESPACE}" -l "app.kubernetes.io/instance=${RELEASE_NAME}" -o name 2>/dev/null || true)
  
  if [ -z "$PODS" ] && [ -z "$PVCS" ]; then
    print_success "All monitoring resources have been removed"
  else
    if [ -n "$PODS" ]; then
      print_warning "Some pods are still terminating:"
      echo "$PODS"
    fi
    if [ -n "$PVCS" ]; then
      print_info "PVCs still exist (as expected):"
      echo "$PVCS"
    fi
  fi
}

# Main execution
main() {
  print_header "Monitoring Stack Deletion"
  
  # Check if kubectl is available
  if ! check_kubectl; then
    exit 1
  fi
  
  # Check if namespace exists
  if ! resource_exists "namespace" "${NAMESPACE}"; then
    print_warning "Namespace '${NAMESPACE}' does not exist"
    print_info "Nothing to delete"
    exit 0
  fi
  
  # Confirm deletion
  confirm_deletion
  
  # Uninstall Helm release
  uninstall_helm_release
  
  # Delete Grafana secret
  delete_grafana_secret
  
  # Delete ServiceMonitors
  delete_servicemonitors
  
  # Delete PVCs if requested
  delete_pvcs
  
  # Delete namespace if requested
  delete_namespace_if_requested
  
  # Show remaining resources
  show_remaining_resources
  
  print_header "Deletion Complete"
  print_success "Monitoring stack has been removed!"
  
  if [ "$DELETE_PVCS" != true ]; then
    echo ""
    print_info "Note: PVCs were not deleted. To remove them:"
    echo "  ./delete-monitoring.sh --delete-pvcs"
  fi
}

# Run main function
main
