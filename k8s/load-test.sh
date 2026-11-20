#!/usr/bin/env bash
# Load test for the HPA video, based on the course's HPA example.
# Starts WORKERS pods inside the cluster, each one calling the gateway in a loop.
# Watch in other terminals:
#   kubectl get hpa gateway --watch
#   kubectl get pods -l app=gateway --watch
# Stop with: kubectl delete pod -l role=load-generator
set -euo pipefail

WORKERS=${WORKERS:-4}

for i in $(seq 1 "$WORKERS"); do
  kubectl run "load-generator-$i" --labels=role=load-generator --restart=Never --image=busybox:1.36 -- \
    sh -c "while true; do wget -q -O- http://gateway/health-check > /dev/null; done"
done

kubectl get pods -l role=load-generator
