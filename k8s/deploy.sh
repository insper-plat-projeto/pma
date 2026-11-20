#!/usr/bin/env bash
# Deploys the store on the EKS cluster "store" (us-east-1).
# Requires: AWS_PROFILE with access to the account, kubectl, and the images on Docker Hub.
set -euo pipefail

cd "$(dirname "$0")"

REGION=${REGION:-us-east-1}
REGISTRY=${REGISTRY:-dody16} # Docker Hub user, the same one Jenkins pushes to

aws eks update-kubeconfig --name store --region "$REGION"

# the HPA reads CPU use from the metrics-server, installed by eksctl as an EKS add-on
kubectl get deployment metrics-server -n kube-system >/dev/null

# JWT key generated once and kept in a Secret, never in the repository
kubectl get secret jwt >/dev/null 2>&1 || \
  kubectl create secret generic jwt --from-literal=JWT_SECRET_KEY="$(openssl rand -base64 32)"

kubectl apply -f data.yaml
kubectl rollout status deployment/db --timeout=180s

# ${REGISTRY} in the manifest becomes the Docker Hub user
sed "s#\${REGISTRY}#$REGISTRY#g" services.yaml | kubectl apply -f -
kubectl rollout status deployment/gateway --timeout=300s

echo "Gateway: http://$(kubectl get service gateway -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
