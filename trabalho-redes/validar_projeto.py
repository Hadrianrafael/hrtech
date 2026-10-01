#!/usr/bin/env python3
"""Auditoria automática: lê tabela_enderecamento.md e configs/*.txt (não o modelo) e confere o projeto."""
import re, ipaddress as ip, glob, sys, collections
ok = True
def chk(cond, msg):
    global ok
    print(("[OK]   " if cond else "[FALHA] ") + msg); ok &= bool(cond)

md = open("tabela_enderecamento.md").read()
secs = re.split(r"\n### ", md)[1:]
depts = {}
for s in secs:
    nome = s.split(" – ")[0]; sw = s.split(" – ")[1]
    rows = re.findall(r"\| Fa0/(\d+) \| (\d+) \| (\w+) \| (\S+) \| ([\d.]+)/28 \| (\S+) \|", s)
    pools = re.findall(r"\| (\d+) \| ([\d.]+) \| ([\d.]+) \| 255\.255\.255\.240 \| (\d+) \|", s.split("**Pools DHCP")[1]) if "**Pools DHCP" in s else []
    depts[sw] = dict(nome=nome, rows=[(int(p), int(v), r, n, ip.ip_address(a), o) for p, v, r, n, a, o in rows], pools=pools, modo=re.search(r"IP (\S+)", s).group(1))
chk(len(depts) == 4, "4 departamentos na tabela")
todas_redes = {}; todos_ips = []; vlan_ids = []
bloco = ip.ip_network("192.168.10.0/24")
for sw, d in depts.items():
    r = d["rows"]
    chk(len(r) == 24 and [x[0] for x in r] == list(range(1, 25)), f"{sw}: 24 portas Fa0/1-24, uma por host")
    c = collections.Counter(x[2] for x in r)
    chk(c == {"PC": 20, "Impressora": 2, "Servidor": 2}, f"{sw}: 20 PCs, 2 impressoras, 2 servidores {dict(c)}")
    vl = sorted({x[1] for x in r}); vlan_ids += vl
    chk(len(vl) == 2, f"{sw}: exatamente 2 VLANs {vl}")
    for vid in vl:
        mem = [x for x in r if x[1] == vid]
        portas = [x[0] for x in mem]
        cc = collections.Counter(x[2] for x in mem)
        esperado = range(1, 13) if vid == vl[0] else range(13, 25)
        chk(portas == list(esperado), f"{sw} VLAN {vid}: portas {portas[0]}-{portas[-1]}")
        chk(cc == {"PC": 10, "Impressora": 1, "Servidor": 1}, f"{sw} VLAN {vid}: 10 PCs + 1 impressora + 1 servidor")
        ips = [x[4] for x in mem]
        # rede da VLAN: menor /28 que contém todos
        rede = ip.ip_network(f"{ips[0]}/28", strict=False)
        chk(all(i in rede for i in ips), f"{sw} VLAN {vid}: todos os IPs em {rede}")
        chk(all(i not in (rede.network_address, rede.broadcast_address) for i in ips), f"{sw} VLAN {vid}: nenhum IP é rede/broadcast")
        chk(len(set(ips)) == 12, f"{sw} VLAN {vid}: 12 IPs distintos, sequenciais {[int(i)&255 for i in ips][:3]}...")
        chk([int(i) - int(rede.network_address) for i in ips] == list(range(1, 13)), f"{sw} VLAN {vid}: sequência +1..+12")
        chk(rede.subnet_of(bloco), f"{sw} VLAN {vid}: {rede} dentro de {bloco}")
        todas_redes[(sw, vid)] = rede
    todos_ips += [x[4] for x in r]
    r27 = {ip.ip_network(f"{x[4]}/27", strict=False) for x in r}
    chk(len(r27) == 1, f"{sw}: as duas VLANs cabem no mesmo /27 {list(r27)[0]}")
    esp = ("estático" if d["modo"] == "estático" else "DHCP")
    if d["modo"] == "estático":
        chk(all(x[5] == "estático" for x in r), f"{sw}: todos os 24 com IP estático")
    else:
        chk(all((x[5] == "estático") == (x[2] == "Servidor") for x in r), f"{sw}: só servidores estáticos; PCs/impressoras DHCP")
        chk(len(d["pools"]) == 2, f"{sw}: 2 pools DHCP (um por VLAN)")
        for vid, srv, ini, mx in d["pools"]:
            vid = int(vid); mx = int(mx); ini = ip.ip_address(ini)
            faixa = {ini + k for k in range(mx)}
            clientes = {x[4] for x in r if x[1] == vid and x[5] == "DHCP"}
            srvs = [x[4] for x in r if x[1] == vid and x[2] == "Servidor"]
            chk(faixa == clientes, f"{sw} VLAN {vid}: pool {ini}+{mx} == exatamente os {len(clientes)} clientes DHCP")
            chk(ip.ip_address(srv) in srvs and ip.ip_address(srv) not in faixa, f"{sw} VLAN {vid}: servidor DHCP {srv} é o servidor da VLAN e fora do pool")
