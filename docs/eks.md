# AWS, EKS e load test

Conta AWS do grupo (`pmapi-bcc-grupo11`), acesso pelo IAM Identity Center com `aws sso login`, região `us-east-1`.

## Cluster

Criado com `eksctl`, que monta a VPC (2 zonas, subnets públicas e privadas), o control plane e um node group gerenciado:

``` bash
eksctl create cluster --name store --region us-east-1 \
  --nodegroup-name store-nodes --node-type t3.medium \
  --nodes 2 --nodes-min 2 --nodes-max 4 --managed
```

O material do curso cria a VPC por um template CloudFormation no console. O `eksctl` faz o mesmo (também usa CloudFormation) num só comando, e já instala o `metrics-server` como add-on, que o HPA precisa.

## Deploy

Manifestos em `k8s/`:

| Arquivo | Conteúdo |
|---|---|
| `data.yaml` | PostgreSQL e Redis (Deployment + Service), credenciais do banco em `Secret` |
| `services.yaml` | Account, Auth, Exchange e Gateway; Service `gateway` do tipo `LoadBalancer`; HPA do Gateway |
| `deploy.sh` | configura o kubeconfig, cria o `Secret` do JWT com chave aleatória e aplica os manifestos |
| `load-test.sh` | sobe pods geradores de carga dentro do cluster |

Os Services têm os mesmos nomes dos hosts do Compose (`account`, `auth`, `exchange`, `db`, `redis`), então o código roda sem mudança.

``` bash
export AWS_PROFILE=pma
./k8s/deploy.sh
```

## HPA e load test

``` yaml
minReplicas: 1
maxReplicas: 10
averageUtilization: 50   # % da CPU pedida (requests.cpu: 250m)
```

Três terminais, como no exemplo do curso:

``` bash
kubectl get hpa gateway --watch
kubectl get pods -l app=gateway --watch
./k8s/load-test.sh          # para: kubectl delete pod -l role=load-generator
```

<!-- EVIDENCIAS: preencher com a saída real do kubectl e o link do vídeo -->

## Limpeza

O EKS cobra por hora. Depois do vídeo:

``` bash
kubectl delete -f k8s/services.yaml   # remove o load balancer da AWS antes do cluster
eksctl delete cluster --name store --region us-east-1
```
