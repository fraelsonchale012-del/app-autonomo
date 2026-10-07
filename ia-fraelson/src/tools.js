// Ferramentas reais do WhatsApp. SÓ o dono (+258869045822) as pode usar.

const num = (s) => String(s || '').replace(/\D/g, '');
const toJid = (s) => (String(s).includes('@') ? s : num(s) + '@s.whatsapp.net');

const TOOL_DEFS = [
  ['abrir_grupo', 'Abre o grupo atual: todos os membros podem enviar mensagens.', {}],
  ['fechar_grupo', 'Fecha o grupo atual: só administradores podem enviar mensagens.', {}],
  ['bloquear_info_grupo', 'Só administradores podem editar nome/foto/descrição do grupo.', {}],
  ['liberar_info_grupo', 'Todos os membros podem editar nome/foto/descrição do grupo.', {}],
  ['mudar_nome_grupo', 'Muda o nome do grupo atual.', { nome: 'string' }],
  ['mudar_descricao_grupo', 'Muda a descrição do grupo atual.', { descricao: 'string' }],
  ['adicionar_membro', 'Adiciona um número ao grupo atual. Número com código do país, ex: 258841234567.', { numero: 'string' }],
  ['remover_membro', 'Remove (expulsa) um membro do grupo. Usa o número ou a pessoa marcada/citada.', { numero: 'string' }],
  ['promover_admin', 'Torna um membro administrador do grupo.', { numero: 'string' }],
  ['rebaixar_admin', 'Retira o cargo de administrador a um membro.', { numero: 'string' }],
  ['marcar_todos', 'Envia uma mensagem a marcar todos os membros do grupo.', { texto: 'string' }],
  ['link_do_grupo', 'Obtém o link de convite do grupo atual.', {}],
  ['revogar_link', 'Cria um novo link de convite e invalida o antigo.', {}],
  ['apagar_mensagem', 'Apaga a mensagem citada (a que o dono está a responder) para todos, se for admin.', {}],
  ['listar_membros', 'Lista os membros e administradores do grupo atual.', {}],
  ['listar_grupos', 'Lista todos os grupos em que o bot está.', {}],
  ['sair_do_grupo', 'O bot sai do grupo atual. Só usar se o dono pedir claramente.', {}],
  ['entrar_no_grupo', 'Entra num grupo através de um link de convite chat.whatsapp.com/CODIGO.', { link: 'string' }],
  ['enviar_mensagem', 'Envia uma mensagem de texto a um número ou grupo (JID de grupo termina em @g.us).', { destino: 'string', texto: 'string' }],
  ['mudar_foto_perfil_bot', 'Muda a foto de perfil do bot usando a imagem citada pelo dono.', {}],
  ['mudar_recado_bot', 'Muda o recado/estado (about) do próprio bot.', { texto: 'string' }],
].map(([name, description, props]) => ({
  type: 'function',
  function: {
    name, description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(Object.keys(props).map(k => [k, { type: 'string' }])),
      required: Object.keys(props),
    },
  },
}));