chk(len(set(todos_ips)) == 96, "96 IPs distintos no projeto")
redes = list(todas_redes.values())
chk(all(not a.overlaps(b) for i, a in enumerate(redes) for b in redes[i + 1:]), "8 sub-redes /28 sem sobreposição")
chk(len(set(vlan_ids)) == 8, f"8 IDs de VLAN únicos no projeto {sorted(vlan_ids)}")
chk(all(n.prefixlen == 28 and n.num_addresses - 2 >= 12 for n in redes), "cada /28 comporta ≥12 hosts (14)")
chk(ip.ip_network("192.168.10.0/27").num_addresses - 2 >= 24, "/27 comporta ≥24 hosts (30)")
chk(ip.ip_network("192.168.10.0/28").num_addresses - 2 < 24, "/28 sozinho NÃO comporta 24 (por isso /27 é o agregado do departamento)")
# --- configs
cfg = {}
for f in glob.glob("configs/SW-*.txt"):
    cfg[f.split("/")[-1][:-4]] = open(f).read()
chk(set(cfg) == set(depts), "4 arquivos de configuração, um por switch")
todos = sorted(set(vlan_ids))
for sw, t in cfg.items():
    d = depts[sw]; vl = sorted({x[1] for x in d["rows"]})
    chk(f"hostname {sw}" in t, f"{sw}: hostname")
    chk(sorted(int(x) for x in re.findall(r"^vlan (\d+)$", t, re.M)) == todos, f"{sw}: define as 8 VLANs")
    acc = re.findall(r"interface range FastEthernet0/(\d+) - (\d+)\n switchport mode access\n switchport access vlan (\d+)", t)
    chk([(int(a), int(b), int(v)) for a, b, v in acc] == [(1, 12, vl[0]), (13, 24, vl[1])], f"{sw}: Fa0/1-12→VLAN {vl[0]}, Fa0/13-24→VLAN {vl[1]}")
    trunks = re.findall(r"interface (GigabitEthernet\d/\d)\n switchport mode trunk\n switchport trunk allowed vlan ([\d,]+)", t)
    chk([x[0] for x in trunks] == [f"GigabitEthernet0/{u[-1]}" for u in __import__('json').load(open('projeto.json'))["uplinks"][sw]], f"{sw}: trunks nas Gi esperadas")
    chk(all(sorted(map(int, v.split(","))) == todos for _, v in trunks), f"{sw}: trunk permite as 8 VLANs")
    chk(re.search(r"interface (Fa|Gi)\w*0/(2[5-9]|[3-9]\d)", t) is None, f"{sw}: nenhuma interface fora de Fa0/1-24 e Gi0/1-2")
    chk("vtp mode transparent" in t, f"{sw}: VTP transparente")
# --- isolamento de domínio de broadcast / DHCP
membros = collections.defaultdict(set)
for sw, t in cfg.items():
    for a, b, v in re.findall(r"interface range FastEthernet0/(\d+) - (\d+)\n switchport mode access\n switchport access vlan (\d+)", t):
        membros[int(v)].add(sw)
