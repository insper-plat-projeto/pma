# Uso de IA

O enunciado permite uso parcial de IA, desde que documentado. Esta página registra o uso pelo Douglas (Gateway, Auth, load balancing, vulnerability scanning, CI/CD e EKS). Ferramenta: Claude Code (Anthropic).

## Como foi usada

**De 02/11 a 20/11 (manhã): tutor.** A IA explicava conceitos, apontava o material do curso e revisava o código escrito pelo aluno, sem escrever o código do projeto. Nessa fase:

- o aluno escreveu o Gateway (rotas, `/health-check`), a biblioteca `auth` (DTOs e `AuthController`) e digitou o `auth-service` a partir do hands-on 3;
- a IA diagnosticou erros de Git com submódulos, de Maven (versão do Java, dependências) e de Spring Cloud Gateway (chaves de configuração), explicando a causa de cada um;
- a IA corrigiu, a pedido, o pacote e as versões do `auth-service`.

**20/11 (tarde e noite): par de implementação.** Por causa do prazo, a IA passou a escrever código e configuração, e o aluno rodou, revisou, testou e publicou. Escrito pela IA nessa fase:

- integração de Gateway e Auth no `compose.yaml`, rota do Exchange e healthcheck do PostgreSQL;
- load balancer nginx com 2 réplicas do Gateway;
- `Jenkinsfile` dos quatro repositórios, com o estágio do Trivy, e a pasta `jenkins/` (baseada no hands-on 4);
- manifestos do Kubernetes, HPA e scripts de deploy e de carga em `k8s/`;
- esta documentação (MkDocs).

## O que foi verificado

Todo o código foi executado antes de entrar no repositório: testes de ponta a ponta no Compose (login, cookie, rotas protegidas, `401` nos casos inválidos), alternância entre réplicas no load balancer, scan do Trivy nas imagens e deploy no EKS. Os resultados estão nas páginas de cada entrega.

## O que o aluno precisa saber defender

- Fluxo do login até o `id-account` (Gateway, `RouterValidator`, `AuthorizationFilter`, `/auth/solve`).
- Por que o token vai em cookie `HttpOnly` e não no corpo da resposta.
- Interface (`auth`) versus implementação (`auth-service`) e o papel do Feign.
- Como o nginx e o HPA distribuem a carga, e por que o Trivy bloqueia o pipeline.
