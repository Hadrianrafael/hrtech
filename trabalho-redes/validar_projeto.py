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

# ===================== guia final, relatório e entrega =====================
guia = open("02_guia_execucao_packet_tracer.md").read()
rel = open("04_relatorio.md").read()
J = __import__('json').load(open('projeto.json'))
nome2 = {x[3]: (sw, x) for sw, d in depts.items() for x in d["rows"]}
chk(len(nome2) == 96, "96 nomes de dispositivo distintos na tabela")
# --- projeto.json × tabela × configs
okj = True
for sw, dep in J["depts"].items():
    rows = depts[sw]["rows"]
    jh = {(h["porta"]): (h["papel"], h["ip"], h["origem"]) for v in dep["vlans"] for h in v["hosts"]}
    okj &= all(jh[x[0]] == (x[2], str(x[4]), x[5]) for x in rows)
    okj &= [v["id"] for v in dep["vlans"]] == sorted({x[1] for x in rows})
    okj &= [(v["id"], v["pool"]["inicio"], str(v["pool"]["max"])) for v in dep["vlans"] if "pool" in v] == [(int(a), c, d_) for a, b, c, d_ in depts[sw]["pools"]]
chk(okj, "projeto.json × tabela: portas, papéis, IPs, origem, VLANs e pools idênticos nos 4 switches")
chk(J["links"] == [list(l) for l in J["links"]] and len(J["links"]) == 3, "projeto.json: 3 enlaces")
# --- guia: cabos
cab = re.findall(r"\| (\S+) \| FastEthernet0 \| FastEthernet0/(\d+) \| Copper Straight-Through \|", guia)
chk(len(cab) == 96, f"guia: 96 cabos host→switch ({len(cab)})")
chk(all(nome2[n][1][0] == int(p) for n, p in cab), "guia: cada host ligado à porta Fa0/N igual à da tabela")
trecho = guia.split("### 2.1")[1].split("### 2.2")[0]
cont = 0
for m in re.finditer(r"^\*\*[^\n]*? – (SW-\w+)\*\*\n\n(.*?)(?=\n\*\*|\Z)", trecho, re.M | re.S):
    sw = m.group(1); nomes = re.findall(r"\| (\S+) \| FastEthernet0 \|", m.group(2)); cont += 1
    chk(all(nome2[n][0] == sw for n in nomes) and sorted(nomes) == sorted(x[3] for x in depts[sw]["rows"]), f"guia: bloco de cabos de {sw} contém exatamente os 24 hosts do {sw}")
chk(cont == 4, "guia: 4 blocos de cabeamento")
cx = re.findall(r"\| (SW-\w+) \| GigabitEthernet0/(\d) \| (SW-\w+) \| GigabitEthernet0/(\d) \| Copper Cross-Over \|", guia)
chk([(a, f"Gi0/{pa}", b, f"Gi0/{pb}") for a, pa, b, pb in cx] == [tuple(l) for l in J["links"]], "guia: 3 cabos cruzados iguais aos enlaces do projeto")
est = re.findall(r"\| (\S+) \| (Desktop → IP Configuration|Config → FastEthernet0) \| ([\d.]+) \| 255\.255\.255\.240 \| (\d+) \|", guia)
esperado = [(x[3], str(x[4]), str(x[1])) for sw, d in depts.items() for x in d["rows"] if x[5] == "estático"]
chk(sorted((n, a, v) for n, _, a, v in est) == sorted(esperado) and len(est) == 52, "guia: 52 IPs estáticos (48 Eng/TI + 4 servidores DHCP) idênticos à tabela, com VLAN")
chk(all((o == "Desktop → IP Configuration") == n.startswith("PC-") for n, o, a, v in est), "guia: PC usa Desktop→IP Configuration; impressora/servidor usam Config→FastEthernet0")
pl = re.findall(r"\| (SRV-\S+) \((\S+)\) \| POOL-(\d+) \| 0\.0\.0\.0 \| 0\.0\.0\.0 \| ([\d.]+) \| 255\.255\.255\.240 \| (\d+) \|", guia)
esp_pools = sorted((vid, ini, mx) for d in depts.values() for vid, srv, ini, mx in d["pools"])
chk(sorted((v, i, m) for _, _, v, i, m in pl) == esp_pools and len(pl) == 4 and all(nome2[n][1][4] == ip.ip_address(a) for n, a, *_ in pl), "guia: 4 pools DHCP idênticos aos da tabela")
for sw, t in cfg.items(): chk(t.rstrip() in guia, f"guia: bloco CLI de {sw} idêntico a configs/{sw}.txt")
chk(guia.index("## PASSO 0") < guia.index("## PASSO 1"), "guia: PASSO 0 antes do PASSO 1")
# --- plano de testes (guia e Anexo C do relatório)
REG = r"\| (T\d+) \| (\S+) \| ([\d.]+\*?) \| (\S+) \| ([\d.]+\*?) \| `ping ([\d.]+)` \| (Respostas|Sem resposta)[^|]*\|"
for nome_doc, txt in (("guia", guia), ("relatório (Anexo C)", rel)):
    tst = re.findall(REG, txt)
    chk(len(tst) == 31, f"{nome_doc}: 31 testes ({len(tst)})")
    ok_t = True; pos = collections.Counter(); neg_i = neg_x = 0
    for tid, src, ips, dst, ipd, cmd, res in tst:
        (sws, xs), (swd, xd) = nome2[src], nome2[dst]
        ok_t &= src.startswith("PC-") and ips.rstrip("*") == str(xs[4]) and ipd.rstrip("*") == str(xd[4]) and cmd == str(xd[4])
        ok_t &= ips.endswith("*") == (xs[5] == "DHCP" and xs[2] != "Servidor") and ipd.endswith("*") == (xd[5] == "DHCP" and xd[2] != "Servidor")
        mesma = ip.ip_network(f"{xs[4]}/28", strict=False) == ip.ip_network(f"{xd[4]}/28", strict=False)
        ok_t &= (res == "Respostas") == mesma
        if mesma: pos[xs[1]] += 1
        elif sws == swd: neg_i += 1
        else: neg_x += 1
    chk(ok_t, f"{nome_doc}: nomes/IPs/comando conferem com a tabela; resposta esperada ⇔ mesma sub-rede /28; '*' só em DHCP não-servidor")
    chk(sorted(pos.items()) == [(v, 3) for v in sorted(vlan_ids)] and neg_i == 4 and neg_x == 3, f"{nome_doc}: 3 pings positivos em cada uma das 8 VLANs, 4 negativos no departamento e 3 entre departamentos")
