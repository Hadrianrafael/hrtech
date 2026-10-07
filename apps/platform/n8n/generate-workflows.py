"""Gera os fluxos importáveis do n8n (n8n/workflows/*.json). Uso: python3 n8n/generate-workflows.py"""
import json, uuid, os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'workflows')

def nid(seed):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'hrtech-n8n/' + seed))

VERIFY = r"""// Verifica a assinatura HMAC-SHA256 enviada pela HR Tech (cabeçalho X-HRTech-Signature: t=<unix>,v1=<hex>).
// Requer no n8n: NODE_FUNCTION_ALLOW_BUILTIN=crypto e a variável HRTECH_WEBHOOK_SECRET (= N8N_WEBHOOK_SECRET da SaaS).
const crypto = require('crypto');
const secret = $env.HRTECH_WEBHOOK_SECRET;
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
const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
if (expected.length !== v1.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) throw new Error('Assinatura inválida.');
const body = JSON.parse(raw);
return [{ json: { ...body, _raw: raw, _signature: signature } }];"""

def sign_code(status_expr, result_expr, error_expr='undefined'):
    return r"""// Monta o retorno para a HR Tech, assinado com o mesmo segredo (HMAC-SHA256 sobre "<t>.<corpo>").
const crypto = require('crypto');
const secret = $env.HRTECH_WEBHOOK_SECRET;
const req = $('Verificar assinatura').first().json;
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
s = 'dispatcher'
route = {"parameters": {"mode": "rules", "rules": {"values": [
    {"conditions": {"options": {"caseSensitive": True, "typeValidation": "strict"}, "combinator": "and",
                    "conditions": [{"leftValue": "={{ $json.workflow }}", "rightValue": w, "operator": {"type": "string", "operation": "equals"}}]},
     "renameOutput": True, "outputKey": w} for w in ["prospeccao", "comercial", "briefing", "marketing", "desenvolvimento", "financeiro"]]},
    "options": {"fallbackOutput": "extra"}},
    "id": nid(s + 'route'), "name": "Rotear por fluxo", "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [880, 300]}
forward_nodes = []
route_conn = {"Rotear por fluxo": {"main": []}}
for i, w in enumerate(["prospeccao", "comercial", "briefing", "marketing", "desenvolvimento", "financeiro"]):
    n = {"parameters": {"method": "POST", "url": "={{ ($env.N8N_INTERNAL_BASE_URL || 'http://localhost:5678') + '/webhook/hrtech-" + w + "' }}", "sendHeaders": True,
         "headerParameters": {"parameters": [{"name": "X-HRTech-Signature", "value": "={{ $json._signature }}"}, {"name": "Content-Type", "value": "application/json"}]},
         "sendBody": True, "contentType": "raw", "rawContentType": "application/json", "body": "={{ $json._raw }}", "options": {"timeout": 15000}},
         "id": nid(s + 'fwd' + w), "name": f"Encaminhar: {w}", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1140, 80 + i * 110],
         "retryOnFail": True, "maxTries": 3, "waitBetweenTries": 3000}
    forward_nodes.append(n)
    route_conn["Rotear por fluxo"]["main"].append([{"node": n["name"], "type": "main", "index": 0}])
unknown = code("Fluxo desconhecido", "// O campo workflow não corresponde a nenhum fluxo conhecido: registre e investigue.\nreturn [{ json: { ignored: true, workflow: $json.workflow } }];", [1140, 760], s)
route_conn["Rotear por fluxo"]["main"].append([{"node": unknown["name"], "type": "main", "index": 0}])
nodes = [webhook("Webhook HR Tech", "hrtech-dispatcher", [200, 300], s), code("Verificar assinatura", VERIFY, [420, 300], s), respond("Responder 202", [640, 300], s), route] + forward_nodes + [unknown]
conns = merge_conn(link("Webhook HR Tech", "Verificar assinatura", "Responder 202", "Rotear por fluxo"), route_conn)
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
nodes = [webhook("Webhook prospecção", "hrtech-prospeccao", [200, 300], s), code("Verificar assinatura", VERIFY, [420, 300], s), respond("Responder 202", [640, 300], s), build, places, normalize, ok, fail,
         callback("Enviar retorno", [1740, 220], s), callback("Enviar falha", [1520, 420], s)]
conns = merge_conn(link("Webhook prospecção", "Verificar assinatura", "Responder 202", "Montar busca", "Google Places — Text Search"),
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
nodes = [webhook("Webhook comercial", "hrtech-comercial", [200, 300], s), code("Verificar assinatura", VERIFY, [420, 300], s), respond("Responder 202", [640, 300], s), split, has_phone, wa, mail,
         summary, code("Assinar retorno", sign_code('completed', '$json'), [1740, 300], s), callback("Enviar retorno", [1960, 300], s)]
conns = merge_conn(link("Webhook comercial", "Verificar assinatura", "Responder 202", "Preparar envios", "Tem WhatsApp?"),
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
nodes = [webhook("Webhook briefing", "hrtech-briefing", [200, 300], s), code("Verificar assinatura", VERIFY, [420, 300], s), respond("Responder 202", [640, 300], s), rec, mail, summary,
         code("Assinar retorno", sign_code('completed', '$json'), [1520, 300], s), callback("Enviar retorno", [1740, 300], s)]
conns = merge_conn(link("Webhook briefing", "Verificar assinatura", "Responder 202", "Destinatários", "Enviar briefing por e-mail", "Resumir", "Assinar retorno", "Enviar retorno"))
write('briefing.json', workflow("HR Tech — Envio do briefing diário", nodes, conns, ["hrtech", "briefing"]))

# ── Agendador do worker ──
s = 'scheduler'
trigger = {"parameters": {"rule": {"interval": [{"field": "minutes", "minutesInterval": 2}]}}, "id": nid(s + 'trigger'), "name": "A cada 2 minutos",
           "type": "n8n-nodes-base.scheduleTrigger", "typeVersion": 1.2, "position": [200, 300]}
call = {"parameters": {"method": "POST", "url": "={{ $env.HRTECH_APP_URL + '/api/cron/ai' }}", "sendHeaders": True,
        "headerParameters": {"parameters": [{"name": "Authorization", "value": "={{ 'Bearer ' + $env.HRTECH_CRON_SECRET }}"}]}, "options": {"timeout": 60000}},
        "id": nid(s + 'call'), "name": "Executar worker da Equipe IA", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [440, 300], "onError": "continueRegularOutput"}
write('agendador-worker.json', workflow("HR Tech — Agendador do worker da Equipe IA", [trigger, call], link("A cada 2 minutos", "Executar worker da Equipe IA"), ["hrtech", "scheduler"]))
print('ok', sorted(os.listdir(OUT)))