chk(all(len(s) == 1 for s in membros.values()), "cada VLAN tem portas de acesso em UM único switch (sem domínio de broadcast compartilhado entre departamentos)")
dhcp_vlans = [int(v) for sw, d in depts.items() if d["modo"] == "DHCP" for v, *_ in d["pools"]]
chk(len(dhcp_vlans) == len(set(dhcp_vlans)) == 4, "4 VLANs com DHCP, 4 servidores, 1 por VLAN: sem servidores concorrentes no mesmo domínio")
# --- cabeamento de uplinks
J = __import__('json').load(open('projeto.json'))
usadas = collections.Counter()
for a, pa, b, pb in J["links"]:
    usadas[(a, pa)] += 1; usadas[(b, pb)] += 1
chk(all(n == 1 for n in usadas.values()), "nenhuma porta de uplink usada em dois enlaces")
chk(all(p in J["uplinks"][s] for (s, p) in usadas), "enlaces usam só portas Gi definidas nos trunks")
grafo = collections.defaultdict(set)
for a, _, b, _ in J["links"]: grafo[a].add(b); grafo[b].add(a)
vis = set(); pilha = ["SW-ENG"]
while pilha:
    x = pilha.pop()
    if x not in vis: vis.add(x); pilha += list(grafo[x])
chk(vis == set(depts) and len(J["links"]) == 3, "4 switches conectados, 3 enlaces, sem laço")

# ===================== guia final e relatório =====================
guia = open("02_guia_execucao_packet_tracer.md").read()
rel = open("04_relatorio.md").read()
nome2 = {x[3]: (sw, x) for sw, d in depts.items() for x in d["rows"]}
chk(len(nome2) == 96, "96 nomes de dispositivo distintos na tabela")
# 1) cabos hosts -> switch
cab = re.findall(r"\| (\S+) \| FastEthernet0 \| FastEthernet0/(\d+) \| Copper Straight-Through \|", guia)
chk(len(cab) == 96, f"guia: 96 cabos host→switch ({len(cab)})")
bloco_sw = {}
partes = re.split(r"\n\*\*(?=[A-ZÇ][^\n]* – SW-)", guia.split("### 2.1")[1].split("### 2.2")[0])
okc = True
for nome, porta in cab:
    sw, x = nome2[nome]
    okc &= (x[0] == int(porta))
chk(okc, "guia: cada host ligado à porta Fa0/N igual à da tabela")
# cada switch recebe 24 cabos distintos
trecho = guia.split("### 2.1")[1].split("### 2.2")[0]
cont = collections.Counter()
for m in re.finditer(r"^\*\*[^\n]*? – (SW-\w+)\*\*[^\n]*\n\n(.*?)(?=\n\*\*|\Z)", trecho, re.M | re.S):
    sw = m.group(1)
    nomes = re.findall(r"\| (\S+) \| FastEthernet0 \|", m.group(2))
    cont[sw] = len(nomes)
    chk(all(nome2[n][0] == sw for n in nomes) and sorted(nomes) == sorted(x[3] for x in depts[sw]["rows"]), f"guia: bloco de cabos de {sw} contém exatamente os 24 hosts do {sw}")
