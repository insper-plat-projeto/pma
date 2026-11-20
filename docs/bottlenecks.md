# Bottlenecks

O curso lista cinco bottlenecks: caching, observability, messaging, load balancing e vulnerability scanning. Cada integrante entrega ao menos dois.

| Bottleneck | Responsável | Onde |
|---|---|---|
| Caching (Redis no Account) | Matheus | `api/compose.yaml`, `pma-account-service` |
| Observability (Prometheus e Grafana) | Matheus | `api/setup/prometheus`, `api/setup/grafana` |
| Load balancing | Douglas | `api/setup/nginx/nginx.conf`, `api/compose.yaml`, HPA no EKS |
| Vulnerability scanning | Douglas | estágio `Scan Image` nos `Jenkinsfile` do Gateway e do Auth |

## Load balancing (Douglas)

**Problema.** Com um único Gateway, todo o tráfego passa por uma só instância: ela limita a vazão e, se cair, a aplicação inteira fica fora do ar.

**Solução local.** Um nginx (`lb`) publica a porta `8080` e repassa para `gateway:8080`. O Compose sobe 2 réplicas do Gateway (`deploy.replicas: 2`); o DNS do Docker devolve o IP das duas e o nginx alterna entre elas (round robin, padrão do hands-on 7). Se uma réplica para, o nginx passa os pedidos para a outra (checagem passiva).

**Solução no EKS.** O Service `gateway` do tipo `LoadBalancer` cria um load balancer da AWS na frente dos pods, e o HPA ajusta o número de pods de 1 a 10 conforme a CPU. Ver [EKS e load test](eks.md).

**Evidência.**

``` bash
$ for i in 1 2 3 4; do curl -s http://localhost:8080/health-check; echo; done
{"hostname":"2fdecc562ca7"}
{"hostname":"0ed784e7b0d0"}
{"hostname":"2fdecc562ca7"}
{"hostname":"0ed784e7b0d0"}
```

Cada resposta vem de uma réplica diferente.

## Vulnerability scanning (Douglas)

**Problema.** Uma imagem Docker carrega o sistema operacional base e todas as bibliotecas do jar. Uma dependência com vulnerabilidade conhecida pode ir para produção sem ninguém perceber.

**Solução.** O [Trivy](https://trivy.dev) analisa a imagem antes da publicação. No pipeline do Jenkins, o estágio `Scan Image` monta a imagem, roda o Trivy `0.76.2` e **interrompe o build** se houver vulnerabilidade `HIGH` ou `CRITICAL` com correção disponível (`--ignore-unfixed --exit-code 1`). Nada vulnerável chega ao Docker Hub.

``` groovy
stage('Scan Image') {
    steps {
        sh 'docker build -t $SERVICE:scan-$BUILD_ID .'
        sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:$TRIVY_VERSION image --scanners vuln --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 $SERVICE:scan-$BUILD_ID'
    }
}
```

**Evidência (2026-11-20).**

| Imagem | Alvo | HIGH + CRITICAL |
|---|---|---|
| `gateway` | sistema (Ubuntu 26.04) | 0 |
| `gateway` | `app.jar` | 0 |
| `auth` | sistema (Ubuntu 26.04) | 0 |
| `auth` | `app.jar` | 0 |
