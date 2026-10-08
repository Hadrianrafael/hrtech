"""Gera os fluxos importáveis do n8n (n8n/workflows/*.json). Uso: python3 n8n/generate-workflows.py"""
import json, uuid, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'workflows')

def nid(seed):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'hrtech-n8n/' + seed))

SECRET_JS = r"""// Segredos: Variáveis do n8n ($vars, recomendado: dispensa liberar o acesso a variáveis de ambiente) ou ambiente.
const readSecret = (name) => {
  try { if ($vars && $vars[name]) return String($vars[name]); } catch (e) {}
  try { return $env[name] ? String($env[name]) : undefined; } catch (e) { return undefined; }
};
// Chave da empresa: HMAC_SHA256(segredo, "org:<organizationId>") — igual à SaaS (orgSigningKey).
const orgKey = (secret, orgId) => crypto.createHmac('sha256', secret).update('org:' + String(orgId || '')).digest('hex');"""

def verify_code(dedup):
    return r"""// Verifica a assinatura HMAC-SHA256 enviada pela HR Tech (cabeçalho X-HRTech-Signature: t=<unix>,v1=<hex>), feita com
// a chave da empresa do envio. Requer no n8n: NODE_FUNCTION_ALLOW_BUILTIN=crypto e HRTECH_WEBHOOK_SECRET (= N8N_WEBHOOK_SECRET).
const crypto = require('crypto');
""" + SECRET_JS + r"""
const secret = readSecret('HRTECH_WEBHOOK_SECRET');
if (!secret) throw new Error('HRTECH_WEBHOOK_SECRET não configurado (PENDENTE DE CREDENCIAL).');
const item = $input.first();
const headers = item.json.headers || {};
const signature = String(headers['x-hrtech-signature'] || '');
let raw;
try {
  const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
  raw = buf.toString('utf8');
} catch (e) {
  raw = JSON.stringify(item.json.body);
}
const parts = Object.fromEntries(signature.split(',').map((p) => { const i = p.indexOf('='); return [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
const t = Number(parts.t);
const v1 = String(parts.v1 || '');
if (!t || Math.abs(Date.now() / 1000 - t) > 300) throw new Error('Assinatura ausente ou expirada.');
const body = JSON.parse(raw);
const expected = crypto.createHmac('sha256', orgKey(secret, body.organizationId)).update(`${t}.${raw}`).digest('hex');
if (expected.length !== v1.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) throw new Error('Assinatura inválida.');
// Empresas autorizadas a usar as credenciais de canais desta instância (WhatsApp, e-mail, Google): HRTECH_ALLOWED_ORG_IDS.
const allowedOrgs = String(readSecret('HRTECH_ALLOWED_ORG_IDS') || '').split(',').map((x) => x.trim()).filter(Boolean);
const orgAllowed = allowedOrgs.includes(String(body.organizationId));
""" + (r"""// Idempotência: a HR Tech reenvia o mesmo envio (mesma idempotencyKey) quando não sabe se ele chegou (timeout, 5xx,
// queda). Chaves já vistas nos últimos 7 dias são respondidas como duplicadas e a ação NÃO é repetida.
// (Dados estáticos do fluxo: valem para fluxos ativos em uma instância; com várias instâncias/fila, use Redis/Postgres.)
const key = String(body.idempotencyKey || headers['x-hrtech-idempotency-key'] || '');
const store = $getWorkflowStaticData('global');
const now = Date.now();
store.seen = store.seen || {};
for (const [k, at] of Object.entries(store.seen)) if (now - at > 7 * 86400000) delete store.seen[k];
const keys = Object.keys(store.seen);
if (keys.length > 5000) keys.sort((a, b) => store.seen[a] - store.seen[b]).slice(0, keys.length - 5000).forEach((k) => delete store.seen[k]);
const duplicate = !!(key && store.seen[key]);
if (key && !duplicate) store.seen[key] = now;
""" if dedup else "const duplicate = false; // o dispatcher só encaminha; cada fluxo deduplica na própria entrada\n") + r"""return [{ json: { ...body, _raw: raw, _signature: signature, _duplicate: duplicate, _orgAllowed: orgAllowed } }];"""

