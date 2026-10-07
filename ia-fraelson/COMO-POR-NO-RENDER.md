# IA do Fraelson no Render (grátis)

IMPORTANTE: o repositório no GitHub tem de ser PRIVADO, porque a pasta .auth
tem a sessão do WhatsApp (quem a copiar controla o número).

1. Cria conta no GitHub (github.com) se ainda não tiveres.
2. Cria um repositório PRIVADO novo (ex.: ia-fraelson), sem README.
3. Envia ESTES ficheiros todos para o repo (botão "uploading an existing file"):
   package.json, render.yaml, .gitignore, COMO-LIGAR.md, COMO-POR-NO-RENDER.md,
   src/index.js e TODA a pasta .auth (é o login do WhatsApp).
   NÃO envie .env nem node_modules.
4. Entra em dashboard.render.com e liga a conta GitHub.
5. New + > Blueprint > escolhe o repositório ia-fraelson.
   O render.yaml já diz tudo: serviço web grátis, npm install, npm start.
6. Ao pedir a variável AGENT_API_KEY, cola lá a tua chave da API do Superagent
   (Base44 > teu Superagent > Agent Settings > Developer).
7. Apply / Create. Espera o build (2 a 4 minutos) e vê os Logs:
   quando aparecer "Conectado como 258846639103..." está feito.
8. Testa: manda .ping para o +258846639103.

Como funciona o truque do grátis: o Render adormece serviços sem tráfego aos
15 minutos; o bot abre uma mini-página web e pingo-se a si próprio a cada
10 minutos, portanto nunca adormece.

Se o bot cair com 440 (replaced): só UMA cópia de cada vez. Se correres no
Termux e no Render ao mesmo tempo, o último a ligar rouba a sessão.
