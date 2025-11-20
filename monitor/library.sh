#!/bin/bash
#
# Shared library functions for monitoring scripts
# Source this file in other scripts: source "$(dirname "$0")/library.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check if Helm is installed
check_helm() {
  if ! command -v helm &> /dev/null; then
    print_error "Helm is not installed!"
    echo ""
    echo "Please install Helm first:"
    echo "  • Linux/macOS: curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
    echo "  • Or visit: https://helm.sh/docs/intro/install/"
    return 1
  fi
  
  local HELM_VERSION=$(helm version --short 2>/dev/null | cut -d' ' -f1)
  print_success "Helm is installed (${HELM_VERSION})"
  return 0
}

# Check if kubectl is configured
check_kubectl() {
  if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed!"
    return 1
  fi
  
  if ! kubectl cluster-info &> /dev/null; then
    print_error "kubectl is not configured or cluster is not reachable!"
    return 1
  fi
  
  print_success "kubectl is configured"
  return 0
}

# Install Helm if not present
install_helm() {
  print_header "Installing Helm"
  
  if command -v helm &> /dev/null; then
    print_warning "Helm is already installed"
    return 0
  fi
  
  print_info "Downloading and installing Helm..."
  
  # Detect OS
  case "$(uname -s)" in
    Linux*)
      curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
      ;;
    Darwin*)
      if command -v brew &> /dev/null; then
        brew install helm
      else
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
      fi
      ;;
    *)
      print_error "Unsupported operating system"
      return 1
      ;;
  esac
  
  if [ $? -eq 0 ]; then
    print_success "Helm installed successfully"
    return 0
  else
    print_error "Failed to install Helm"
    return 1
  fi
}

# Wait for pods to be ready
wait_for_pods() {
  local NAMESPACE=$1
  local LABEL=$2
  local TIMEOUT=${3:-300}
  
  print_info "Waiting for pods to be ready (timeout: ${TIMEOUT}s)..."
  
  if kubectl wait --for=condition=ready pod -l "$LABEL" -n "$NAMESPACE" --timeout="${TIMEOUT}s" &> /dev/null; then
    print_success "All pods are ready"
    return 0
  else
    print_warning "Some pods may not be ready yet"
    return 1
  fi
}

# Get pod status summary
get_pod_status() {
  local NAMESPACE=$1
  local LABEL=$2
  
  kubectl get pods -n "$NAMESPACE" -l "$LABEL" --no-headers 2>/dev/null | awk '{
    total++
    if ($2 ~ /^[0-9]+\/[0-9]+$/) {
      split($2, a, "/")
      if (a[1] == a[2]) ready++
    }
    if ($3 == "Running") running++
  }
  END {
    printf "%d total, %d running, %d ready", total, running, ready
  }'
}

# Check if resource exists
resource_exists() {
  local RESOURCE_TYPE=$1
  local RESOURCE_NAME=$2
  local NAMESPACE=$3
  
  if [ -n "$NAMESPACE" ]; then
    kubectl get "$RESOURCE_TYPE" "$RESOURCE_NAME" -n "$NAMESPACE" &> /dev/null
  else
    kubectl get "$RESOURCE_TYPE" "$RESOURCE_NAME" &> /dev/null
  fi
  
  return $?
}

# Ensure namespace exists
ensure_namespace() {
  local NAMESPACE=$1
  
  if kubectl get namespace "$NAMESPACE" &> /dev/null; then
    print_success "Namespace '$NAMESPACE' exists"
    return 0
  else
    print_info "Creating namespace '$NAMESPACE'..."
    if kubectl create namespace "$NAMESPACE"; then
      print_success "Namespace '$NAMESPACE' created"
      return 0
    else
      print_error "Failed to create namespace '$NAMESPACE'"
      return 1
    fi
  fi
}

# Add Helm repository
add_helm_repo() {
  local REPO_NAME=$1
  local REPO_URL=$2
  
  if helm repo list 2>/dev/null | grep -q "^${REPO_NAME}"; then
    print_warning "Repository '$REPO_NAME' already exists"
  else
    print_info "Adding Helm repository '$REPO_NAME'..."
    if helm repo add "$REPO_NAME" "$REPO_URL"; then
      print_success "Repository '$REPO_NAME' added"
    else
      print_error "Failed to add repository '$REPO_NAME'"
      return 1
    fi
  fi
  
  print_info "Updating Helm repositories..."
  if helm repo update; then
    print_success "Helm repositories updated"
    return 0
  else
    print_error "Failed to update Helm repositories"
    return 1
  fi
}

# Get secret value
get_secret_value() {
  local SECRET_NAME=$1
  local KEY=$2
  local NAMESPACE=$3
  
  kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath="{.data.$KEY}" 2>/dev/null | base64 --decode
}

# Cleanup function
cleanup() {
  local EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    print_error "Script failed with exit code $EXIT_CODE"
  fi
  exit $EXIT_CODE
}

# Set trap for cleanup
trap cleanup EXIT INT TERM
