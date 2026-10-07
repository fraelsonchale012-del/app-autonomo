# IA do Fraelson — como ligar (já vem com a chave da IA dentro)

1. Instala o Termux e dentro dele:
   pkg update && pkg install nodejs-lts unzip
2. Extrai este zip:
   unzip ia-do-fraelson.zip && cd ia-fraelson
3. Instala as dependências:
   npm ci --omit=dev || npm install
4. O .env JÁ VEM CONFIGURADO com a chave da IA. Não mexas.
5. Liga:
   npm start
6. Testa: manda .ping para o número +258846639103

Regras de ouro:
1. UMA cópia só. Se o bot correr aqui e no Termux ao mesmo tempo, dá erro 440 e cai.
2. A chave AGENT_API_KEY vem do editor do teu Superagent no Base44 (Settings, Developer/API).
3. No Termux, para o bot não morrer quando fechas o ecrã:
   termux-wake-lock
   e mantém o Termux aberto ou usa tmux (pkg install tmux; tmux new -s bot; npm start; Ctrl+B depois D para sair sem matar)

Controlos do dono (+258869045822):
.ping — verifica se está ligado
.iaon / .iaoff — liga ou desliga a IA no chat
No grupo, a IA só responde quando for marcada com @.
