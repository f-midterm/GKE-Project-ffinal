#!/bin/bash
#
# Library script to install and configure prerequisites for Kubernetes deployment.
#
# This script installs:
#   - Docker (if not present)
#   - K3s (lightweight Kubernetes)
#   - kubectl (Kubernetes CLI)
#   - jq (JSON processor)
#   - curl (HTTP client)
#
# Usage:
#   ./library.sh [COMMAND] [OPTIONS]
#
# Commands:
#   install-all      - Install all prerequisites (Docker, K3s, kubectl, jq)
#   install-docker   - Install Docker only
#   install-k3s      - Install K3s only
#   install-tools    - Install kubectl and jq only
#   check            - Check status of all prerequisites
#   uninstall-k3s    - Uninstall K3s
#   help             - Show this help message
#
# Options:
#   --no-docker      - Skip Docker installation
#   --no-k3s         - Skip K3s installation
#   --k3s-version    - Specify K3s version (default: latest stable)
#
# Examples:
#   ./library.sh install-all
#   ./library.sh install-all --no-docker
#   ./library.sh check
#   ./library.sh install-k3s --k3s-version v1.28.3+k3s1

set -e

# Default values
COMMAND="${1:-help}"
SKIP_DOCKER=false
SKIP_K3S=false
K3S_VERSION=""

# Parse arguments
shift 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-docker)
      SKIP_DOCKER=true
      shift
      ;;
    --no-k3s)
      SKIP_K3S=true
      shift
      ;;
    --k3s-version)
      K3S_VERSION="$2"
      shift 2
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
  echo -e "\033[1;32m✓ $1\033[0m"
}

write_error() {
  echo -e "\033[1;31m✗ $1\033[0m"
}

write_info() {
  echo -e "\033[0;34mℹ $1\033[0m"
}

# Check if running as root
check_root() {
  if [ "$EUID" -ne 0 ]; then
    write_error "This script must be run as root or with sudo"
    exit 1
  fi
}

# Detect OS
detect_os() {
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
  else
    write_error "Cannot detect OS. /etc/os-release not found."
    exit 1
  fi
  write_info "Detected OS: $OS $VER"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Install Docker
install_docker() {
  write_section "Installing Docker"
  
  if command_exists docker; then
    write_success "Docker is already installed ($(docker --version))"
    return 0
  fi

  write_step "Installing Docker..."
  
  case $OS in
    ubuntu|debian)
      # Remove old versions
      apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
      
      # Update package index
      apt-get update
      
      # Install prerequisites
      apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
      
      # Add Docker's official GPG key
      install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      chmod a+r /etc/apt/keyrings/docker.gpg
      
      # Set up repository
      echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
      
      # Install Docker Engine
      apt-get update
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
      
    centos|rhel|fedora)
      # Remove old versions
      yum remove -y docker docker-client docker-client-latest docker-common docker-latest \
        docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
      
      # Install prerequisites
      yum install -y yum-utils
      
      # Add Docker repository
      yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      
      # Install Docker Engine
      yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
      
    *)
      write_warning "Unsupported OS for automatic Docker installation: $OS"
      write_info "Please install Docker manually from https://docs.docker.com/engine/install/"
      return 1
      ;;
  esac
  
  # Start and enable Docker
  systemctl start docker
  systemctl enable docker
  
  # Add current user to docker group (if not root)
  if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    write_info "Added $SUDO_USER to docker group. Please log out and back in for changes to take effect."
  fi
  
  write_success "Docker installed successfully ($(docker --version))"
}