# --- relatório: tabelas × tabela de endereçamento
tab27 = {(m[0]): m[1:] for m in re.findall(r"\| (\w[\w ]*) \| (192\.168\.10\.\d+)/27 \| 255\.255\.255\.224 \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|", md)}
r27 = {m[0]: m[1:] for m in re.findall(r"\| (\w[\w ]*) \| (192\.168\.10\.\d+) \| 255\.255\.255\.224 \| /27 \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|", rel)}
chk(len(r27) == 4 and all(r27[k] == tab27[k] for k in tab27), "relatório: 4 sub-redes /27 (rede, 1º, último, broadcast) idênticas à tabela de endereçamento")
r_nets = re.findall(r"\| (\w[\w ]*) \| (\d+) \| Fa0/[\d–]+ \| ([\d.]+) \| 255\.255\.255\.240 \| /28 \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \|", rel)
tab_md = re.findall(r"\| (\w[\w ]*) \| (\d+) \| Fa0/[\d-]+ \| ([\d.]+) \| 255\.255\.255\.240 \| /28 \| ([\d.]+) \| ([\d.]+) \| ([\d.]+) \| 14 \|", md)
chk(sorted(r_nets) == sorted(tab_md) and len(r_nets) == 8, "relatório: 8 sub-redes /28 (rede, 1º, último, broadcast) idênticas à tabela de endereçamento")
r_pool = re.findall(r"\| (\d+) \| (SRV-\S+) \| ([\d.]+) \| ([\d.]+) \| (\d+) \| ([\d.]+) a ([\d.]+) \|", rel)
chk(sorted((v, i, m) for v, n, a, i, m, f, l in r_pool) == esp_pools and all(nome2[n][1][4] == ip.ip_address(a) for v, n, a, i, m, f, l in r_pool) and len(r_pool) == 4, "relatório: Tabela 4 (pools DHCP) idêntica à tabela de endereçamento")
r_link = re.findall(r"\| (\d) \| (SW-\w+) Gi0/(\d) \| (SW-\w+) Gi0/(\d) \|", rel)
chk([(a, f"Gi0/{pa}", b, f"Gi0/{pb}") for _, a, pa, b, pb in r_link] == [tuple(l) for l in J["links"]], "relatório: Tabela 3 (enlaces) idêntica ao projeto.json")
anexoA = rel.split("## Anexo A")[1].split("## Anexo B")[0]
rowsA = re.findall(r"\| Fa0/(\d+) \| (\d+) \| (\w+) \| (\S+) \| ([\d.]+)/28 \| (\S+) \|", anexoA)
chk(len(rowsA) == 96 and all(nome2[n][1][0] == int(p) and nome2[n][1][1] == int(v) and str(nome2[n][1][4]) == a and nome2[n][1][2] == pa for p, v, pa, n, a, o_ in rowsA), "relatório: Anexo A com os 96 dispositivos, portas, VLANs e IPs idênticos à tabela")
anexoB = rel.split("## Anexo B")[1].split("## Anexo C")[0]
for sw, t in cfg.items(): chk(t.rstrip() in anexoB, f"relatório: Anexo B contém configs/{sw}.txt idêntico")
tab_hosts = re.findall(r"\| (\w[\w ]*) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|", rel)
chk(("Total", "4", "80", "8", "8", "96") in [tuple(x) for x in re.findall(r"\| (Total) \| (4) \| (80) \| (8) \| (8) \| (96) \|", rel)], "relatório: Tabela 1 (equipamentos) fecha em 4 switches, 80 PCs, 8 impressoras, 8 servidores, 96 hosts")
# --- relatório: conteúdo exigido e proibições
for dado in ["Hadrian Rafael Silva de Oliveira", "3502923907", "Superior de Tecnologia em Análise e Desenvolvimento de Sistemas", "Redes de Computadores", "2º semestre de 2026", "Suzano/SP – I(12563675)AC", "Formando", "Rogian Villa", "Anhanguera".upper()]:
    chk(dado in rel, f"relatório: contém '{dado}'")