chk(len(cont) == 4, "guia: 4 blocos de cabeamento")
cx = re.findall(r"\| (SW-\w+) \| GigabitEthernet0/(\d) \| (SW-\w+) \| GigabitEthernet0/(\d) \| Copper Cross-Over \|", guia)
chk([(a, f"Gi0/{pa}", b, f"Gi0/{pb}") for a, pa, b, pb in cx] == [tuple(l) for l in J["links"]], "guia: 3 cabos cruzados iguais aos enlaces do projeto")
# 2) IPs estáticos
est = re.findall(r"\| (\S+) \| (Desktop → IP Configuration|Config → FastEthernet0) \| ([\d.]+) \| 255\.255\.255\.240 \| (\d+) \|", guia)
esperado = [(x[3], str(x[4]), str(x[1])) for sw, d in depts.items() for x in d["rows"] if x[5] == "estático"]
chk(sorted((n, a, v) for n, _, a, v in est) == sorted(esperado), f"guia: {len(est)} IPs estáticos (48 Eng/TI + 4 servidores DHCP) idênticos à tabela, com VLAN")
chk(len(est) == 52, "guia: 52 dispositivos estáticos no total")
chk(all((o == "Desktop → IP Configuration") == n.startswith("PC-") for n, o, a, v in est), "guia: PC usa Desktop→IP Configuration; impressora/servidor usam Config→FastEthernet0")
# 3) pools
pl = re.findall(r"\| (SRV-\S+) \((\S+)\) \| POOL-(\d+) \| 0\.0\.0\.0 \| 0\.0\.0\.0 \| ([\d.]+) \| 255\.255\.255\.240 \| (\d+) \|", guia)
esp_pools = sorted((vid, ini, mx) for d in depts.values() for vid, srv, ini, mx in d["pools"])
chk(sorted((v, i, m) for _, _, v, i, m in pl) == esp_pools and len(pl) == 4, "guia: 4 pools DHCP idênticos aos da tabela")
chk(all(nome2[n][1][4] == ip.ip_address(a) for n, a, *_ in pl), "guia: IP de cada servidor DHCP confere com a tabela")
# 4) testes
tst = re.findall(r"\| (T\d+) \| (\S+) \| ([\d.]+\*?) \| (\S+) \| ([\d.]+\*?) \| `ping ([\d.]+)` \| (Sucesso|Falha)[^|]*\| (Figura \d+|D-\d+) \|", guia)
chk(len(tst) == 31, f"guia: 31 testes ({len(tst)})")
ok_t = True; pos = collections.Counter(); neg_i = neg_x = 0
for tid, src, ips, dst, ipd, cmd, res, pr in tst:
    (sws, xs), (swd, xd) = nome2[src], nome2[dst]
    ok_t &= src.startswith("PC-") and ips.rstrip("*") == str(xs[4]) and ipd.rstrip("*") == str(xd[4]) and cmd == str(xd[4])
    ok_t &= ips.endswith("*") == (xs[5] == "DHCP" and xs[2] != "Servidor") and ipd.endswith("*") == (xd[5] == "DHCP" and xd[2] != "Servidor")
    mesma = ip.ip_network(f"{xs[4]}/28", strict=False) == ip.ip_network(f"{xd[4]}/28", strict=False)
    ok_t &= (res == "Sucesso") == mesma and xs[1] == xs[1]
    if mesma: pos[xs[1]] += 1
    elif sws == swd: neg_i += 1
    else: neg_x += 1
chk(ok_t, "guia: em todos os testes, nomes/IPs/comando conferem com a tabela; sucesso ⇔ mesma sub-rede /28; '*' só em DHCP não-servidor")
chk(sorted(pos.items()) == [(v, 3) for v in sorted(vlan_ids)], "guia: 3 pings positivos (PC, impressora, servidor) em cada uma das 8 VLANs")
chk(neg_i == 4 and neg_x == 3, f"guia: 4 testes negativos no mesmo departamento e 3 entre departamentos ({neg_i}/{neg_x})")
# 5) prints / figuras
obr = re.findall(r"^\| (\d+) \| .* \| \[ \] \|$", guia, re.M)
dia = re.findall(r"^\| (D-\d+) \| .* \| \[ \] \|$", guia, re.M)
chk(obr == [str(i) for i in range(1, len(obr) + 1)] and len(obr) == 20, f"guia: {len(obr)} figuras obrigatórias numeradas em sequência")
chk(dia == [f"D-{i:02d}" for i in range(1, len(dia) + 1)] and len(dia) == 23, f"guia: {len(dia)} capturas de diagnóstico D-01..D-23")
chk(len(obr) + len(dia) == 43, "guia: 20 + 23 = 43 capturas no total")
refs = {p for *_x, p in tst}
chk(all((p.startswith("D-") and p[2:].isdigit() and int(p[2:]) <= len(dia)) or (p.startswith("Figura ") and int(p[7:]) <= len(obr)) for p in refs), "guia: todo teste aponta para uma captura existente")
chk(all(len({s_ for tid, s_, *_r, p in tst if p == q}) == 1 for q in refs), "guia: cada captura de ping tem uma única origem")
chk(guia.index("## PASSO 0") < guia.index("## PASSO 1") and guia.index("COMECE AQUI") < 600, "guia: PASSO 0 destacado no início, antes do PASSO 1")
# obrigatórias esperadas
tabA = guia.split("### A) OBRIGAT")[1].split("### B) APENAS")[0]
for item in ["show ip interface brief", "Topologia completa", "SW-ENG: `show vlan brief`", "SW-INFRA: `show vlan brief`", "SW-COMP: `show interfaces trunk`", "SW-TI: `show interfaces trunk`",
             "IP estático de PC-ENG-11-01", "IP estático de PC-TI-31-01", "DHCP de SRV-COMP-21", "DHCP de SRV-INFRA-41", "PC-COMP-21-01: `ipconfig`", "PC-INFRA-41-01: `ipconfig`"]:
    chk(item in tabA, f"guia: figura obrigatória contém '{item}'")
