#!/usr/bin/env python3
"""Gera tabela_enderecamento.md e configs/*.txt do projeto Super Tech (v2)."""
import ipaddress as ip, json

BLOCO = ip.ip_network("192.168.10.0/24")
# departamento: (switch, modo, [VLAN a, VLAN b])
DEPTOS = [
    ("Engenharia",     "SW-ENG",   "estático", [11, 12]),
    ("Compras",        "SW-COMP",  "DHCP",     [21, 22]),
    ("TI Interno",     "SW-TI",    "estático", [31, 32]),
    ("Infraestrutura", "SW-INFRA", "DHCP",     [41, 42]),
]
UPLINKS = {"SW-ENG": ["Gi0/1"], "SW-COMP": ["Gi0/1", "Gi0/2"],
           "SW-TI": ["Gi0/1", "Gi0/2"], "SW-INFRA": ["Gi0/1"]}
LINKS = [("SW-ENG", "Gi0/1", "SW-COMP", "Gi0/1"),
         ("SW-COMP", "Gi0/2", "SW-TI", "Gi0/1"),
         ("SW-TI", "Gi0/2", "SW-INFRA", "Gi0/1")]
MODELO = "2960-24TT"

def papel(porta):
    q = (porta - 1) % 12 + 1
    return "PC" if q <= 10 else ("Impressora" if q == 11 else "Servidor")

def modelo():
    d = {}
    blocos27 = list(BLOCO.subnets(new_prefix=27))
    for (nome, sw, modo, vlans), b27 in zip(DEPTOS, blocos27):
        v28 = list(b27.subnets(new_prefix=28))
        dep = {"nome": nome, "sw": sw, "modo": modo, "bloco27": str(b27), "vlans": []}
        for idx, (vid, rede) in enumerate(zip(vlans, v28)):
            portas = range(1, 13) if idx == 0 else range(13, 25)
            hosts = []
            for k, p in enumerate(portas, start=1):
                end = rede.network_address + k
                hosts.append({"porta": p, "papel": papel(p), "ip": str(end),
                              "origem": "estático" if (modo == "estático" or papel(p) == "Servidor") else "DHCP"})
            v = {"id": vid, "rede": str(rede), "hosts": hosts}
            if modo == "DHCP":
                cli = [h for h in hosts if h["origem"] == "DHCP"]
                srv = [h for h in hosts if h["papel"] == "Servidor"][0]
                v["pool"] = {"inicio": cli[0]["ip"], "max": len(cli), "servidor": srv["ip"]}
            dep["vlans"].append(v)
        d[sw] = dep
    return d