# Install K3s
install_k3s() {
  write_section "Installing K3s"
  
  if command_exists k3s; then
    write_success "K3s is already installed ($(k3s --version | head -n1))"
    return 0
  fi

  write_step "Installing K3s..."
  
  # Prepare installation command
  INSTALL_CMD="curl -sfL https://get.k3s.io | sh -s -"
  
  # Add version if specified
  if [ -n "$K3S_VERSION" ]; then
    INSTALL_CMD="curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=$K3S_VERSION sh -s -"
    write_info "Installing K3s version: $K3S_VERSION"
  else
    write_info "Installing latest stable K3s version"
  fi
  
  # Install K3s with Docker as container runtime
  if command_exists docker; then
    eval "$INSTALL_CMD --docker"
  else
    eval "$INSTALL_CMD"
  fi
  
  # Wait for K3s to be ready
  write_step "Waiting for K3s to be ready..."
  for i in {1..30}; do
    if k3s kubectl get nodes >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  
  # Set up kubeconfig for regular user
  if [ -n "$SUDO_USER" ]; then
    SUDO_HOME=$(eval echo ~$SUDO_USER)
    mkdir -p $SUDO_HOME/.kube
    cp /etc/rancher/k3s/k3s.yaml $SUDO_HOME/.kube/config
    chown -R $SUDO_USER:$SUDO_USER $SUDO_HOME/.kube
    chmod 600 $SUDO_HOME/.kube/config
    write_info "Kubeconfig copied to $SUDO_HOME/.kube/config"
  fi
  
  # Create symlink for kubectl if not exists
  if ! command_exists kubectl; then
    ln -s /usr/local/bin/k3s /usr/local/bin/kubectl 2>/dev/null || true
  fi
  
  write_success "K3s installed successfully"
  k3s kubectl get nodes
}

# Install additional tools
install_tools() {
  write_section "Installing additional tools"
  
  # Install jq
  if command_exists jq; then
    write_success "jq is already installed ($(jq --version))"
  else
    write_step "Installing jq..."
    case $OS in
      ubuntu|debian)
        apt-get install -y jq
        ;;
      centos|rhel|fedora)
        yum install -y jq
        ;;
      *)
        write_warning "Cannot auto-install jq for OS: $OS"
        ;;
    esac
    if command_exists jq; then
      write_success "jq installed successfully"
    fi
  fi
  
  # Install curl
  if command_exists curl; then
    write_success "curl is already installed"
  else
    write_step "Installing curl..."
    case $OS in
      ubuntu|debian)
        apt-get install -y curl
        ;;
      centos|rhel|fedora)
        yum install -y curl
        ;;
      *)
        write_warning "Cannot auto-install curl for OS: $OS"
        ;;
    esac
    if command_exists curl; then
      write_success "curl installed successfully"
    fi
  fi
  
  # Ensure kubectl is available
  if ! command_exists kubectl; then
    if command_exists k3s; then
      write_step "Creating kubectl symlink..."
      ln -s /usr/local/bin/k3s /usr/local/bin/kubectl 2>/dev/null || true
      write_success "kubectl symlink created"
    else
      write_step "Installing kubectl..."
      curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
      install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
      rm kubectl
      write_success "kubectl installed successfully"
    fi
  else
    write_success "kubectl is already installed ($(kubectl version --client --short 2>/dev/null || kubectl version --client))"
  fi
}

# Check prerequisites
check_prerequisites() {
  write_section "Checking prerequisites"
  
  local all_ok=true
  
  # Check Docker
  if command_exists docker; then
    write_success "Docker: $(docker --version)"
    if systemctl is-active --quiet docker; then
      write_success "Docker service: running"
    else
      write_warning "Docker service: not running"
      all_ok=false
    fi
  else
    write_error "Docker: not installed"
    all_ok=false
  fi
  
  # Check K3s
  if command_exists k3s; then
    write_success "K3s: $(k3s --version | head -n1)"
    if systemctl is-active --quiet k3s; then
      write_success "K3s service: running"
      
      # Check K3s nodes
      if k3s kubectl get nodes >/dev/null 2>&1; then
        write_success "K3s cluster: accessible"
        k3s kubectl get nodes
      else
        write_warning "K3s cluster: not accessible"
        all_ok=false
      fi
    else
      write_warning "K3s service: not running"
      all_ok=false
    fi
  else
    write_error "K3s: not installed"
    all_ok=false
  fi
  
  # Check kubectl
  if command_exists kubectl; then
    write_success "kubectl: installed"
  else
    write_error "kubectl: not installed"
    all_ok=false
  fi
  
  # Check jq
  if command_exists jq; then
    write_success "jq: $(jq --version)"
  else
    write_warning "jq: not installed (recommended for deploy.sh)"
  fi
  
  # Check curl
  if command_exists curl; then
    write_success "curl: installed"
  else
    write_error "curl: not installed"
    all_ok=false
  fi
  
  echo ""
  if [ "$all_ok" = true ]; then
    write_success "All prerequisites are met! You can run ./deploy.sh"
  else
    write_warning "Some prerequisites are missing. Run './library.sh install-all' to install them."
  fi
  
  return 0
}