async function runTool(sock, name, args, ctx) {
  const { chat, isGroup, msg } = ctx;
  const needGroup = () => { if (!isGroup) throw new Error('Isto só funciona dentro de um grupo.'); };
  const target = () => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    return args.numero ? toJid(args.numero) : (mentioned || quoted);
  };
  switch (name) {
    case 'abrir_grupo': needGroup(); await sock.groupSettingUpdate(chat, 'not_announcement'); return 'Grupo aberto: todos podem escrever.';
    case 'fechar_grupo': needGroup(); await sock.groupSettingUpdate(chat, 'announcement'); return 'Grupo fechado: só admins escrevem.';
    case 'bloquear_info_grupo': needGroup(); await sock.groupSettingUpdate(chat, 'locked'); return 'Info do grupo só para admins.';
    case 'liberar_info_grupo': needGroup(); await sock.groupSettingUpdate(chat, 'unlocked'); return 'Info do grupo livre para todos.';
    case 'mudar_nome_grupo': needGroup(); await sock.groupUpdateSubject(chat, args.nome); return `Nome mudado para "${args.nome}".`;
    case 'mudar_descricao_grupo': needGroup(); await sock.groupUpdateDescription(chat, args.descricao); return 'Descrição atualizada.';
    case 'adicionar_membro': { needGroup(); const r = await sock.groupParticipantsUpdate(chat, [toJid(args.numero)], 'add'); return `Adicionar: ${r?.[0]?.status || 'enviado'} (200 = ok, 403 = a pessoa bloqueou convites, 409 = já está no grupo).`; }
    case 'remover_membro': { needGroup(); const t = target(); if (!t) throw new Error('Diz quem remover (número, marcação ou citação).'); await sock.groupParticipantsUpdate(chat, [t], 'remove'); return 'Membro removido.'; }
    case 'promover_admin': { needGroup(); const t = target(); if (!t) throw new Error('Diz quem promover.'); await sock.groupParticipantsUpdate(chat, [t], 'promote'); return 'Promovido a admin.'; }
    case 'rebaixar_admin': { needGroup(); const t = target(); if (!t) throw new Error('Diz quem rebaixar.'); await sock.groupParticipantsUpdate(chat, [t], 'demote'); return 'Admin removido.'; }
    case 'marcar_todos': { needGroup(); const meta = await sock.groupMetadata(chat); await sock.sendMessage(chat, { text: args.texto || '📢 Atenção todos!', mentions: meta.participants.map(p => p.id) }); return 'Todos marcados.'; }
    case 'link_do_grupo': { needGroup(); const c = await sock.groupInviteCode(chat); return `https://chat.whatsapp.com/${c}`; }
    case 'revogar_link': { needGroup(); const c = await sock.groupRevokeInvite(chat); return `Novo link: https://chat.whatsapp.com/${c}`; }
    case 'apagar_mensagem': {
      const ci = msg.message?.extendedTextMessage?.contextInfo;
      if (!ci?.stanzaId) throw new Error('Responde à mensagem que queres apagar.');
      await sock.sendMessage(chat, { delete: { remoteJid: chat, fromMe: false, id: ci.stanzaId, participant: ci.participant } });
      return 'Mensagem apagada.';
    }
    case 'listar_membros': { needGroup(); const m = await sock.groupMetadata(chat); const adm = m.participants.filter(p => p.admin).map(p => num(p.id)); return `${m.subject}: ${m.participants.length} membros. Admins: ${adm.join(', ') || 'nenhum'}. Membros: ${m.participants.map(p => num(p.id)).slice(0, 80).join(', ')}`; }
    case 'listar_grupos': { const all = await sock.groupFetchAllParticipating(); const l = Object.values(all).map(g => `${g.subject} (${g.participants.length}) [${g.id}]`); return `${l.length} grupos: ${l.join(' | ') || 'nenhum'}`; }
    case 'sair_do_grupo': needGroup(); setTimeout(() => sock.groupLeave(chat).catch(() => {}), 2500); return 'Vou sair do grupo.';
    case 'entrar_no_grupo': { const code = String(args.link).split('chat.whatsapp.com/')[1]?.split(/[?\s]/)[0] || args.link; const id = await sock.groupAcceptInvite(code); return `Entrei no grupo ${id}.`; }
    case 'enviar_mensagem': { const d = String(args.destino).includes('@') ? args.destino : toJid(args.destino); await sock.sendMessage(d, { text: args.texto }); return 'Mensagem enviada.'; }
    case 'mudar_foto_perfil_bot': { const buf = await quotedImageBuf(sock, chat, msg); await sock.updateProfilePicture(sock.user.id, buf); return 'Foto de perfil do bot atualizada.'; }
    case 'mudar_recado_bot': await sock.updateProfileStatus(args.texto); return 'Recado atualizado.';
    case 'criar_enquete': { needGroup(); const ops = String(args.opcoes).split(/[,;|]/).map(s => s.trim()).filter(Boolean); if (ops.length < 2) throw new Error('Dá pelo menos 2 opções separadas por vírgula.'); await sock.sendMessage(chat, { poll: { name: args.pergunta, values: ops.slice(0, 12), selectableCount: 1 } }); return 'Enquete criada.'; }
    case 'obter_info_grupo': { needGroup(); const m = await sock.groupMetadata(chat); return `${m.subject}\nDescrição: ${m.desc || '(nenhuma)'}\nMembros: ${m.participants.length}\nRestrição de envio: ${m.restrict || m.announcement ? 'só admins' : 'aberto'}\nCriado: ${new Date(m.creation * 1000).toLocaleDateString('pt')}`; }
    case 'mudar_foto_grupo': { needGroup(); const buf = await quotedImageBuf(sock, chat, msg); await sock.updateProfilePicture(chat, buf); return 'Foto do grupo atualizada.'; }
    case 'mensagem_agendada': { const mins = parseInt(args.minutos) || 0; if (mins < 1 || mins > 60 * 24 * 30) throw new Error('Minutos entre 1 e 43200.'); const d = String(args.destino).includes('@') ? args.destino : toJid(args.destino); setTimeout(() => sock.sendMessage(d, { text: args.texto }).catch(e => console.warn('[agendada] falhou', e.message)), mins * 60000); return `Agendado para daqui a ${mins} minutos.`; }
    case 'enviar_para_todos_grupos': { const all = await sock.groupFetchAllParticipating(); let n = 0; for (const g of Object.values(all)) { try { await sock.sendMessage(g.id, { text: args.texto }); n++; } catch {} } return `Enviado a ${n} grupos.`; }
    case 'previsao_do_tempo': { const r = await fetch(`https://wttr.in/${encodeURIComponent(args.cidade)}?format=%l:+%c+%t+(sente+como+%f),+humidade+%h,+vento+%w&lang=pt`, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error('Cidade não encontrada.'); return (await r.text()).trim(); }
    case 'pesquisar_web': {
      const r = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(args.consulta), { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
      const html = await r.text(); const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
      const titles = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)].slice(0, 5);
      if (!titles.length) return 'Nada encontrado.';
      return titles.map((m, i) => `${i + 1}. ${strip(m[2])} — ${m[1].includes('uddg=') ? decodeURIComponent(m[1].split('uddg=')[1].split('&')[0]) : m[1]}`).join('\n');
    }
    case 'gerar_imagem': { const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(args.descricao)}?width=768&height=768&nologo=true`; await sock.sendMessage(chat, { image: { url }, caption: '🤖 ' + args.descricao }); return 'Imagem gerada e enviada.'; }
    case 'ver_imagem_citada': { const buf = await quotedImageBuf(sock, chat, msg); const b64 = buf.toString('base64'); const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` }, body: JSON.stringify({ model: 'meta-llama/llama-4-scout-17b-16e-instruct', max_tokens: 500, messages: [{ role: 'user', content: [{ type: 'text', text: args.pergunta || 'Descreve esta imagem.' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }] }] }), signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error('Visão falhou: ' + r.status); const d = await r.json(); return d.choices?.[0]?.message?.content?.trim() || '(nada reconhecido)'; }
    case 'transcrever_audio': { const buf = await quotedAudioBuf(sock, chat, msg); const form = new FormData(); form.append('file', new Blob([buf]), 'audio.ogg'); form.append('model', 'whisper-large-v3'); const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${GROQ_KEY}` }, body: form, signal: AbortSignal.timeout(60000) }); if (!r.ok) throw new Error('Transcrição falhou: ' + r.status); const d = await r.json(); return 'O áudio diz: ' + (d.text || '(silêncio)'); }
    case 'enviar_audio': {
      const texto = String(args.texto).slice(0, 1000);
      const partes = texto.match(/[\s\S]{1,180}(?:\s|$)|[\s\S]{1,180}/g) || [texto];
      const bufs = [];
      for (const p of partes) {
        const u = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pt&q=' + encodeURIComponent(p.trim());
        const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30000) });
        if (!r.ok) throw new Error('Voz falhou: ' + r.status);
        bufs.push(Buffer.from(await r.arrayBuffer()));
      }
      await sock.sendMessage(chat, { audio: Buffer.concat(bufs), ptt: true, mimetype: 'audio/mpeg' });
      return 'Áudio enviado.';
    }

    case 'criar_sticker': { const { Sticker, StickerTypes } = require('wa-sticker-formatter'); const buf = await quotedImageBuf(sock, chat, msg); const st = new Sticker(buf, { pack: 'Fraelson IA', author: 'Ty Kp', type: StickerTypes.FULLPP, categories: ['🤖'] }); await sock.sendMessage(chat, { sticker: await st.toBuffer() }); return 'Figurinha criada.'; }
    default: throw new Error('Ferramenta desconhecida: ' + name);
  }
}

[
  ['criar_enquete', 'Cria uma enquete (votação) no chat/grupo atual.', { pergunta: 'string', opcoes: 'string' }],
  ['obter_info_grupo', 'Mostra nome, descrição, membros e configurações do grupo atual.', {}],
  ['mudar_foto_grupo', 'Muda a foto do grupo atual usando a imagem citada pelo dono.', {}],
  ['mensagem_agendada', 'Agenda uma mensagem para enviar mais tarde a um número ou grupo.', { destino: 'string', texto: 'string', minutos: 'string' }],
  ['enviar_para_todos_grupos', 'Envia a mesma mensagem a TODOS os grupos onde o bot está.', { texto: 'string' }],
  ['previsao_do_tempo', 'Consulta a previsão do tempo de uma cidade.', { cidade: 'string' }],
  ['pesquisar_web', 'Pesquisa na internet e devolve os principais resultados.', { consulta: 'string' }],
].forEach(([name, description, props]) => TOOL_DEFS.push({
  type: 'function',
  function: {
    name, description,
    parameters: { type: 'object', properties: Object.fromEntries(Object.keys(props).map(k => [k, { type: 'string' }])), required: Object.keys(props) },
  },
}));

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
async function quotedImageBuf(sock, chat, msg) {
  const ci = msg.message?.extendedTextMessage?.contextInfo;
  if (!ci?.quotedMessage?.imageMessage) throw new Error('Responde a uma imagem (faz quote da foto).');
  const qmsg = { key: { remoteJid: chat, id: ci.stanzaId, participant: ci.participant }, message: ci.quotedMessage };
  return downloadMediaMessage(qmsg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
}
const EXTRA_DEFS = [
  ['gerar_imagem', 'Gera uma imagem pela descrição e envia no chat atual. Ex: "gera uma imagem de um gato de terno".', { descricao: 'string' }],
  ['ver_imagem_citada', 'OLHA para a imagem que o dono citou/respondeu e responde o que ele perguntar sobre ela.', { pergunta: 'string' }],
  ['transcrever_audio', 'Transcreve (ouve) o áudio/nota de voz citado pelo dono e devolve o texto.', {}],
  ['enviar_audio', 'Envia uma nota de voz falando o texto que o dono pedir. Ex: "manda um áudio a dizer bom dia".', { texto: 'string' }],
  ['criar_sticker', 'Cria uma figurinha (sticker) a partir da imagem citada pelo dono.', {}],
];
EXTRA_DEFS.forEach(([name, description, props]) => TOOL_DEFS.push({
  type: 'function',
  function: {
    name, description,
    parameters: { type: 'object', properties: Object.fromEntries(Object.keys(props).map(k => [k, { type: 'string' }])), required: Object.keys(props) },
  },
}));

const GROQ_KEY = process.env.GROQ_API_KEY || '';
async function quotedAudioBuf(sock, chat, msg) {
  const ci = msg.message?.extendedTextMessage?.contextInfo;
  if (!ci?.quotedMessage?.audioMessage) throw new Error('Responde à nota de voz (faz quote do áudio).');
  const qmsg = { key: { remoteJid: chat, id: ci.stanzaId, participant: ci.participant }, message: ci.quotedMessage };
  return downloadMediaMessage(qmsg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
}
module.exports = { TOOL_DEFS, runTool };
