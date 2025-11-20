#!/bin/bash
#
# delete_deploy.sh
# Complete cleanup script for Kubernetes deployment.
#
# Removes all application resources from Kubernetes in the correct order:
#   1. Ingress rules
#   2. Frontend deployment and service
#   3. Backend deployment and service
#   4. MySQL StatefulSet, service, PVC, and ConfigMap
#   5. Secrets
#   6. Namespace (optional)
#
# Usage:
#   ./delete_deploy.sh [OPTIONS]
#
# Options:
#   --keep-namespace    Keep the namespace instead of deleting it
#   --keep-pvc         Keep the PersistentVolumeClaim (preserves database data)
#   --namespace NAME   Target namespace (default: superproject-ns)

set -e

KEEP_NAMESPACE=false
KEEP_PVC=false
NAMESPACE="superproject-ns"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --keep-namespace)
      KEEP_NAMESPACE=true
      shift
      ;;
    --keep-pvc)
      KEEP_PVC=true
      shift
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--keep-namespace] [--keep-pvc] [--namespace NAME]"
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n=== Kubernetes Cleanup Script ==="
echo "Namespace: $NAMESPACE"
echo "Keep namespace: $KEEP_NAMESPACE"
echo "Keep PVC: $KEEP_PVC"
echo ""

# Confirm deletion
read -p "This will delete all application resources in namespace '$NAMESPACE'. Continue? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "[INFO] Cleanup cancelled by user."
    exit 0
fi

echo -e "\n=== Step 1: Delete Ingress ==="
kubectl delete ingress --all -n "$NAMESPACE" --ignore-not-found
sleep 2

echo -e "\n=== Step 2: Delete Frontend ==="
kubectl delete deployment frontend -n "$NAMESPACE" --ignore-not-found
kubectl delete service frontend-service -n "$NAMESPACE" --ignore-not-found
sleep 2

echo -e "\n=== Step 3: Delete Backend ==="
kubectl delete deployment backend -n "$NAMESPACE" --ignore-not-found
kubectl delete service backend-service -n "$NAMESPACE" --ignore-not-found
sleep 2

echo -e "\n=== Step 4: Delete MySQL ==="
kubectl delete statefulset mysql -n "$NAMESPACE" --ignore-not-found
kubectl delete service mysql-service -n "$NAMESPACE" --ignore-not-found
kubectl delete configmap mysql-init-cm -n "$NAMESPACE" --ignore-not-found

if [ "$KEEP_PVC" = false ]; then
    echo "- Deleting PersistentVolumeClaim (database data will be lost)..."
    kubectl delete pvc mysql-pvc -n "$NAMESPACE" --ignore-not-found
else
    echo "[INFO] Keeping PVC mysql-pvc (database data preserved)"
fi

sleep 2

echo -e "\n=== Step 5: Delete Secrets ==="
kubectl delete secret mysql-secret -n "$NAMESPACE" --ignore-not-found
sleep 2

if [ "$KEEP_NAMESPACE" = false ]; then
    echo -e "\n=== Step 6: Delete Namespace ==="
    kubectl delete namespace "$NAMESPACE" --ignore-not-found
    echo "[SUCCESS] Namespace '$NAMESPACE' deleted"
else
    echo -e "\n[INFO] Keeping namespace '$NAMESPACE'"
fi

echo -e "\n=== Cleanup Status ==="
if [ "$KEEP_NAMESPACE" = false ]; then
    echo "[INFO] Namespace deleted. All resources removed."
else
    kubectl get all -n "$NAMESPACE" 2>/dev/null || true
    echo ""
    kubectl get pvc -n "$NAMESPACE" 2>/dev/null || true
fi

echo -e "\n=== Cleanup Complete ==="
echo "[SUCCESS] All requested resources have been removed!"
echo ""
echo "To redeploy:"
echo "  cd k8s"
echo "  ./deploy.sh up"
echo ""