# Uninstall K3s
uninstall_k3s() {
  write_section "Uninstalling K3s"
  
  if [ -f /usr/local/bin/k3s-uninstall.sh ]; then
    write_step "Running K3s uninstall script..."
    /usr/local/bin/k3s-uninstall.sh
    write_success "K3s uninstalled successfully"
  else
    write_warning "K3s uninstall script not found. K3s may not be installed."
  fi
}

# Show help
show_help() {
  cat << EOF

\033[1;36mKubernetes Prerequisites Installer\033[0m

This script installs and configures all prerequisites needed to run ./deploy.sh

\033[1mCommands:\033[0m
  install-all      Install all prerequisites (Docker, K3s, kubectl, jq)
  install-docker   Install Docker only
  install-k3s      Install K3s only
  install-tools    Install kubectl and jq only
  check            Check status of all prerequisites
  uninstall-k3s    Uninstall K3s
  help             Show this help message

\033[1mOptions:\033[0m
  --no-docker      Skip Docker installation
  --no-k3s         Skip K3s installation
  --k3s-version    Specify K3s version (default: latest stable)

\033[1mExamples:\033[0m
  sudo ./library.sh install-all
  sudo ./library.sh install-all --no-docker
  sudo ./library.sh check
  sudo ./library.sh install-k3s --k3s-version v1.28.3+k3s1
  sudo ./library.sh uninstall-k3s

\033[1mQuick Start:\033[0m
  1. Make the script executable:
     chmod +x library.sh
  
  2. Install all prerequisites:
     sudo ./library.sh install-all
  
  3. Check installation:
     sudo ./library.sh check
  
  4. Deploy your application:
     ./deploy.sh up

\033[1mNotes:\033[0m
  - This script must be run as root or with sudo
  - Supported OS: Ubuntu, Debian, CentOS, RHEL, Fedora
  - K3s is a lightweight Kubernetes distribution perfect for development
  - After installation, you may need to log out and back in for Docker group changes

EOF
}

# Main execution
case $COMMAND in
  install-all)
    check_root
    detect_os
    
    if [ "$SKIP_DOCKER" = false ]; then
      install_docker
    else
      write_info "Skipping Docker installation (--no-docker specified)"
    fi
    
    if [ "$SKIP_K3S" = false ]; then
      install_k3s
    else
      write_info "Skipping K3s installation (--no-k3s specified)"
    fi
    
    install_tools
    
    write_section "Installation Complete!"
    check_prerequisites
    
    echo ""
    write_success "All prerequisites installed successfully!"
    write_info "You can now run: ./deploy.sh up"
    ;;
    
  install-docker)
    check_root
    detect_os
    install_docker
    ;;
    
  install-k3s)
    check_root
    detect_os
    install_k3s
    install_tools
    ;;
    
  install-tools)
    check_root
    detect_os
    install_tools
    ;;
    
  check)
    check_prerequisites
    ;;
    
  uninstall-k3s)
    check_root
    uninstall_k3s
    ;;
    
  help|--help|-h)
    show_help
    ;;
    
  *)
    write_error "Unknown command: $COMMAND"
    show_help
    exit 1
    ;;
esac
