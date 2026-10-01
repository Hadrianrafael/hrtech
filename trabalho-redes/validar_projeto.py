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
print("\nRESULTADO:", "TUDO OK" if ok else "HÁ FALHAS"); sys.exit(0 if ok else 1)