VERIFY = verify_code(True)

def sign_code(status_expr, result_expr, error_expr='undefined'):
    return r"""// Monta o retorno para a HR Tech, assinado com a chave da empresa do envio (HMAC-SHA256 sobre "<t>.<corpo>").
const crypto = require('crypto');
""" + SECRET_JS + r"""
const req = $('Verificar assinatura').first().json;
const secret = orgKey(readSecret('HRTECH_WEBHOOK_SECRET'), req.organizationId);
const payload = JSON.stringify({
  eventId: `${req.id}:""" + status_expr.replace("'", '') + r"""`,
  dispatchId: req.id,
  idempotencyKey: req.idempotencyKey,
  status: '""" + status_expr + r"""',
  result: """ + result_expr + r""",
  error: """ + error_expr + r""",
});
const t = Math.floor(Date.now() / 1000);
const signature = `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
return [{ json: { callbackUrl: req.callbackUrl, payload, signature } }];"""

def webhook(name, path, pos, seed):
    return {"parameters": {"httpMethod": "POST", "path": path, "responseMode": "responseNode", "options": {"rawBody": True}},
            "id": nid(seed + name), "name": name, "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": pos, "webhookId": nid(seed + 'hook' + path)}

def code(name, js, pos, seed):
    return {"parameters": {"jsCode": js}, "id": nid(seed + name), "name": name, "type": "n8n-nodes-base.code", "typeVersion": 2, "position": pos}

def respond(name, pos, seed, code_=202, body='={{ JSON.stringify({ received: true }) }}'):
    return {"parameters": {"respondWith": "json", "responseBody": body, "options": {"responseCode": code_}},
            "id": nid(seed + name), "name": name, "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": pos}

