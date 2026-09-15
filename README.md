# insper-plat-projeto-studies## 📦 Submódulos

Este projeto usa Git Submodules. O submódulo `api/account` aponta para o repositório [pma-account](https://github.com/insper-plat-projeto/pma-account).

### Como clonar este projeto

Ao clonar, use a flag `--recurse-submodules` para já trazer o conteúdo do submódulo junto:

\`\`\`bash
git clone --recurse-submodules https://github.com/seu-usuario/seu-repo-principal.git
\`\`\`

Se você já clonou o projeto **sem** essa flag, a pasta `api/account` vai aparecer vazia. Para corrigir:

\`\`\`bash
git submodule update --init --recursive
\`\`\`
https://github.com/insper-plat-projeto/pma.git
### Atualizando o submódulo para a versão mais recente

\`\`\`bash
git submodule update --remote
\`\`\`

### Trabalhando dentro do submódulo

Para fazer alterações no código de `api/account`:

\`\`\`bash
cd api/account
# edite os arquivos normalmente
git add .
git commit -m "sua mensagem"
git push origin main
cd ../..
\`\`\`

Depois de commitar dentro do submódulo, volte para a raiz do projeto principal e atualize a referência:

\`\`\`bash
git add api/account
git commit -m "Atualiza referência do submódulo pma-account"
git push
\`\`\`

> ⚠️ **Atenção:** se você esquecer desse último passo, quem clonar o projeto principal vai continuar puxando uma versão antiga do submódulo, mesmo que o código já tenha sido atualizado dentro dele.

### Dica opcional

Para que comandos como `git pull` também atualizem os submódulos automaticamente, configure:

\`\`\`bash
git config --global submodule.recurse true
\`\`\`