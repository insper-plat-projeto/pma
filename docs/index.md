# Store: plataforma de microsserviços

Projeto da disciplina **Plataformas, Microsserviços, DevOps e APIs** (Insper, 2026.2), grupo 11.

Aplicação de compra e venda em microsserviços, com autenticação JWT, câmbio de moedas, cache, observabilidade, CI/CD e deploy no Amazon EKS com autoscaling.

## Arquitetura

``` mermaid
flowchart LR
    web[Front-end<br/>nginx :80] -->|fetch, cookie JWT| lb
    subgraph store [Docker Compose / EKS]
        lb[Load balancer<br/>nginx :8080] --> gw1[gateway #1]
        lb --> gw2[gateway #2]
        gw1 & gw2 -->|/auth/**| auth
        gw1 & gw2 -->|/accounts/**| account
        gw1 & gw2 -->|/exchanges/**| exchange
        gw1 & gw2 -.->|POST /auth/solve| auth
        auth -->|Feign| account
        account --> db[(PostgreSQL)]
        account --> redis[(Redis)]
        prometheus --> account & exchange
        grafana --> prometheus
    end
    exchange --> awesome[AwesomeAPI]
```

Todo pedido externo entra pelo load balancer e passa pelo Gateway. O Gateway valida o cookie JWT com o Auth e só então encaminha o pedido, com o header `id-account`. Os serviços internos não têm porta publicada.

## Repositórios

| Módulo | Repositório | Responsável |
|---|---|---|
| Orquestração (Compose, Jenkins, k8s, docs) | [pma](https://github.com/insper-plat-projeto/pma) | grupo |
| Gateway | [pma-gateway-service](https://github.com/insper-plat-projeto/pma-gateway-service) | Douglas |
| Auth (interface) | [pma-auth](https://github.com/insper-plat-projeto/pma-auth) | Douglas |
| Auth (serviço) | [pma-auth-service](https://github.com/insper-plat-projeto/pma-auth-service) | Douglas |
| Account (interface) | [pma-account](https://github.com/insper-plat-projeto/pma-account) | Matheus |
| Account (serviço) | [pma-account-service](https://github.com/insper-plat-projeto/pma-account-service) | Matheus |
| Exchange | [pma-exchange-service](https://github.com/insper-plat-projeto/pma-exchange-service) | Matheus |

## Como rodar localmente

``` bash
git clone --recurse-submodules https://github.com/insper-plat-projeto/pma.git
cd pma/api
# gerar os jars: account e auth com install (interfaces), os serviços com package
docker compose up -d --build
curl http://localhost:8080/health-check
```

O front-end sobe com `docker compose up -d` na pasta `web/` e fica em `http://localhost`.

## Entregas

| Item | Página |
|---|---|
| Gateway | [Gateway](gateway.md) |
| Auth | [Auth](auth.md) |
| Bottlenecks | [Bottlenecks](bottlenecks.md) |
| CI/CD | [CI/CD com Jenkins](cicd.md) |
| AWS, EKS e load test | [EKS e load test](eks.md) |
| Custos, PaaS e SLA | [Custos](custos.md) |
| Uso de IA | [Uso de IA](ia.md) |
