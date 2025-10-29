# Analisador de Relatórios Contábeis com IA

Uma aplicação web para analisar relatórios contábeis como balanços, DREs e balancetes usando a IA do Gemini para identificar erros, sugerir melhorias e revisar a ortografia.

## Como Implantar (Deploy) a Aplicação

Para implantar esta aplicação, você precisará de uma chave de API do Gemini. A aplicação é construída como um site estático e pode ser hospedada gratuitamente em serviços como Vercel ou Netlify.

O guia a seguir explica como implantar na Vercel.

---

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
    *   Arraste todos os arquivos da aplicação (`index.html`, `index.tsx`, `App.tsx`, a pasta `components`, etc.) para a área de upload.
    *   No final da página, clique no botão verde **Commit changes**.

Agora seus arquivos estão online e prontos para a Vercel.

### Passo 2: Implantar na Vercel

1.  **Crie uma conta na Vercel**: Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita, de preferência usando a opção "Continue with GitHub".
2.  **Importe seu projeto**:
    *   No seu painel (dashboard) da Vercel, clique em **Add New...** e selecione **Project**.
    *   A Vercel se conectará ao seu GitHub. Encontre o repositório que você acabou de criar (`analisador-contabil`) e clique no botão **Import** ao lado dele.
    *   Na tela de configuração do projeto, a Vercel já deve detectar que é um site estático. Você não precisa mudar nenhuma configuração.
    *   Apenas clique em **Deploy**.
3.  **Aguarde a implantação**: A Vercel irá construir e implantar seu site. Em menos de um minuto, ela fornecerá a URL do seu aplicativo online!

### Passo 3: Configurar a Chave de API (Essencial)

Após o primeiro deploy, o site estará no ar, mas a análise de IA ainda não funcionará. Você precisa fornecer sua chave de API.

1.  No painel do seu projeto na Vercel, clique na aba **Settings** (Configurações).
2.  No menu lateral, clique em **Environment Variables** (Variáveis de Ambiente).
3.  Adicione uma nova variável:
    *   **Name**: `API_KEY`
    *   **Value**: Cole a sua chave de API do Gemini (obtida em [ai.google.dev](https://ai.google.dev/)).
    *   Deixe todas as opções de ambiente (Production, Preview, Development) marcadas.
4.  Clique em **Save**.
5.  **Redeploy (Reimplantar)**: Para que a nova variável seja aplicada, você precisa fazer um novo deploy.
    *   Vá para a aba **Deployments** do seu projeto.
    *   Encontre o último deploy na lista, clique nos três pontos (`...`) à direita e selecione **Redeploy**.

Pronto! Após a conclusão do redeploy, sua aplicação estará no ar e 100% funcional.