def entry(hook_name, path, seed):
    """Entrada comum: webhook → verificação HMAC + idempotência → (duplicado? responde 200 e para) → responde 202."""
    dup_if = {"parameters": {"conditions": {"options": {"caseSensitive": True, "typeValidation": "loose"}, "combinator": "and",
              "conditions": [{"leftValue": "={{ $json._duplicate }}", "rightValue": "", "operator": {"type": "boolean", "operation": "true", "singleValue": True}}]}, "options": {}},
              "id": nid(seed + 'dup'), "name": "Já recebido?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [530, 300]}
    nodes = [webhook(hook_name, path, [200, 300], seed), code("Verificar assinatura", VERIFY, [370, 300], seed), dup_if,
             respond("Responder duplicado", [700, 480], seed, 200, '={{ JSON.stringify({ received: true, duplicate: true }) }}'), respond("Responder 202", [700, 300], seed)]
    conns = merge_conn(link(hook_name, "Verificar assinatura", "Já recebido?"),
                       {"Já recebido?": {"main": [[{"node": "Responder duplicado", "type": "main", "index": 0}], [{"node": "Responder 202", "type": "main", "index": 0}]]}})
    return nodes, conns

def org_guard(seed, pos, label):
    """Só segue para empresas autorizadas (HRTECH_ALLOWED_ORG_IDS); as demais recebem um retorno de falha assinado."""
    cond = {"parameters": {"conditions": {"options": {"caseSensitive": True, "typeValidation": "loose"}, "combinator": "and",
            "conditions": [{"leftValue": "={{ $json._orgAllowed }}", "rightValue": "", "operator": {"type": "boolean", "operation": "true", "singleValue": True}}]}, "options": {}},
            "id": nid(seed + 'orgok'), "name": "Empresa autorizada?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": pos}
    refuse = code("Assinar recusa", sign_code('failed', 'null', "'Fluxo " + label + " não configurado para esta empresa nesta instância do n8n (HRTECH_ALLOWED_ORG_IDS).'"), [pos[0] + 220, pos[1] + 200], seed)
    send = callback("Enviar recusa", [pos[0] + 440, pos[1] + 200], seed)
    return [cond, refuse, send], link("Assinar recusa", "Enviar recusa")

def callback(name, pos, seed):
    return {"parameters": {"method": "POST", "url": "={{ $json.callbackUrl }}", "sendHeaders": True,
             "headerParameters": {"parameters": [{"name": "X-HRTech-Signature", "value": "={{ $json.signature }}"}, {"name": "Content-Type", "value": "application/json"}]},
             "sendBody": True, "contentType": "raw", "rawContentType": "application/json", "body": "={{ $json.payload }}",
             "options": {"timeout": 15000, "redirect": {"redirect": {"followRedirects": False}}}},
            "id": nid(seed + name), "name": name, "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": pos,
            "retryOnFail": True, "maxTries": 5, "waitBetweenTries": 5000}

def link(*names):
    c = {}
    for a, b in zip(names, names[1:]):
        c.setdefault(a, {"main": [[]]})["main"][0].append({"node": b, "type": "main", "index": 0})
    return c

def merge_conn(*cs):
    out = {}
    for c in cs:
        for k, v in c.items():
            if k not in out:
                out[k] = {"main": [list(x) for x in v["main"]]}
            else:
                for i, branch in enumerate(v["main"]):
                    while len(out[k]["main"]) <= i:
                        out[k]["main"].append([])
                    out[k]["main"][i].extend(branch)
    return out

def workflow(name, nodes, connections, tags):
    return {"name": name, "nodes": nodes, "connections": connections, "active": False, "settings": {"executionOrder": "v1", "saveDataErrorExecution": "all", "saveDataSuccessExecution": "all"},
            "pinData": {}, "meta": {"templateCredsSetupCompleted": False}, "tags": [{"name": t} for t in tags]}

def write(fname, wf):
    with open(os.path.join(OUT, fname), 'w') as f:
        json.dump(wf, f, indent=2, ensure_ascii=False)
        f.write('\n')

# ── Dispatcher ──
# Entrada única: verifica a assinatura, encaminha ao fluxo e SÓ ENTÃO responde (202 se o fluxo aceitou; 503 se o
# encaminhamento falhou, para a HR Tech tentar de novo; 400 para fluxo desconhecido, que não adianta repetir).
s = 'dispatcher'
FLOWS = ["prospeccao", "comercial", "briefing", "marketing", "desenvolvimento", "financeiro"]
route = {"parameters": {"mode": "rules", "rules": {"values": [
    {"conditions": {"options": {"caseSensitive": True, "typeValidation": "strict"}, "combinator": "and",
                    "conditions": [{"leftValue": "={{ $json.workflow }}", "rightValue": w, "operator": {"type": "string", "operation": "equals"}}]},
     "renameOutput": True, "outputKey": w} for w in FLOWS]},
    "options": {"fallbackOutput": "extra"}},
    "id": nid(s + 'route'), "name": "Rotear por fluxo", "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [640, 300]}
ok_resp = respond("Responder 202", [1140, 300], s, 202, '={{ JSON.stringify({ received: true, forwarded: true }) }}')
fail_resp = respond("Responder 503", [1140, 520], s, 503, '={{ JSON.stringify({ received: false, error: "Fluxo indisponível no n8n; tente novamente." }) }}')
unknown = respond("Fluxo desconhecido (400)", [900, 760], s, 400, '={{ JSON.stringify({ received: false, error: "Fluxo desconhecido." }) }}')
forward_nodes = []
conns_list = [link("Webhook HR Tech", "Verificar assinatura", "Rotear por fluxo")]
route_conn = {"Rotear por fluxo": {"main": []}}
for i, w in enumerate(FLOWS):
    n = {"parameters": {"method": "POST", "url": "={{ ($env.N8N_INTERNAL_BASE_URL || 'http://localhost:5678') + '/webhook/hrtech-" + w + "' }}", "sendHeaders": True,
         "headerParameters": {"parameters": [{"name": "X-HRTech-Signature", "value": "={{ $json._signature }}"}, {"name": "Content-Type", "value": "application/json"}]},
         "sendBody": True, "contentType": "raw", "rawContentType": "application/json", "body": "={{ $json._raw }}", "options": {"timeout": 10000}},
         "id": nid(s + 'fwd' + w), "name": f"Encaminhar: {w}", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [900, 80 + i * 110],
         "retryOnFail": True, "maxTries": 2, "waitBetweenTries": 1000, "onError": "continueErrorOutput"}
    forward_nodes.append(n)
    route_conn["Rotear por fluxo"]["main"].append([{"node": n["name"], "type": "main", "index": 0}])
    conns_list.append({n["name"]: {"main": [[{"node": "Responder 202", "type": "main", "index": 0}], [{"node": "Responder 503", "type": "main", "index": 0}]]}})
route_conn["Rotear por fluxo"]["main"].append([{"node": unknown["name"], "type": "main", "index": 0}])
nodes = [webhook("Webhook HR Tech", "hrtech-dispatcher", [200, 300], s), code("Verificar assinatura", verify_code(False), [420, 300], s), route] + forward_nodes + [ok_resp, fail_resp, unknown]
conns = merge_conn(*conns_list, route_conn)
write('dispatcher.json', workflow("HR Tech — Dispatcher (entrada única)", nodes, conns, ["hrtech", "dispatcher"]))

# ── Prospecção ──
s = 'prospeccao'
build = code("Montar busca", r"""// Monta a consulta para a Google Places API (Text Search). Fonte oficial — sem scraping.
const d = $json.data || {};
const where = [d.city, d.state].filter(Boolean).join(' ');
const quantity = Math.min(Math.max(Number(d.quantity) || 20, 1), 20); // até 20 por página na API
return [{ json: { textQuery: `${d.segment || 'pousadas'}${where ? ' em ' + where : ''}`, pageSize: quantity, languageCode: 'pt-BR', regionCode: 'BR' } }];""", [860, 300], s)
places = {"parameters": {"method": "POST", "url": "https://places.googleapis.com/v1/places:searchText", "sendHeaders": True,
          "headerParameters": {"parameters": [{"name": "X-Goog-Api-Key", "value": "={{ $env.GOOGLE_PLACES_API_KEY }}"},
                                               {"name": "X-Goog-FieldMask", "value": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.addressComponents"}]},
          "sendBody": True, "specifyBody": "json", "jsonBody": "={{ JSON.stringify($json) }}", "options": {"timeout": 20000}},
          "id": nid(s + 'places'), "name": "Google Places — Text Search", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1080, 300],
          "retryOnFail": True, "maxTries": 3, "waitBetweenTries": 2000, "onError": "continueErrorOutput"}
normalize = code("Normalizar prospects", r"""// Converte o resultado em prospects no formato esperado pela HR Tech (leads.import_prospects).
const places = ($json.places || []);
const comp = (p, type) => ((p.addressComponents || []).find((c) => (c.types || []).includes(type)) || {});
const prospects = places.map((p) => ({
  name: (p.displayName && p.displayName.text) || 'Sem nome',
  phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
  website: p.websiteUri || null,
  city: comp(p, 'administrative_area_level_2').longText || null,
  state: comp(p, 'administrative_area_level_1').shortText || null,
  notes: [p.formattedAddress, p.rating ? `Avaliação Google: ${p.rating}` : null].filter(Boolean).join(' — '),
  segment: ($('Verificar assinatura').first().json.data || {}).segment || null,
}));
return [{ json: { prospects, source: 'google_places' } }];""", [1300, 220], s)
ok = code("Assinar retorno", sign_code('completed', '$json'), [1520, 220], s)
fail = code("Assinar falha", sign_code('failed', 'null', "String(($json.error && $json.error.message) || 'Falha na busca de prospects (verifique GOOGLE_PLACES_API_KEY).')"), [1300, 420], s)
head, head_conn = entry("Webhook prospecção", "hrtech-prospeccao", s)
guard, guard_conn = org_guard(s, [760, 460], "de prospecção")
nodes = head + guard + [build, places, normalize, ok, fail, callback("Enviar retorno", [1740, 220], s), callback("Enviar falha", [1520, 420], s)]
conns = merge_conn(head_conn, guard_conn, link("Responder 202", "Empresa autorizada?"),
                   {"Empresa autorizada?": {"main": [[{"node": "Montar busca", "type": "main", "index": 0}], [{"node": "Assinar recusa", "type": "main", "index": 0}]]}},
                   link("Montar busca", "Google Places — Text Search"),
                   {"Google Places — Text Search": {"main": [[{"node": "Normalizar prospects", "type": "main", "index": 0}], [{"node": "Assinar falha", "type": "main", "index": 0}]]}},
                   link("Normalizar prospects", "Assinar retorno", "Enviar retorno"), link("Assinar falha", "Enviar falha"))
write('prospeccao.json', workflow("HR Tech — Prospecção (Google Places)", nodes, conns, ["hrtech", "prospeccao"]))

# ── Comercial ──
s = 'comercial'
split = code("Preparar envios", r"""// Uma mensagem por contato. WhatsApp: template aprovado (fora da janela de 24h só templates são permitidos).
const d = $json.data || {};
const text = d.message || 'Olá! Passando para saber se posso ajudar com o seu atendimento.';
return (d.contacts || []).map((c) => ({ json: { contactId: c.id, name: c.name, phone: (c.whatsapp || c.phone || '').replace(/\D/g, ''), email: c.email || null, sequence: d.sequence, text } }));""", [860, 300], s)
has_phone = {"parameters": {"conditions": {"options": {"caseSensitive": True, "typeValidation": "loose"}, "combinator": "and",
             "conditions": [{"leftValue": "={{ $json.phone }}", "rightValue": "", "operator": {"type": "string", "operation": "notEmpty", "singleValue": True}}]}, "options": {}},
             "id": nid(s + 'if'), "name": "Tem WhatsApp?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [1080, 300]}
wa = {"parameters": {"method": "POST", "url": "={{ 'https://graph.facebook.com/v21.0/' + $env.WHATSAPP_PHONE_NUMBER_ID + '/messages' }}", "sendHeaders": True,
      "headerParameters": {"parameters": [{"name": "Authorization", "value": "={{ 'Bearer ' + $env.WHATSAPP_TOKEN }}"}]},
      "sendBody": True, "specifyBody": "json",
      "jsonBody": "={{ JSON.stringify({ messaging_product: 'whatsapp', to: $json.phone, type: 'template', template: { name: $env.WHATSAPP_TEMPLATE_FOLLOWUP || 'followup', language: { code: 'pt_BR' }, components: [{ type: 'body', parameters: [{ type: 'text', text: $json.name }] }] } }) }}",
      "options": {"timeout": 15000}},
      "id": nid(s + 'wa'), "name": "WhatsApp Cloud API (template)", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1300, 220], "onError": "continueRegularOutput"}
mail = {"parameters": {"fromEmail": "={{ $env.HRTECH_EMAIL_FROM }}", "toEmail": "={{ $json.email }}", "subject": "={{ 'Olá, ' + $json.name }}", "emailFormat": "text", "text": "={{ $json.text }}", "options": {}},
        "id": nid(s + 'mail'), "name": "Enviar e-mail (SMTP)", "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1, "position": [1300, 400], "onError": "continueRegularOutput",
        "credentials": {"smtp": {"id": "PENDENTE", "name": "SMTP HR Tech (PENDENTE DE CREDENCIAL)"}}}
summary = code("Resumir envios", r"""const items = $input.all();
const failed = items.filter((i) => i.json.error).length;
return [{ json: { total: items.length, enviados: items.length - failed, falhas: failed } }];""", [1520, 300], s)
head, head_conn = entry("Webhook comercial", "hrtech-comercial", s)
guard, guard_conn = org_guard(s, [760, 460], "comercial")
nodes = head + guard + [split, has_phone, wa, mail, summary, code("Assinar retorno", sign_code('completed', '$json'), [1740, 300], s), callback("Enviar retorno", [1960, 300], s)]
conns = merge_conn(head_conn, guard_conn, link("Responder 202", "Empresa autorizada?"),
                   {"Empresa autorizada?": {"main": [[{"node": "Preparar envios", "type": "main", "index": 0}], [{"node": "Assinar recusa", "type": "main", "index": 0}]]}},
                   link("Preparar envios", "Tem WhatsApp?"),
                   {"Tem WhatsApp?": {"main": [[{"node": "WhatsApp Cloud API (template)", "type": "main", "index": 0}], [{"node": "Enviar e-mail (SMTP)", "type": "main", "index": 0}]]}},
                   link("WhatsApp Cloud API (template)", "Resumir envios"), link("Enviar e-mail (SMTP)", "Resumir envios"), link("Resumir envios", "Assinar retorno", "Enviar retorno"))
write('comercial.json', workflow("HR Tech — Comercial (sequências de contato)", nodes, conns, ["hrtech", "comercial"]))

# ── Briefing ──
s = 'briefing'
rec = code("Destinatários", r"""const d = $json.data || {};
return (d.recipients || []).filter((r) => r.email).map((r) => ({ json: { email: r.email, name: r.name, day: d.day, content: d.content } }));""", [860, 300], s)
mail = {"parameters": {"fromEmail": "={{ $env.HRTECH_EMAIL_FROM }}", "toEmail": "={{ $json.email }}", "subject": "={{ 'Briefing do CEO — ' + $json.day }}", "emailFormat": "text", "text": "={{ $json.content }}", "options": {}},
        "id": nid(s + 'mail'), "name": "Enviar briefing por e-mail", "type": "n8n-nodes-base.emailSend", "typeVersion": 2.1, "position": [1080, 300], "onError": "continueRegularOutput",
        "credentials": {"smtp": {"id": "PENDENTE", "name": "SMTP HR Tech (PENDENTE DE CREDENCIAL)"}}}
summary = code("Resumir", "return [{ json: { enviados: $input.all().filter((i) => !i.json.error).length } }];", [1300, 300], s)
head, head_conn = entry("Webhook briefing", "hrtech-briefing", s)
guard, guard_conn = org_guard(s, [760, 460], "de briefing")
nodes = head + guard + [rec, mail, summary, code("Assinar retorno", sign_code('completed', '$json'), [1520, 300], s), callback("Enviar retorno", [1740, 300], s)]
conns = merge_conn(head_conn, guard_conn, link("Responder 202", "Empresa autorizada?"),
                   {"Empresa autorizada?": {"main": [[{"node": "Destinatários", "type": "main", "index": 0}], [{"node": "Assinar recusa", "type": "main", "index": 0}]]}},
                   link("Destinatários", "Enviar briefing por e-mail", "Resumir", "Assinar retorno", "Enviar retorno"))
write('briefing.json', workflow("HR Tech — Envio do briefing diário", nodes, conns, ["hrtech", "briefing"]))

# ── Agendador do worker ──
s = 'scheduler'
trigger = {"parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 2}]}}, "id": nid(s + 'trigger'), "name": "A cada 2 minutos",
           "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [200, 300]}
call = {"parameters": {"method": "POST", "url": "={{ ($vars.HRTECH_APP_URL || $env.HRTECH_APP_URL) + '/api/cron/ai' }}", "sendHeaders": True,
        "headerParameters": {"parameters": [{"name": "Authorization", "value": "={{ 'Bearer ' + ($vars.HRTECH_CRON_SECRET || $env.HRTECH_CRON_SECRET) }}"}]}, "options": {"timeout": 60000}},
        "id": nid(s + 'call'), "name": "Executar worker da Equipe IA", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [440, 300], "onError": "continueRegularOutput"}
write('agendador-worker.json', workflow("HR Tech — Agendador do worker da Equipe IA", [trigger, call], link("A cada 2 minutos", "Executar worker da Equipe IA"), ["hrtech", "scheduler"]))
print('ok', sorted(os.listdir(OUT)))