figs = sorted({int(x) for x in re.findall(r"\[INSERIR FIGURA (\d+) —", rel)})
legs = sorted({int(x) for x in re.findall(r"\*Figura (\d+) –", rel)})
chk(figs == list(range(1, 21)) == legs, "relatório: marcadores [INSERIR FIGURA 1..20] e legendas 1..20 batem com as 20 figuras obrigatórias")
marc = re.findall(r"\[([A-ZÇÃÕ]{4,})\b", rel)
chk(set(marc) <= {"INSERIR", "ESCOLHER", "COLAR"}, f"relatório: só existem marcadores INSERIR/ESCOLHER/COLAR {sorted(set(marc))}")
chk("[edição" not in rel and "INFORMAR" not in rel and "AJUSTAR" not in rel, "relatório: sem placeholders que independem da simulação")
chk("Opção A" in rel and "Opção B" in rel, "relatório: Opções A/B do modelo de switch prontas")
chk(len(re.findall(r"INSERIR IP REAL", rel)) == 44 and len(re.findall(r"INSERIR RESULTADO REAL DO PING", rel)) == 31, "relatório: 44 linhas de IP DHCP reais (22 PCs/impressoras em Compras e 22 em Infraestrutura) e 31 resultados de ping a preencher")
# 6) configs embutidas no guia
for sw, t in cfg.items():
    chk(t.rstrip() in guia, f"guia: bloco CLI de {sw} idêntico a configs/{sw}.txt")
# 7) relatório: dados, tabelas e proibições
for dado in ["Hadrian Rafael Silva de Oliveira", "3502923907", "Superior de Tecnologia em Análise e Desenvolvimento de Sistemas",
             "Redes de Computadores", "2º semestre de 2026", "Suzano/SP – I(12563675)AC", "Formando", "Rogian Villa", "Anhanguera"]:
    chk(dado in rel, f"relatório: contém '{dado}'")
for sec in ["## 1. Introdução", "## 2. Métodos", "## 3. Desenvolvimento", "## 4. Resultados", "## 5. Conclusão", "## Referências"]:
    chk(sec in rel, f"relatório: seção '{sec}'")
r_nets = re.findall(r"\| (\d+) \| Fa0/[\d–]+ \| ([\d.]+) \| 255\.255\.255\.240 \| /28 \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|", rel)
tab_md = re.findall(r"\| (\w[\w ]*) \| (\d+) \| Fa0/[\d-]+ \| ([\d.]+) \| 255\.255\.255\.240 \| /28 \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \| 14 \|", md)
chk(sorted(r_nets) == sorted((v, n, a, b, c) for _, v, n, a, b, c in tab_md) and len(r_nets) == 8, "relatório: 8 sub-redes /28 (rede, 1º, último, broadcast) idênticas à tabela_enderecamento.md")
chk(len(re.findall(r"\| (192\.168\.10\.\d+) \| 255\.255\.255\.224 \| /27 \|", rel)) == 4, "relatório: 4 sub-redes /27")
chk(not re.search(r"Reply from|bytes=32|time<1ms|TTL=\d+|Packets: Sent", rel), "relatório: nenhum resultado de ping inventado")
chk(not re.search(r"foram executados|executamos|testes realizados|a simulação foi executada", rel, re.I), "relatório: não afirma execução")
chk(rel.count("[INSERIR") >= 60, f"relatório: {rel.count('[INSERIR')} marcadores [INSERIR ...] para evidências reais")
print("\nRESULTADO:", "TUDO OK" if ok else "HÁ FALHAS"); sys.exit(0 if ok else 1)
