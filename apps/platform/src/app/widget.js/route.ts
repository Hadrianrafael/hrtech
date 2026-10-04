/**
 * Script do widget de chat + captura de formulários, incorporável em qualquer site:
 *   <script src="https://SEU_DOMINIO/widget.js" data-key="pk_..." async></script>
 * Sem dependências; estilos isolados em Shadow DOM; textos inseridos com textContent (sem XSS).
 */
const WIDGET_JS = String.raw`(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[data-key][src*="widget.js"]');
  if (!script) return;
  var KEY = script.getAttribute('data-key');
  if (!KEY || window.__hrtWidgetLoaded) return;
  window.__hrtWidgetLoaded = true;
  var BASE = new URL(script.src).origin;
  var API = BASE + '/api/public/chat/' + encodeURIComponent(KEY);
  var STORE = 'hrt_chat_' + KEY;

  function req(method, path, body, token) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Visitor-Token'] = token;
    return fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Erro'); return j; });
    });
  }

  // ───── Formulários de captura ─────
  function bindForms() {
    var forms = document.querySelectorAll('form[data-hrtech-form]');
    Array.prototype.forEach.call(forms, function (form) {
      if (form.__hrt) return;
      form.__hrt = true;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        data.page = location.href;
        var btn = form.querySelector('[type=submit]');
        if (btn) btn.disabled = true;
        fetch(BASE + '/api/public/leads/' + encodeURIComponent(form.getAttribute('data-hrtech-form') || KEY), {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j; }); })
          .then(function (j) {
            var ok = document.createElement('p');
            ok.textContent = j.message || 'Enviado com sucesso!';
            ok.style.cssText = 'padding:12px;border-radius:8px;background:#ecfdf5;color:#065f46;font:14px system-ui';
            form.replaceWith(ok);
          })
          .catch(function (err) { alert(err.message || 'Não foi possível enviar. Tente novamente.'); if (btn) btn.disabled = false; });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindForms); else bindForms();
  if (script.getAttribute('data-form-only') === 'true') return;

  // ───── Chat ─────
  req('GET', '/config').then(function (cfg) {
    if (!cfg.active) return;
    mount(cfg);
  }).catch(function () { /* chat indisponível para este site */ });

  function mount(cfg) {
    var color = /^#[0-9a-f]{6}$/i.test(cfg.color) ? cfg.color : '#ea580c';
    var side = cfg.position === 'left' ? 'left' : 'right';
    var host = document.createElement('div');
    host.id = 'hrtech-chat';
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>' +
      ':host{all:initial}*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.btn{position:fixed;bottom:20px;' + side + ':20px;width:58px;height:58px;border-radius:50%;border:0;background:' + color + ';color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:2147483000;display:grid;place-items:center}' +
      '.btn svg{width:26px;height:26px}' +
      '.panel{position:fixed;bottom:90px;' + side + ':20px;width:min(370px,calc(100vw - 24px));height:min(560px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:2147483000;color:#111827}' +
      '.panel.open{display:flex}' +
      '.head{background:' + color + ';color:#fff;padding:14px 16px}.head b{display:block;font-size:15px}.head span{font-size:12px;opacity:.85}' +
      '.msgs{flex:1;overflow-y:auto;padding:14px;background:#f6f7f9;display:flex;flex-direction:column;gap:8px}' +
      '.m{max-width:82%;padding:8px 12px;border-radius:14px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}' +
      '.m.visitor{align-self:flex-end;background:' + color + ';color:#fff;border-bottom-right-radius:4px}' +
      '.m.bot,.m.agent{align-self:flex-start;background:#fff;border:1px solid #e5e7eb;border-bottom-left-radius:4px}' +
      '.m.agent{border-color:' + color + '}' +
      '.who{font-size:10px;font-weight:600;text-transform:uppercase;opacity:.6;margin-bottom:2px}' +
      'form.send{display:flex;gap:6px;padding:10px;border-top:1px solid #e5e7eb}' +
      'input,textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:9px 11px;font-size:14px;outline:none}input:focus,textarea:focus{border-color:' + color + '}' +
      'button.go{border:0;border-radius:10px;background:' + color + ';color:#fff;padding:0 14px;font-weight:600;cursor:pointer;font-size:14px}' +
      '.pre{padding:16px;display:flex;flex-direction:column;gap:10px;overflow-y:auto}.pre p{margin:0;font-size:13px;color:#4b5563}.pre label{font-size:12px;color:#4b5563;display:flex;gap:6px;align-items:flex-start}' +
      '.pre button{padding:11px}.foot{display:flex;justify-content:space-between;padding:6px 12px;font-size:11px;color:#6b7280;border-top:1px solid #f0f0f0}' +
      '.foot a{color:' + color + ';cursor:pointer;text-decoration:underline}.err{color:#b91c1c;font-size:12px}' +
      '.typing{align-self:flex-start;font-size:12px;color:#6b7280}' +
      '</style>' +
      '<button class="btn" aria-label="Abrir chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>' +
      '<div class="panel" role="dialog" aria-label="Chat"><div class="head"><b></b><span></span></div><div class="body" style="flex:1;display:flex;flex-direction:column;min-height:0"></div>' +
      '<div class="foot"><span>Atendimento por HR Tech</span><a class="human" role="button" tabindex="0">Falar com atendente</a></div></div>';

    var btn = root.querySelector('.btn');
    var panel = root.querySelector('.panel');
    var body = root.querySelector('.body');
    root.querySelector('.head b').textContent = cfg.name;
    root.querySelector('.head span').textContent = cfg.company;
    var state = { token: null, lastId: null, timer: null, msgsEl: null, seen: {} };
    try { var saved = JSON.parse(localStorage.getItem(STORE) || 'null'); if (saved && saved.token) state.token = saved.token; } catch (e) {}

    function render(list) {
      list.forEach(function (m) {
        if (state.seen[m.id]) return;
        state.seen[m.id] = true;
        state.lastId = m.id;
        var el = document.createElement('div');
        el.className = 'm ' + m.from;
        if (m.from !== 'visitor') {
          var who = document.createElement('div');
          who.className = 'who';
          who.textContent = m.from === 'bot' ? cfg.name : 'Atendente';
          el.appendChild(who);
        }
        el.appendChild(document.createTextNode(m.text));
        state.msgsEl.appendChild(el);
      });
      state.msgsEl.scrollTop = state.msgsEl.scrollHeight;
    }

    function chatView(initial) {
      body.innerHTML = '<div class="msgs" aria-live="polite"></div><form class="send"><input name="t" placeholder="Digite sua mensagem…" autocomplete="off" aria-label="Mensagem"><button class="go" type="submit">Enviar</button></form>';
      state.msgsEl = body.querySelector('.msgs');
      render(initial || []);
      var form = body.querySelector('form.send');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input');
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        render([{ id: 'local-' + Date.now(), from: 'visitor', text: text }]);
        var typing = document.createElement('div');
        typing.className = 'typing';
        typing.textContent = 'digitando…';
        state.msgsEl.appendChild(typing);
        req('POST', '/messages', { text: text, after: state.lastId && state.lastId.indexOf('local-') === 0 ? null : state.lastId }, state.token)
          .then(function (r) { typing.remove(); render(r.messages.filter(function (m) { return m.from !== 'visitor'; })); })
          .catch(function (err) { typing.textContent = err.message || 'Falha ao enviar.'; typing.className = 'err'; });
      });
      poll();
    }

    function poll() {
      clearInterval(state.timer);
      state.timer = setInterval(function () {
        if (!panel.classList.contains('open') || !state.token) return;
        var after = state.lastId && state.lastId.indexOf('local-') === 0 ? null : state.lastId;
        req('GET', '/messages' + (after ? '?after=' + encodeURIComponent(after) : ''), null, state.token)
          .then(function (r) { render(r.messages.filter(function (m) { return m.from !== 'visitor' || !after; })); })
          .catch(function () {});
      }, 4000);
    }

    function preChat() {
      body.innerHTML = '<form class="pre"><p></p><input name="name" placeholder="Seu nome" required aria-label="Nome"><input name="phone" placeholder="WhatsApp / telefone" aria-label="Telefone"><input name="email" type="email" placeholder="E-mail (opcional)" aria-label="E-mail"><label><input type="checkbox" name="consent" required style="width:auto"> Autorizo o uso dos meus dados para atendimento, conforme a LGPD.</label><button class="go" type="submit">Iniciar conversa</button><span class="err" role="alert"></span></form>';
      body.querySelector('.pre p').textContent = cfg.greeting;
      var form = body.querySelector('form.pre');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        form.querySelector('button').disabled = true;
        req('POST', '/start', { name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email') || null, consent: !!fd.get('consent'), page: location.href })
          .then(function (r) {
            state.token = r.token;
            try { localStorage.setItem(STORE, JSON.stringify({ token: r.token })); } catch (e2) {}
            chatView(r.messages);
          })
          .catch(function (err) { form.querySelector('.err').textContent = err.message || 'Não foi possível iniciar.'; form.querySelector('button').disabled = false; });
      });
    }

    function open() {
      panel.classList.add('open');
      btn.setAttribute('aria-label', 'Fechar chat');
      if (state.msgsEl) return;
      if (state.token) {
        req('GET', '/messages', null, state.token).then(function (r) { chatView(r.messages); }).catch(function () {
          state.token = null;
          try { localStorage.removeItem(STORE); } catch (e) {}
          preChat();
        });
      } else preChat();
    }

    btn.addEventListener('click', function () { panel.classList.contains('open') ? (panel.classList.remove('open'), btn.setAttribute('aria-label', 'Abrir chat')) : open(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') panel.classList.remove('open'); });
    root.querySelector('.human').addEventListener('click', function () {
      if (!state.token) return;
      req('POST', '/human', {}, state.token).then(function (r) { render(r.messages); }).catch(function (err) { alert(err.message); });
    });
  }
})();`;

export function GET() {
  return new Response(WIDGET_JS, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
