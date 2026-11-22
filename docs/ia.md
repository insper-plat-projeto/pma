# Uso de IA

O enunciado permite uso parcial de IA, desde que documentado. Esta página registra o uso de cada integrante. Ferramenta: Claude Code (Anthropic).

## Douglas (Gateway, Auth, load balancing, vulnerability scanning, CI/CD e EKS)

### Como foi usada

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

### O que foi verificado

Todo o código foi executado antes de entrar no repositório: testes de ponta a ponta no Compose (login, cookie, rotas protegidas, `401` nos casos inválidos), alternância entre réplicas no load balancer, scan do Trivy nas imagens e deploy no EKS. Os resultados estão nas páginas de cada entrega.

### O que o aluno precisa saber defender

- Fluxo do login até o `id-account` (Gateway, `RouterValidator`, `AuthorizationFilter`, `/auth/solve`).
- Por que o token vai em cookie `HttpOnly` e não no corpo da resposta.
- Interface (`auth`) versus implementação (`auth-service`) e o papel do Feign.
- Como o nginx e o HPA distribuem a carga, e por que o Trivy bloqueia o pipeline.

## Matheus Lopes Vilar (Account, Exchange, caching, observability e front-end)

Todas as partes foram feitas em conjunto, a partir do conteúdo da disciplina (aulas, hands-on e o repositório de referência `repo-classes/pma262`) e sob supervisão do aluno. O aluno definiu o escopo e as decisões de cada entrega, acompanhou a implementação, revisou cada mudança, executou os testes e publicou tudo por pull request.

Por causa do prazo curto, a IA foi usada para acelerar o processo: trechos de código, de configuração e desta documentação foram escritos por ela e, em seguida, revisados, testados e ajustados pelo aluno.

### Onde ajudou

- Consulta à documentação da disciplina, para manter cada entrega no padrão dos hands-on.
- Escrita de trechos de código e configuração do Account, do Exchange, do cache, da observabilidade e do front-end.
- Diagnóstico de erros durante a integração com o Gateway e o load balancer, como os dois problemas de CORS descritos em [Front-end](web.md).
- Redação das páginas de Account, Exchange, Front-end e das seções de caching e observability.

### O que foi verificado

Cada entrega foi executada antes do merge: login, Exchange (testes com `pytest` e chamadas reais), cache (hit/miss, TTL e evict), alvos UP no Prometheus e dashboard no Grafana, e a loja inteira no navegador pelo load balancer. Os resultados estão nas páginas de cada entrega.

### O que o aluno precisa saber defender

- Interface (`account`) versus implementação (`account-service`) e como o Auth usa o Feign para chamar o Account.
- Por que login com e-mail inexistente e com senha errada respondem o mesmo `401`, e o limite do SHA-256 sem salt.
- Como o Exchange confia no `id-account` do Gateway e por que o cliente não consegue forjá-lo.
- O ciclo do cache: miss, gravação com TTL, hits, evict; por que `404` não é cacheado e por que não há `@CachePut`.
- Por que o Prometheus puxa (*pull*) as métricas, por que o `metrics_path` precisa bater com o `base-path` e como ler a taxa de acerto no Grafana.
- Os dois bugs de CORS: o `Host` sem porta no nginx e a anotação antiga no Account.

## Vídeo do Douglas

O vídeo de apresentação (`docs/evidencias/store-douglas.mp4`) foi montado pela IA: telas de texto, a saída real do `kubectl` durante o load test no EKS (capturada a cada 5 segundos) e narração com a voz sintética "Microsoft Maria" do Windows. O roteiro foi escrito pela IA e o aluno é o responsável pelo conteúdo.