def tabela(d):
    o = ["# Tabela de endereçamento\n",
         "Bloco: **192.168.10.0/24** (Classe C). Cada departamento recebe um /27 (24 hosts + folga); dentro dele, cada VLAN recebe um /28 (12 hosts + 2 de folga). Os hosts são configurados com a máscara **/28 = 255.255.255.240**.\n",
         "## Sub-redes por departamento (agregado /27)\n",
         "| Departamento | Bloco /27 | Máscara /27 | 1º IP | Último IP | Broadcast |", "|---|---|---|---|---|---|"]
    for dep in d.values():
        n = ip.ip_network(dep["bloco27"]); h = list(n.hosts())
        o.append(f"| {dep['nome']} | {n} | {n.netmask} | {h[0]} | {h[-1]} | {n.broadcast_address} |")
    o += ["\n## Sub-redes por VLAN (/28 – usadas pelos hosts)\n",
          "| Departamento | VLAN | Portas | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast | IPs úteis |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for dep in d.values():
        for i, v in enumerate(dep["vlans"]):
            n = ip.ip_network(v["rede"]); h = list(n.hosts())
            o.append(f"| {dep['nome']} | {v['id']} | {'Fa0/1-12' if i==0 else 'Fa0/13-24'} | {n.network_address} | {n.netmask} | /28 | {h[0]} | {h[-1]} | {n.broadcast_address} | {len(h)} |")
    o.append("\n## Endereçamento por porta\n\nRegra: o último octeto = endereço da rede da VLAN + posição do host na VLAN (porta 1 ou 13 → +1 … porta 12 ou 24 → +12). Nomes sugeridos: `PC-ENG-11-01`, `IMP-ENG-11`, `SRV-ENG-11`.\n")
    for dep in d.values():
        o.append(f"\n### {dep['nome']} – {dep['sw']} – IP {dep['modo']} – bloco {dep['bloco27']}\n")
        o.append("| Porta | VLAN | Dispositivo | Nome sugerido | IP / máscara | Origem |\n|---|---|---|---|---|---|")
        sigla = dep["sw"].split("-")[1]
        for v in dep["vlans"]:
            n_pc = 0
            for h in v["hosts"]:
                if h["papel"] == "PC":
                    n_pc += 1; nome = f"PC-{sigla}-{v['id']}-{n_pc:02d}"
                elif h["papel"] == "Impressora": nome = f"IMP-{sigla}-{v['id']}"
                else: nome = f"SRV-{sigla}-{v['id']}"
                o.append(f"| Fa0/{h['porta']} | {v['id']} | {h['papel']} | {nome} | {h['ip']}/28 | {h['origem']} |")
        if dep["modo"] == "DHCP":
            o.append("\n> Em PCs e impressoras com origem DHCP, o IP da tabela é o **previsto** pela sequência do pool; a associação exata porta↔IP depende da ordem em que cada dispositivo pede o endereço. Os servidores são sempre estáticos.")
            o.append("\n**Pools DHCP (um servidor por VLAN):**\n\n| VLAN | Servidor (estático) | Start IP | Máscara | Max users | Faixa entregue |\n|---|---|---|---|---|---|")
            for v in dep["vlans"]:
                p = v["pool"]; ini = ip.ip_address(p["inicio"])
                o.append(f"| {v['id']} | {p['servidor']} | {p['inicio']} | 255.255.255.240 | {p['max']} | {p['inicio']} – {ini+p['max']-1} |")
    o.append("\n## Interligação dos switches (cadeia, trunk 802.1Q)\n\n| Enlace | Ponta A | Ponta B |\n|---|---|---|")
    for i, (a, pa, b, pb) in enumerate(LINKS, 1):
        o.append(f"| {i} | {a} {pa} | {b} {pb} |")
    return "\n".join(o) + "\n"

def config(dep, todas):
    sw = dep["sw"]
    c = [f"! {sw} - Cisco {MODELO} - Departamento {dep['nome']}",
         "! Modelo confirmado no PASSO 0: Fa0/1-24, Gi0/1-2 e Vlan1 (show ip interface brief)",
         "enable", "configure terminal", f"hostname {sw}", "!",
         "! VTP transparente: cada switch mantém o próprio banco de VLANs, sem anúncios",
         "vtp mode transparent", "!",
         "! Banco de VLANs idêntico nos 4 switches (padrão corporativo; só as VLANs do",
         "! próprio departamento têm portas de acesso neste switch)"]
    for dp in todas:
        for i, v in enumerate(dp["vlans"], 1):
            c += [f"vlan {v['id']}", f" name {dp['sw'][3:]}-VLAN{i}"]
    c += ["exit", "!"]
    for i, v in enumerate(dep["vlans"]):
        faixa = "FastEthernet0/1 - 12" if i == 0 else "FastEthernet0/13 - 24"
        c += [f"interface range {faixa}", " switchport mode access", f" switchport access vlan {v['id']}", " no shutdown", "exit"]
    c.append("!")
    permitidas = ",".join(str(v["id"]) for dp in todas for v in dp["vlans"])
    for u in UPLINKS[sw]:
        c += [f"interface GigabitEthernet0/{u[-1]}", " switchport mode trunk",
              f" switchport trunk allowed vlan {permitidas}", " no shutdown", "exit", "!"]
    c += ["end", "write memory", "!",
          "! Verificação: show vlan brief | show interfaces trunk | show running-config"]
    return "\n".join(c) + "\n"

if __name__ == "__main__":
    d = modelo(); todas = list(d.values())
    open("tabela_enderecamento.md", "w").write(tabela(d))
    for sw, dep in d.items():
        open(f"configs/{sw}.txt", "w").write(config(dep, todas))
    json.dump({"depts": d, "links": LINKS, "uplinks": UPLINKS}, open("projeto.json", "w"), indent=1, ensure_ascii=False)
    print("ok")