for sec in ["## 1. Introdução", "## 2. Métodos", "## 3. Desenvolvimento", "## 4. Resultados", "## 5. Conclusão", "## Referências", "## Anexo A", "## Anexo B", "## Anexo C"]:
    chk(sec in rel, f"relatório: seção '{sec}'")
chk(sorted(set(re.findall(r"Figura (\d+)", rel))) == ["1"], "relatório: só a Figura 1 é citada (nenhuma Figura 2–20)")
chk("![Saída do comando show ip interface brief no switch 2960-24TT, no Cisco Packet Tracer](figuras/figura-01.png)" in rel, "relatório: Figura 1 incorporada como imagem")
png = open("figuras/figura-01.png", "rb").read()
chk(png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) > 10000, "figuras/figura-01.png existe e é um PNG válido")
chk("2960-24TT" in rel and "2960-24TT" in guia and all("2960-24TT" in t for t in cfg.values()), "modelo 2960-24TT no relatório, no guia e nas 4 configs")
PROIB = r"TODO|FIXME|XXX|INSERIR|COLAR|ESCOLHER|PENDENTE|rascunho|captura|screenshot|aguardando|a adicionar|ATENÇÃO|\[nome\]|\[ \]|\[x\]|<!--|2950T|Opção A|Opção B|Figura (?!1\b)\d+|Print "
entregaveis = {"relatório": rel, "guia": guia, "tabela": md, **{f"config {k}": t for k, t in cfg.items()}}
for nome_doc, txt in entregaveis.items():
    chk(not re.search(PROIB, txt), f"{nome_doc}: sem placeholders, TODO, instruções internas, capturas pendentes nem referência a 2950T-24")
chk(not re.search(r"Reply from|bytes=32|time<1ms|TTL=\d+|Packets: Sent", rel + guia), "relatório e guia: nenhuma saída de ping inventada")
chk(not re.search(r"foram executados|executamos|testes realizados|a simulação foi executada|resultados? obtidos?|foi montad[ao] no Packet Tracer", rel, re.I), "relatório: não afirma execução nem resultados de simulação")
for nome_doc in ("01_checklist_e_planejamento.md", "03_auditoria.md"):
    t = open(nome_doc).read()
    chk("2950T" not in t and "INSERIR" not in t and "TODO" not in t, f"{nome_doc}: sem referência a 2950T-24, INSERIR ou TODO")
# --- entrega (DOCX/PDF)
import zipfile, subprocess, os
if os.path.exists("entrega/Relatorio_SuperTech.docx") and os.path.exists("entrega/Relatorio_SuperTech.pdf"):
    z = zipfile.ZipFile("entrega/Relatorio_SuperTech.docx")
    nm = z.namelist()
    chk(any(n.startswith("word/media/") for n in nm), "DOCX: Figura 1 embutida (word/media)")
    rels = z.read("word/_rels/document.xml.rels").decode()
    chk("file:///" not in rels and 'TargetMode="External"' not in rels, "DOCX: sem vínculos externos (imagem embutida)")
    ptxt = subprocess.run(["pdftotext", "-layout", "entrega/Relatorio_SuperTech.pdf", "-"], capture_output=True, text=True).stdout
    info = subprocess.run(["pdfinfo", "entrega/Relatorio_SuperTech.pdf"], capture_output=True, text=True).stdout
    pag = int(re.search(r"Pages:\s+(\d+)", info).group(1))
    print(f"[INFO] PDF: {pag} páginas")
    for dado in ["Hadrian Rafael Silva de Oliveira", "3502923907", "Rogian Villa", "Figura 1", "1. Introdução", "2. Métodos", "4. Resultados", "5. Conclusão", "Anexo C"]:
        chk(dado in ptxt, f"PDF: contém '{dado}'")
    chk(not re.search(PROIB, ptxt), "PDF: sem placeholders nem referência a 2950T-24 nem a Figuras 2–20")
else:
    chk(False, "entrega/Relatorio_SuperTech.docx e .pdf existem")
print("\nRESULTADO:", "TUDO OK" if ok else "HÁ FALHAS"); sys.exit(0 if ok else 1)
