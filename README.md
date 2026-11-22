# Store: plataforma de microsserviços

Projeto da disciplina **Plataformas, Microsserviços, DevOps e APIs** (Insper, 2026.2), grupo 11.

**Documentação:** https://insper-plat-projeto.github.io/pma/

**Vídeo de apresentação:** [docs/evidencias/store-douglas.mp4](docs/evidencias/store-douglas.mp4) (também na página inicial da documentação)

Aplicação de compra e venda em microsserviços, com autenticação JWT, câmbio de moedas, cache com Redis, observabilidade (Prometheus e Grafana), load balancer, CI/CD com Jenkins e deploy no Amazon EKS com autoscaling.

## Integrantes

| Integrante | GitHub | Responsável por |
|---|---|---|
| Douglas Celestino | [DouglasCelestino](https://github.com/DouglasCelestino) | Gateway, Auth, load balancer, Trivy, Jenkins, EKS, teste de carga, custos |
| Matheus Lopes Vilar | [matheuslv](https://github.com/matheuslv) | Account, Exchange, front-end, cache com Redis, Prometheus e Grafana |

## Repositórios (submódulos em `api/`)

| Módulo | Repositório |
|---|---|
| Gateway | [pma-gateway-service](https://github.com/insper-plat-projeto/pma-gateway-service) |
| Auth | [pma-auth](https://github.com/insper-plat-projeto/pma-auth) (interface) · [pma-auth-service](https://github.com/insper-plat-projeto/pma-auth-service) |
| Account | [pma-account](https://github.com/insper-plat-projeto/pma-account) (interface) · [pma-account-service](https://github.com/insper-plat-projeto/pma-account-service) |
| Exchange | [pma-exchange-service](https://github.com/insper-plat-projeto/pma-exchange-service) |

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `api/` | submódulos dos serviços, `compose.yaml`, configuração do load balancer, do Prometheus e do Grafana (`api/setup/`) |
| `web/` | front-end (a loja), servido por nginx |
| `jenkins/` | imagem e compose do Jenkins |
| `k8s/` | manifestos do Kubernetes, HPA e scripts de deploy e de carga no EKS |
| `docs/` | documentação em MkDocs, publicada no GitHub Pages |

## Como rodar localmente

``` bash
git clone --recurse-submodules https://github.com/insper-plat-projeto/pma.git
cd pma/api

# os Dockerfiles copiam o target/*.jar: gerar os jars antes
(cd account && mvn -DskipTests clean install)
(cd auth && mvn -DskipTests clean install)
for m in account-service auth-service gateway-service; do (cd $m && mvn -DskipTests clean package); done

docker compose up -d --build          # API em http://localhost:8080
cd ../web && docker compose up -d     # loja em http://localhost
```

| Endereço | O que é |
|---|---|
| `http://localhost` | a loja (front-end) |
| `http://localhost:8080` | a API, pelo load balancer |
| `http://localhost:9090` | Prometheus |
| `http://localhost:3000` | Grafana (`admin` / `admin`) |

Se o repositório já foi clonado sem `--recurse-submodules`: `git submodule update --init --recursive`.
