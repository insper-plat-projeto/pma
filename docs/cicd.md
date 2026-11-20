# CI/CD com Jenkins

O Jenkins roda em container (`jenkins/compose.yaml`), em `http://localhost:9080`, sobre a imagem `jenkins/jenkins:jdk25` com Maven, Docker, kubectl e AWS CLI, como no hands-on 4. O socket do Docker do host é montado no container, então os pipelines montam imagens no Docker da máquina.

``` bash
cd jenkins
docker compose up -d --build
```

## Jobs

Cada repositório tem um `Jenkinsfile` na raiz e um job do tipo *Pipeline script from SCM*:

| Job | Repositório | Estágios |
|---|---|---|
| `account` | pma-account | Build (`mvn install`) |
| `auth` | pma-auth | Dependencies (`account`), Build (`mvn install`) |
| `auth-service` | pma-auth-service | Dependencies (`auth`), Build, Scan Image, Build & Push Image |
| `gateway-service` | pma-gateway-service | Build, Scan Image, Build & Push Image |

O estágio `Dependencies` dispara o job da biblioteca antes (`build job: 'auth', wait: true`), garantindo que o jar da interface no `~/.m2` do Jenkins está atualizado. Por isso o número de executores sobe para 10: com 2, um job ocupa o executor esperando o outro e o pipeline trava.

``` mermaid
flowchart LR
    A[account<br/>mvn install] --> B[auth<br/>mvn install] --> C[auth-service<br/>package]
    C --> D[Trivy] --> E[buildx push<br/>amd64 + arm64] --> F[Docker Hub<br/>dody16/auth]
```

## Credenciais

| ID | Uso |
|---|---|
| `dockerhub-credential` | login no Docker Hub (token de acesso, não a senha) |
| `github-credential` | clonar os repositórios privados da organização |

Os valores ficam no cofre do Jenkins e aparecem mascarados nos logs.

## Imagens publicadas

`dody16/account`, `dody16/auth`, `dody16/gateway` e `dody16/exchange` no Docker Hub, com as tags `latest` e o número do build. São as imagens usadas pelo deploy no EKS.
