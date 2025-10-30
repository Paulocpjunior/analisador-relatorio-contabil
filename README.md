# Analisador de Relatórios Contábeis com IA

Uma aplicação web para analisar relatórios contábeis como balanços, DREs e balancetes usando a IA do Gemini para identificar erros, sugerir melhorias e revisar a ortografia.

## Arquitetura da Aplicação

Esta aplicação utiliza uma arquitetura segura e robusta que consiste em:

1.  **Frontend Estático**: Uma interface de usuário rica construída com HTML, TailwindCSS e React, que roda diretamente no navegador do usuário.
2.  **Função Serverless (Backend Proxy)**: Uma pequena função Node.js (localizada em `/api/gemini-proxy.ts`) que é implantada automaticamente pela Vercel. Esta função é a única que se comunica com a API do Gemini.

**Como funciona?** O frontend (navegador) nunca tem acesso direto à sua chave de API do Gemini. Em vez disso, ele envia os dados do relatório para a função serverless, que então adiciona a chave de API (armazenada de forma segura nas variáveis de ambiente da Vercel) e repassa a solicitação para o Gemini. Isso impede que sua chave de API seja exposta publicamente.

---

## Como Implantar (Deploy) a Aplicação

Para implantar esta aplicação, você precisará de uma chave de API do Gemini. O guia a seguir explica como implantar na Vercel.

### Passo 1: Colocar os Arquivos no GitHub

A Vercel precisa de um lugar online para ler seus arquivos. O GitHub é perfeito para isso.

1.  **Crie uma conta no GitHub**: Se você ainda não tem, crie uma conta gratuita em [github.com](https://github.com).
2.  **Crie um novo repositório**:
    *   No canto superior direito, clique no sinal de `+` e depois em **New repository**.
    *   Dê um nome ao seu repositório (ex: `analisador-contabil`).
    *   Você pode deixá-lo como **Public** ou **Private**.
    *   Clique em **Create repository**.
3.  **Envie os arquivos do projeto**:
    *   Na página do seu novo repositório, clique em **Add file** e depois em **Upload files**.
    *   Arraste todos os arquivos da aplicação (`index.html`, `index.tsx`, `package.json`, a pasta `api`, etc.) para a área de upload.
    *   No final da página, clique no botão verde **Commit changes**.

Agora seus arquivos estão online e prontos para a Vercel.

### Passo 2: Implantar na Vercel

1.  **Crie uma conta na Vercel**: Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita, de preferência usando a opção "Continue with GitHub".
2.  **Importe seu projeto**:
    *   No seu painel (dashboard) da Vercel, clique em **Add New...** e selecione **Project**.
    *   A Vercel se conectará ao seu GitHub. Encontre o repositório que você acabou de criar (`analisador-contabil`) e clique no botão **Import** ao lado dele.
    
3.  **Configurar o Projeto (PASSO MAIS IMPORTANTE!)**:
    *   Na tela "Configure Project", a Vercel tentará adivinhar qual é o seu tipo de projeto. Ela provavelmente vai errar. Você precisa corrigir isso manualmente.
    *   Expanda a seção **Build and Output Settings**.
    *   **Mude o "Framework Preset" para "Other"**. Isso é essencial!
    *   Deixe as outras configurações de "Build" e "Output" vazias/desligadas. Isso diz à Vercel para não tentar "compilar" o projeto, e sim para servir os arquivos como estão.

4.  **Adicionar Variáveis de Ambiente**:
    *   Expanda a seção **Environment Variables**.
    *   Adicione uma nova variável:
        *   **Name**: `API_KEY`
        *   **Value**: Cole a sua chave de API do Gemini (obtida em [ai.google.dev](https://ai.google.dev/)).
    *   Clique em **Add**.

5.  **Clique em Deploy**.
    *   Aguarde a implantação. Em menos de um minuto, a Vercel fornecerá a URL do seu aplicativo online!

---

## Solução de Problemas (Troubleshooting)

### Problema: O site publicado mostra um erro 404 (Not Found).

Este é o erro mais comum. Siga esta lista de verificação **exatamente**.

1.  **Verifique o Framework Preset na Vercel**:
    *   Vá para o seu projeto na Vercel.
    *   Clique na aba **Settings**.
    *   No menu lateral, vá para **General**.
    *   Role para baixo até a seção **Build & Development Settings**.
    *   **GARANTA** que o **Framework Preset** está definido como **Other**. Se estiver qualquer outra coisa, o deploy falhará.
    *   **TODOS** os outros campos nesta seção (Build Command, Output Directory, Install Command) devem estar **VAZIOS** ou desativados.
    *   Se você fez alguma alteração, clique em **Save**.

2.  **Faça o Redeploy**:
    *   Após salvar as configurações, vá para a aba **Deployments**.
    *   Encontre o último deploy na lista (deve ser o do topo).
    *   Clique no menu de três pontos (`...`) à direita e selecione **Redeploy**.
    *   Confirme o redeploy e aguarde a conclusão.

Isto resolve 99% dos casos de erro 404.

### Problema: O site abre, mas quando clico em "Analisar", recebo um erro.

Isso geralmente significa que a função do servidor (`/api/gemini-proxy`) está com problemas. As causas mais comuns são:
*   A chave de API (`API_KEY`) não foi configurada, está incorreta ou não tem permissões.
*   Houve um erro interno na função.

*   **Solução: Verificar os Logs da Função**
    1.  Vá para o seu projeto na Vercel.
    2.  Clique na aba **Logs**.
    3.  Na parte superior, selecione a aba **Functions**.
    4.  No seu site, tente fazer uma análise novamente para gerar o erro.
    5.  Um log de erro deve aparecer na Vercel em tempo real. Clique nele para expandir. A mensagem de erro geralmente dirá o que está errado.
        *   Se o erro for sobre `API_KEY`, verifique se você a configurou corretamente em **Settings -> Environment Variables**. Lembre-se de fazer o **Redeploy** após adicionar ou alterar uma variável.
        *   Se for outro erro, ele pode dar pistas sobre o problema no código da função.