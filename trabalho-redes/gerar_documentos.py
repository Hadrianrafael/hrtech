#!/usr/bin/env python3
"""Gera 02_guia_execucao_packet_tracer.md (guia final) e 04_relatorio.md a partir do mesmo modelo da v2."""
import ipaddress as ip
from gerar_projeto import modelo, config, LINKS, UPLINKS

D = modelo(); TODAS = list(D.values())
MASCARA = "255.255.255.240"

def hosts(dep):
    """lista de (porta, vid, papel, nome, ip, origem)"""
    out = []; sig = dep["sw"].split("-")[1]
    for v in dep["vlans"]:
        n = 0
        for h in v["hosts"]:
            if h["papel"] == "PC": n += 1; nome = f"PC-{sig}-{v['id']}-{n:02d}"
            elif h["papel"] == "Impressora": nome = f"IMP-{sig}-{v['id']}"
            else: nome = f"SRV-{sig}-{v['id']}"
            out.append((h["porta"], v["id"], h["papel"], nome, h["ip"], h["origem"]))
    return out
H = {sw: hosts(d) for sw, d in D.items()}
def find(sw, vid, papel, k=1):
    c = [h for h in H[sw] if h[1] == vid and h[2] == papel]; return c[k-1]

# ---------- testes e prints ----------
TESTES = []   # dict(id, grupo, src, dst, esperado)
def novo(grupo, src, dst, ok, nota=""):
    TESTES.append(dict(id=f"T{len(TESTES)+1:02d}", grupo=grupo, src=src, dst=dst, ok=ok, nota=nota))
for sw, dep in D.items():
    for v in dep["vlans"]:
        vid = v["id"]; s = find(sw, vid, "PC", 1)
        for d in (find(sw, vid, "PC", 2), find(sw, vid, "Impressora"), find(sw, vid, "Servidor")):
            novo(f"G{vid}", s, d, True)
for sw, dep in D.items():
    v1, v2 = dep["vlans"]
    novo(f"N{sw}", find(sw, v1["id"], "PC", 1), find(sw, v2["id"], "Servidor"), False)
novo("X1", find("SW-ENG", 11, "PC", 1), find("SW-COMP", 21, "Servidor"), False)
novo("X2", find("SW-COMP", 21, "PC", 1), find("SW-TI", 31, "Servidor"), False)
novo("X3", find("SW-TI", 31, "PC", 1), find("SW-INFRA", 41, "Servidor"), False)

PRINTS = []   # (rótulo, descrição, legenda, obrigatório)
FIG = {}      # chave -> int (Figura do relatório) ou "D-nn" (só validação/diagnóstico)
_nf = [0]; _nd = [0]
def pr(chave, desc, leg, obr):
    if obr: _nf[0] += 1; rot = _nf[0]
    else: _nd[0] += 1; rot = f"D-{_nd[0]:02d}"
    PRINTS.append((rot, desc, leg, obr)); FIG[chave] = rot; return rot
def rotl(r): return f"Figura {r}" if isinstance(r, int) else r
OBR_PC = {"PC-ENG-11-01", "PC-TI-31-01"}
OBR_DHCP = {"SRV-COMP-21", "SRV-INFRA-41"}
OBR_IPC = {"PC-COMP-21-01", "PC-INFRA-41-01"}
OBR_PING = {"G11", "G21", "G31", "G41", "NSW-ENG", "X1"}
pr("modelo", "CLI do switch escolhido: `show ip interface brief`", "Interfaces do switch utilizado (Fa0/1-24 e Gi0/1-2) no Packet Tracer", True)
pr("topo", "Topologia completa (workspace inteiro, zoom que mostre os 4 departamentos e os 3 enlaces entre switches)", "Topologia completa da rede da Super Tech", True)
for sw in D: pr("vlan:"+sw, f"CLI de {sw}: `show vlan brief`", f"VLANs e portas de acesso do {sw}", True)
for sw in D: pr("trunk:"+sw, f"CLI de {sw}: `show interfaces trunk` e `show cdp neighbors`", f"Trunks e vizinhos CDP do {sw}", sw in ("SW-COMP", "SW-TI"))
STAT = {"SW-ENG": 11, "SW-TI": 31}
for sw, vid in STAT.items():
    for papel in ("PC", "Impressora", "Servidor"):
        h = find(sw, vid, papel); pr("ip:"+h[3], f"Tela de IP estático de {h[3]}", f"Configuração de IP estático de {h[3]} ({h[4]}/28)", h[3] in OBR_PC)
for sw, vid in (("SW-COMP", 21), ("SW-INFRA", 41)):
    h = find(sw, vid, "Servidor"); pr("ip:"+h[3], f"Tela de IP estático de {h[3]}", f"Configuração de IP estático do servidor DHCP {h[3]} ({h[4]}/28)", False)
for sw in ("SW-COMP", "SW-INFRA"):
    for v in D[sw]["vlans"]:
        h = find(sw, v["id"], "Servidor"); pr("dhcp:"+h[3], f"Aba Services → DHCP de {h[3]}", f"Pool DHCP do servidor {h[3]} (VLAN {v['id']})", h[3] in OBR_DHCP)
for sw in ("SW-COMP", "SW-INFRA"):
    for v in D[sw]["vlans"]:
        h = find(sw, v["id"], "PC", 1); pr("ipc:"+h[3], f"Command Prompt de {h[3]}: `ipconfig`", f"Endereço obtido por DHCP por {h[3]} (VLAN {v['id']})", h[3] in OBR_IPC)
for sw in ("SW-COMP", "SW-INFRA"):
    h = find(sw, D[sw]["vlans"][0]["id"], "Impressora"); pr("impd:"+h[3], f"Config → FastEthernet0 de {h[3]} (DHCP)", f"Impressora {h[3]} configurada em DHCP", False)
GR = {}
for t in TESTES:
    if t["grupo"] not in GR:
        if t["grupo"].startswith("G"): leg = f"Testes de ping na VLAN {t['grupo'][1:]} (origem {t['src'][3]})"
        elif t["grupo"].startswith("N"): leg = f"Ping entre VLANs do mesmo departamento: {t['src'][3]} → {t['dst'][3]} (falha esperada pelo projeto)"
        else: leg = f"Ping entre departamentos: {t['src'][3]} → {t['dst'][3]} (falha esperada pelo projeto)"
        GR[t["grupo"]] = pr("ping:"+t["grupo"], f"Command Prompt de {t['src'][3]}: pings dos testes " + ", ".join(x["id"] for x in TESTES if x["grupo"] == t["grupo"]) + " (tudo na mesma tela)", leg, t["grupo"] in OBR_PING)
    t["print"] = GR[t["grupo"]]
def exp(t):
    if t["ok"]: return "Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas)"
    return "Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador)"
PRINTS_BY = {p[0]: p[2] for p in PRINTS if p[3]}
def ipf(h): return h[4] + ("*" if h[5] == "DHCP" and h[2] != "Servidor" else "")

# ---------- GUIA ----------
def guia():
    o = []
    A = o.append
    A("# GUIA FINAL – execução no Cisco Packet Tracer\n")
    A("> # ▶ PASSO 0 — CONCLUÍDO\n> **Modelo definitivo dos 4 switches: Cisco 2960-24TT.** Confirmado pelo aluno no Packet Tracer com `show ip interface brief`: FastEthernet0/1 a 0/24, GigabitEthernet0/1, GigabitEthernet0/2 e Vlan1.\n")
    A("## PASSO 0 — verificação do switch (feito)\n")
    A("Registro do que foi feito: switch **2960-24TT** (categoria Switches) colocado na área de trabalho → aba **CLI** → Enter → `enable` → `show ip interface brief` → saída com Fa0/1-24, Gi0/1, Gi0/2 e Vlan1. Essa captura é a **Figura 1** do relatório.\n")
    A("Daqui em diante, **todos os switches são 2960-24TT**. Apague o switch de teste do PASSO 0 ou aproveite-o como SW-ENG (nesse caso, renomeie-o no PASSO 1).\n")
    A("---\n")
    A("Convenções do guia: **PC**, **Printer** e **Server** são os ícones da categoria *End Devices* (parte inferior esquerda do Packet Tracer). Máscara de **todos** os hosts: `255.255.255.240`. Gateway e DNS: deixar **vazios** em todos os dispositivos. Nenhuma etapa deste guia foi executada pelo autor do projeto: os resultados saem do **seu** Packet Tracer. Valores marcados com `*` são IPs **previstos** pelo DHCP; use sempre o valor real mostrado por `ipconfig`.\n")
    A("---\n\n## PASSO 1 — adicionar equipamentos (total: 100 equipamentos = 4 switches + 80 PCs + 8 impressoras + 8 servidores)\n")
    A("**Neste passo você só coloca e nomeia os equipamentos. Não ligue cabos e não configure nada.** Os cabos são o PASSO 2.\n")
    A("### 1.1 Preparação\n1. Abra o Packet Tracer com o projeto vazio (ou o do PASSO 0). Confira que está na visão **Logical** (botão no canto superior esquerdo da área de trabalho).\n2. Para caber tudo na tela, aumente a janela e use o zoom: roda do mouse com **Ctrl**, ou os botões de zoom da barra lateral direita.\n3. Salve já: **File → Save As →** `SuperTech.pkt`. Salve de novo ao fim de cada passo.\n")
    A("### 1.2 Onde estão os equipamentos (barra inferior esquerda)\n- **Switch:** clique no ícone **Switches** (o segundo da fileira de categorias) → na lista ao lado, clique em **2960-24TT**.\n- **PC, Impressora e Servidor:** clique no ícone **End Devices** (primeiro da fileira) → na lista ao lado, clique em **PC** (computador), **Printer** (impressora) ou **Server** (servidor).\n- **Como colocar:** clique no modelo e depois clique **uma vez** na área de trabalho. **Dica:** para colocar vários seguidos, segure **Ctrl** ao clicar no modelo e clique na área de trabalho quantas vezes quiser; aperte **Esc** para parar.\n")
    A("### 1.3 Como nomear cada equipamento\nClique no equipamento → aba **Config** → no topo, campo **Display Name** → apague o nome padrão, digite o nome da tabela abaixo e aperte **Enter**. O nome aparece embaixo do ícone. (Nos switches, o nome do CLI é ajustado no PASSO 3; aqui ajuste só o Display Name.) Confira a grafia: o resto do guia usa estes nomes exatos, em maiúsculas.\n")
    A("### 1.4 Quantidades e nomes\n")
    A("| Departamento | Equipamento | Qtd | Modelo (categoria) | Nomes exatos |\n|---|---|---|---|---|")
    for sw, dep in D.items():
        v1, v2 = dep["vlans"]; sg = sw.split("-")[1]
        A(f"| {dep['nome']} | Switch | 1 | 2960-24TT (Switches) | {sw} |")
        A(f"| | PC | 20 | PC (End Devices) | PC-{sg}-{v1['id']}-01 a PC-{sg}-{v1['id']}-10 e PC-{sg}-{v2['id']}-01 a PC-{sg}-{v2['id']}-10 |")
        A(f"| | Impressora | 2 | Printer (End Devices) | IMP-{sg}-{v1['id']}, IMP-{sg}-{v2['id']} |")
        A(f"| | Servidor | 2 | Server (End Devices) | SRV-{sg}-{v1['id']}, SRV-{sg}-{v2['id']} |")
    A("\n### 1.5 Onde posicionar\nDivida a área de trabalho em **4 colunas, da esquerda para a direita, na ordem da cadeia de switches**: Engenharia | Compras | TI Interno | Infraestrutura. Em cada coluna, o **switch fica no meio**; os 12 dispositivos da **1ª VLAN ficam acima** do switch e os 12 da **2ª VLAN ficam abaixo** (topologia estrela; cada grupo de 12 em 2 fileiras de 6):\n")
    A("```\n  fileira 1 (acima):   PC-xx-v1-01 .. PC-xx-v1-06\n  fileira 2 (acima):   PC-xx-v1-07 .. PC-xx-v1-10, IMP-xx-v1, SRV-xx-v1\n\n                       [ SW-xxxx ]   <- centro da coluna\n\n  fileira 3 (abaixo):  PC-xx-v2-01 .. PC-xx-v2-06\n  fileira 4 (abaixo):  PC-xx-v2-07 .. PC-xx-v2-10, IMP-xx-v2, SRV-xx-v2\n```")
    A("Mantenha a mesma ordem da esquerda para a direita em todas as fileiras (01, 02, 03…). Isso evita cruzar cabos no PASSO 2. Se a tela ficar apertada, afaste as colunas e use zoom menor; o que importa é a posição relativa, não a distância.\n")
    A("As VLANs de cada departamento são (1ª VLAN = portas 1-12; 2ª VLAN = portas 13-24):\n")
    A("| Departamento | 1ª VLAN (acima do switch) | 2ª VLAN (abaixo do switch) |\n|---|---|---|")
    for sw, dep in D.items():
        A(f"| {dep['nome']} ({sw}) | {dep['vlans'][0]['id']} | {dep['vlans'][1]['id']} |")
    A("\n### 1.6 Checkpoint do PASSO 1 (confira antes de seguir)\n- [ ] 4 switches 2960-24TT, nomeados SW-ENG, SW-COMP, SW-TI, SW-INFRA, na ordem da esquerda para a direita.\n- [ ] Em cada departamento: 20 PCs, 2 impressoras e 2 servidores (24 equipamentos ao redor do switch).\n- [ ] Nenhum nome repetido ou com erro de grafia (compare com a tabela 1.4).\n- [ ] Nenhum cabo ligado e nenhuma configuração feita.\n- [ ] Arquivo salvo.\n")
    A("**Envie-me ao terminar:** uma captura da área de trabalho inteira (zoom que mostre os 4 departamentos) e a confirmação de que o checkpoint está completo, com qualquer dúvida ou nome que não tenha conseguido digitar.\n")
    A("---\n\n## PASSO 2 — conectar equipamentos\n")
    A("### 2.1 Hosts → switch (96 cabos)\nCategoria **Connections** (ícone do raio) → **Copper Straight-Through** (linha preta contínua). Clique no host A, escolha a porta A; clique no switch B, escolha a porta B.\n")
    for sw, dep in D.items():
        A(f"\n**{dep['nome']} – {sw}** (Dispositivo B = {sw})\n")
        A("| Dispositivo A | Porta A | Porta B ({}) | Cabo |\n|---|---|---|---|".format(sw))
        for p, vid, papel, nome, a, o_ in H[sw]:
            A(f"| {nome} | FastEthernet0 | FastEthernet0/{p} | Copper Straight-Through |")
    A("\n### 2.2 Switch ↔ switch (3 cabos)\nCategoria **Connections** → **Copper Cross-Over** (linha preta tracejada).\n")
    A("| Dispositivo A | Porta A | Dispositivo B | Porta B | Cabo |\n|---|---|---|---|---|")
    for a, pa, b, pb in LINKS:
        A(f"| {a} | GigabitEthernet0/{pa[-1]} | {b} | GigabitEthernet0/{pb[-1]} | Copper Cross-Over |")
    A("\nAguarde as luzes dos enlaces ficarem verdes (alguns segundos; use o botão de avanço de tempo, se necessário). Os enlaces entre switches só ficam verdes após o PASSO 3.\n")
    A("---\n\n## PASSO 3 — configurar os 4 switches (CLI)\n")
    A("Para **cada switch**: clique no switch → aba **CLI** → Enter → cole o bloco inteiro (botão direito → Paste, ou Ctrl+V). Se faltarem linhas, cole em blocos de ~10 linhas. Os mesmos arquivos estão em `configs/`.\n")
    for sw, dep in D.items():
        A(f"\n### {sw} ({dep['nome']})\n```\n{config(dep, TODAS).rstrip()}\n```")
    A("\nSe o Packet Tracer rejeitar **apenas** a linha `vtp mode transparent` ou a linha `switchport trunk allowed vlan ...`, apague essa linha e continue; o isolamento não depende delas (IDs de VLAN exclusivos). Anote qualquer linha rejeitada para me enviar.\n")
    A("---\n\n## PASSO 4 — IPs estáticos\n")
    A("Máscara em todos: `255.255.255.240`. Gateway e DNS vazios.\n")
    A("- **PC:** clique no PC → aba **Desktop** → ícone **IP Configuration** → marque **Static** → preencha **IP Address** e **Subnet Mask** → feche a janela.")
    A("- **Impressora e Servidor:** clique no equipamento → aba **Config** → no menu da esquerda clique em **FastEthernet0** → em *IP Configuration* marque **Static** → preencha **IP Address** e **Subnet Mask**.\n")
    for sw in ("SW-ENG", "SW-TI"):
        A(f"\n### {D[sw]['nome']} – todos os 24 dispositivos (estático)\n")
        A("| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |\n|---|---|---|---|---|")
        for p, vid, papel, nome, a, o_ in H[sw]:
            onde = "Desktop → IP Configuration" if papel == "PC" else "Config → FastEthernet0"
            A(f"| {nome} | {onde} | {a} | {MASCARA} | {vid} |")
    A("\n### Compras e Infraestrutura – somente os 2 servidores de cada departamento (4 no total; estático; são os servidores DHCP)\n")
    A("| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |\n|---|---|---|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for p, vid, papel, nome, a, o_ in H[sw]:
            if papel == "Servidor": A(f"| {nome} | Config → FastEthernet0 | {a} | {MASCARA} | {vid} |")
    A("\n---\n\n## PASSO 5 — serviço DHCP nos 4 servidores (Compras e Infraestrutura)\n")
    A("Faça **antes** do PASSO 6. Para cada servidor da tabela: clique no servidor → aba **Services** → menu da esquerda **DHCP** → **Service: On** → na lista de pools, clique no pool existente (*serverPool*) e edite os campos abaixo → clique **Save**.\n")
    A("| Servidor | Pool Name | Default Gateway | DNS Server | Start IP Address | Subnet Mask | Maximum Number of Users |\n|---|---|---|---|---|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for v in D[sw]["vlans"]:
            h = find(sw, v["id"], "Servidor"); p = v["pool"]
            A(f"| {h[3]} ({h[4]}) | POOL-{v['id']} | 0.0.0.0 | 0.0.0.0 | {p['inicio']} | {MASCARA} | {p['max']} |")
    A("\nSe o campo *Pool Name* não puder ser editado, mantenha `serverPool`. Os demais campos (TFTP, WLC) ficam como estão.\n")
    A("---\n\n## PASSO 6 — PCs e impressoras em DHCP (Compras e Infraestrutura)\n")
    A("- **PC:** clique no PC → **Desktop** → **IP Configuration** → marque **DHCP**. Aguarde aparecer `DHCP request successful` e o IP.")
    A("- **Impressora:** clique → **Config** → **FastEthernet0** → em *IP Configuration* marque **DHCP**.\n")
    for sw in ("SW-COMP", "SW-INFRA"):
        nomes = [h[3] for h in H[sw] if h[5] == "DHCP"]
        A(f"\n**{D[sw]['nome']} – {len(nomes)} dispositivos em DHCP:** " + ", ".join(nomes))
    A("\nIPs previstos (ordem em que cada um pede pode alterar a associação nome ↔ IP; o que vale é a faixa do pool):\n")
    A("| Dispositivo | IP previsto |\n|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for p, vid, papel, nome, a, o_ in H[sw]:
            if o_ == "DHCP": A(f"| {nome} | {a} |")
    A("\n---\n\n## PASSO 7 — comandos de verificação nos switches\n")
    A("Para **cada switch**: clique → **CLI** → Enter → `enable` → rode os comandos. Se aparecer `--More--`, pressione a barra de espaço.\n")
    for sw, dep in D.items():
        v1, v2 = dep["vlans"]
        A(f"\n### {sw}\n```\nenable\nshow vlan brief\nshow interfaces trunk\nshow cdp neighbors\n```")
        A(f"- `show vlan brief`: VLAN **{v1['id']}** ({sw[3:]}-VLAN1) com **Fa0/1 a Fa0/12**; VLAN **{v2['id']}** ({sw[3:]}-VLAN2) com **Fa0/13 a Fa0/24**; as outras 6 VLANs (dos demais departamentos) aparecem na lista **sem portas**; a VLAN 1 (`default`) aparece sem nenhuma das portas Fa0/1-24. **{rotl(FIG['vlan:'+sw])}.**")
        gi = ", ".join(f"Gi0/{u[-1]}" for u in UPLINKS[sw])
        A(f"- `show interfaces trunk`: {gi} em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.")
        viz = []
        for a, pa, b, pb in LINKS:
            if a == sw: viz.append(f"{b} (local Gig 0/{pa[-1]}, porta remota Gig 0/{pb[-1]})")
            if b == sw: viz.append(f"{a} (local Gig 0/{pb[-1]}, porta remota Gig 0/{pa[-1]})")
        A(f"- `show cdp neighbors`: " + "; ".join(viz) + f". **Print {FIG['trunk:'+sw]}** (os dois últimos comandos; se não couberem em um print, tire dois).")
    A("\n---\n\n## PASSO 8 — testes\n")
    A("Em cada teste: clique no PC de origem → aba **Desktop** → **Command Prompt** → digite o comando exato → Enter. Os pings do mesmo grupo (mesmo rótulo de captura) devem aparecer **na mesma tela** (rode em sequência, sem limpar). Antes de começar, em cada PC DHCP rode `ipconfig` e confirme o IP de origem.\n")
    A("| Teste | Computador de origem | IP origem | Destino | IP destino | Comando | Resultado esperado | Print |\n|---|---|---|---|---|---|---|---|")
    for t in TESTES:
        s, d = t["src"], t["dst"]
        A(f"| {t['id']} | {s[3]} | {ipf(s)} | {d[3]} | {ipf(d)} | `ping {d[4]}` | {exp(t)} | {rotl(t['print'])} |")
    A("\nObservação: `*` = IP previsto de dispositivo DHCP: **troque pelo IP real** (`ipconfig` no PC; tela *Config → FastEthernet0* da impressora) antes de digitar o `ping`. Os testes de **falha** são o resultado tecnicamente correto neste projeto (sub-redes distintas, sem roteador) e provam a segmentação; **não** são defeito.\n")
    A("---\n\n## PASSO 9 — salvar\nMenu **File → Save As** → nome `SuperTech.pkt`. Salve de novo ao final de todos os testes.\n")
    nobr = sum(1 for p in PRINTS if p[3]); ndia = len(PRINTS) - nobr
    A("---\n\n## CHECKLIST DE PRINTS PARA O TRABALHO\n")
    A(f"Capture cada tela (Windows: Win+Shift+S) e salve como `figura-NN.png` ou `D-NN.png`. Nada abaixo foi capturado ainda. Total: **{len(PRINTS)} capturas**, das quais **{nobr} entram no relatório** e {ndia} servem só para validação.\n")
    A(f"### A) OBRIGATÓRIOS PARA O RELATÓRIO ({nobr} figuras)\n")
    A("Cada um vira a **Figura de mesmo número** em `04_relatorio.md`. As demais saídas entram no relatório como **texto** (tabelas), não como imagem.\n")
    A("| Figura | O que capturar | Feito |\n|---|---|---|")
    for rot, desc, leg, obr in PRINTS:
        if obr: A(f"| {rot} | {desc} | " + ("[x] já capturada (`figuras/figura-01.png`)" if rot == 1 else "[ ]") + " |")
    A(f"\n### B) APENAS PARA VALIDAÇÃO/DIAGNÓSTICO ({ndia} capturas)\n")
    A("**Não** vão para o relatório. Capture se puder (servem de prova pessoal e de diagnóstico se algo falhar); o **texto** dos pings e dos IPs correspondentes entra nas tabelas do relatório.\n")
    A("| Rótulo | O que capturar | Feito |\n|---|---|---|")
    for rot, desc, leg, obr in PRINTS:
        if not obr: A(f"| {rot} | {desc} | [ ] |")
    A("")
    A("---\n\n## O QUE ME ENVIAR DEPOIS\n")
    A("1. **Texto copiado** (não só imagem) das saídas: `show ip interface brief` (PASSO 0), os `show` dos 4 switches e os pings dos 31 testes (assim eu monto as tabelas de resultado sem erro de leitura).\n2. As figuras obrigatórias numeradas, ou ao menos a confirmação de quais foram tiradas.\n3. O modelo de switch que você de fato usou.\n4. Qualquer linha de configuração rejeitada, qualquer teste que **não** deu o resultado esperado (copie a saída) e os IPs reais recebidos por DHCP.\n5. O `SuperTech.pkt` (entrega sua, ao professor).")
    return "\n".join(o) + "\n"

# ---------- RELATÓRIO ----------
def relatorio():
    F = FIG
    def ins(chave, desc): return f"`[INSERIR FIGURA {F[chave]} — {desc.replace(chr(96), chr(39))}]`"
    def leg(chave, txt): return f"*Figura {F[chave]} – {txt}.*"
    r = []; A = r.append
    A("""<!-- ATENÇÃO (apagar antes de entregar): a redação em tempo presente descreve o PROJETO. Só entregue depois de executar o guia e substituir TODOS os marcadores `[INSERIR ...]` por resultados reais obtidos no seu Packet Tracer. Não deixe resultado previsto como se fosse obtido. -->

<div align="center">

**ANHANGUERA**

**Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas**

&nbsp;

**REDES DE COMPUTADORES**

&nbsp;

# Projeto de Rede da Empresa Super Tech no Cisco Packet Tracer

&nbsp;

Aluno: Hadrian Rafael Silva de Oliveira
RA: 3502923907
Situação: Formando
Unidade: Suzano/SP – I(12563675)AC
Semestre: 2º semestre de 2026
Mediador Pedagógico Online: Rogian Villa

&nbsp;

Suzano/SP – 2026

</div>

---

## Identificação

| Campo | Informação |
|---|---|
| Aluno | Hadrian Rafael Silva de Oliveira |
| RA | 3502923907 |
| Curso | Superior de Tecnologia em Análise e Desenvolvimento de Sistemas |
| Disciplina | Redes de Computadores |
| Semestre | 2º semestre de 2026 |
| Unidade | Suzano/SP – I(12563675)AC |
| Situação | Formando |
| Mediador Pedagógico Online | Rogian Villa |
| Instituição | Anhanguera |
| Atividade | Aula prática – simulação da rede da Super Tech no Cisco Packet Tracer |

---

## 1. Introdução

Uma rede de computadores é um conjunto de dispositivos interligados que trocam dados por meio de meios de transmissão e de protocolos comuns. A forma como esses dispositivos são ligados entre si é a topologia. Neste trabalho cada departamento foi organizado em **topologia estrela**: todos os equipamentos se ligam a um ponto central, que aqui é um **switch**. A vantagem da estrela é que o defeito em um cabo afeta apenas um equipamento; a desvantagem é a dependência do ponto central.

O **switch** trabalha na camada de enlace: aprende os endereços MAC dos equipamentos ligados a cada porta e encaminha os quadros somente para a porta de destino, o que evita colisões e reduz o tráfego desnecessário. Já a comunicação entre redes diferentes depende de equipamentos de camada de rede, como o roteador.

O endereçamento usa o **IPv4**, com 32 bits divididos em parte de rede e parte de host por uma máscara. Em uma rede Classe C a máscara padrão é /24 (255.255.255.0). É possível dividir esse bloco em sub-redes menores (**subnetting**), emprestando bits da parte de host. Cada sub-rede com *n* bits de host tem 2ⁿ − 2 endereços utilizáveis, porque o primeiro endereço identifica a rede e o último é o de broadcast. O bloco 192.168.10.0/24 usado aqui pertence à faixa de endereços privados definida na RFC 1918.

As **VLANs** (redes locais virtuais) dividem logicamente um switch em domínios de broadcast independentes, mesmo que os equipamentos estejam no mesmo aparelho. Por boa prática, cada VLAN corresponde a uma sub-rede IP própria. Quando há mais de um switch, a ligação entre eles pode ser um **trunk** (IEEE 802.1Q), que transporta o tráfego de várias VLANs no mesmo cabo.

O **DHCP** distribui endereços IP automaticamente a partir de uma faixa configurada em um servidor, evitando a configuração manual de cada host. Como o pedido do cliente é um broadcast, ele só alcança servidores da mesma VLAN, a menos que exista um agente de relay.

A atividade tem como finalidade simular, no **Cisco Packet Tracer**, a rede da empresa fictícia Super Tech, com quatro departamentos (Engenharia, Compras, TI Interno e Infraestrutura), praticando subnetting, criação de VLANs, interligação de switches e atribuição de IPs estáticos e dinâmicos.

## 2. Métodos

### 2.1 Equipamentos

Foram utilizados o Cisco Packet Tracer, 4 switches, 80 PCs, 8 servidores e 8 impressoras. Cada departamento tem 20 estações, 2 servidores e 2 impressoras, totalizando 24 hosts por departamento e 96 hosts na rede.

O enunciado cita o switch 2950-24. Como as 24 portas FastEthernet de cada switch são ocupadas pelos hosts, a interligação dos switches exige portas adicionais. Antes da montagem, o modelo foi verificado no simulador com o comando `show ip interface brief`. Foi adotado o **Cisco 2960-24TT**, que apresentou 24 portas FastEthernet (Fa0/1 a Fa0/24), duas portas GigabitEthernet (Gi0/1 e Gi0/2) e a interface Vlan1 (Figura 1). As portas Gigabit são usadas na interligação dos switches. Trata-se de um modelo diferente do 2950-24 citado no enunciado, escolhido por possuir as portas necessárias para a interligação sem consumir as portas dos hosts.

![Figura 1 – Interfaces do switch utilizado](figuras/figura-01.png)

""" + leg("modelo", "Interfaces do switch utilizado") + """

### 2.2 Cálculo das sub-redes

Cada departamento tem 24 hosts. Com 5 bits de host (/27) há 2⁵ − 2 = 30 endereços utilizáveis, suficientes para 24; com 4 bits (/28) há 2⁴ − 2 = 14, o que não comporta 24, mas comporta os 12 hosts de cada VLAN. O enunciado afirma que "a rede seria de 227, o host de 25". Como 227 não é um valor válido para um octeto de máscara (os valores possíveis são 0, 128, 192, 224, 240, 248, 252, 254 e 255), a leitura adotada foi **/27 (255.255.255.224) com 2⁵ endereços por sub-rede**, o menor bloco que comporta 24 hosts.

A partir do bloco 192.168.10.0/24 foram reservados quatro blocos /27, um por departamento. Como cada departamento tem duas VLANs e cada VLAN deve ter sua própria sub-rede IP, cada /27 foi dividido em dois /28 (255.255.255.240), um por VLAN. Os hosts usam a máscara /28. O espaço 192.168.10.128/25 ficou livre.

### 2.3 VLANs e portas

Em cada switch, as portas Fa0/1 a Fa0/12 formam a primeira VLAN e as portas Fa0/13 a Fa0/24 formam a segunda VLAN, cada uma com 10 estações, 1 impressora e 1 servidor (portas 1–10, 11 e 12 na primeira; 13–22, 23 e 24 na segunda).

Como os switches são interligados por trunk, repetir os identificadores 1 e 2 em todos os departamentos faria cada VLAN atravessar todos os switches e juntaria os departamentos em um único domínio de broadcast, além de colocar dois servidores DHCP na mesma rede. Por isso as VLANs receberam identificadores exclusivos por departamento, preservando a divisão 1–12 e 13–24 do roteiro:

| Departamento | Primeira VLAN (portas 1–12) | Segunda VLAN (portas 13–24) |
|---|---|---|
| Engenharia | 11 | 12 |
| Compras | 21 | 22 |
| TI Interno | 31 | 32 |
| Infraestrutura | 41 | 42 |

Essa é uma interpretação do enunciado, que não esclarece se "VLAN 1" e "VLAN 2" são números literais ou apenas a primeira e a segunda VLAN de cada departamento.

### 2.4 Interligação dos switches

Os switches foram ligados em cadeia (SW-ENG – SW-COMP – SW-TI – SW-INFRA) por trunks 802.1Q nas portas Gigabit (Tabela 3). O banco de VLANs é o mesmo nos quatro switches, com VTP em modo transparente, e cada VLAN possui portas de acesso em apenas um switch. O enunciado não define o desenho da interligação; a cadeia usa três enlaces e não forma laços.

### 2.5 Endereçamento IP

Engenharia e TI Interno usam IP estático em todos os dispositivos, seguindo a posição na VLAN (primeiro host = endereço da rede + 1). Compras e Infraestrutura usam IP dinâmico: os servidores têm IP estático e executam o serviço DHCP, um por VLAN; PCs e impressoras recebem endereço por DHCP, com pools em sequência (Start IP = endereço da rede + 1, no máximo 11 endereços, que correspondem a 10 PCs e 1 impressora). Os comandos usados nos switches e os valores de cada dispositivo estão no guia de execução (`02_guia_execucao_packet_tracer.md`) e nos arquivos `configs/`.

## 3. Desenvolvimento

A rede foi montada em quatro etapas: (1) inserção dos equipamentos e cabeamento em estrela, com cabos diretos entre hosts e switch e cabos cruzados entre switches; (2) configuração dos switches (VLANs, portas de acesso e trunks); (3) configuração dos IPs estáticos em Engenharia e TI Interno; (4) configuração dos servidores DHCP e dos clientes de Compras e Infraestrutura.

""" + ins("topo", "TOPOLOGIA COMPLETA DO PACKET TRACER") + "\n\n" + leg("topo", "Topologia completa da rede da Super Tech") + """

**Tabela 1 – Sub-redes por departamento (/27)**

| Departamento | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast |
|---|---|---|---|---|---|---|""")
    for dep in D.values():
        n = ip.ip_network(dep["bloco27"]); h = list(n.hosts())
        A(f"| {dep['nome']} | {n.network_address} | {n.netmask} | /27 | {h[0]} | {h[-1]} | {n.broadcast_address} |")
    A("\n**Tabela 2 – Sub-redes por VLAN (/28)**\n\n| Departamento | VLAN | Portas | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast |\n|---|---|---|---|---|---|---|---|---|")
    for dep in D.values():
        for i, v in enumerate(dep["vlans"]):
            n = ip.ip_network(v["rede"]); h = list(n.hosts())
            A(f"| {dep['nome']} | {v['id']} | {'Fa0/1–12' if i==0 else 'Fa0/13–24'} | {n.network_address} | {n.netmask} | /28 | {h[0]} | {h[-1]} | {n.broadcast_address} |")
    A("\n**Tabela 3 – Interligação dos switches (trunk 802.1Q, cabo cruzado)**\n\n| Enlace | Switch A / porta | Switch B / porta |\n|---|---|---|")
    for i, (a, pa, b, pb) in enumerate(LINKS, 1): A(f"| {i} | {a} Gi0/{pa[-1]} | {b} Gi0/{pb[-1]} |")
    A("\n**Tabela 4 – Servidores DHCP e pools (Compras e Infraestrutura)**\n\n| VLAN | Servidor | IP do servidor (estático) | Start IP | Máximo de usuários | Faixa prevista |\n|---|---|---|---|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for v in D[sw]["vlans"]:
            h = find(sw, v["id"], "Servidor"); p = v["pool"]; ini = ip.ip_address(p["inicio"])
            A(f"| {v['id']} | {h[3]} | {h[4]} | {p['inicio']} | {p['max']} | {p['inicio']} – {ini+p['max']-1} |")
    A("\nO endereçamento completo, porta por porta, está no Anexo A (`tabela_enderecamento.md`). As tabelas acima derivam apenas do planejamento; a confirmação no simulador está na seção 4.\n")
    A("## 4. Resultados\n")
    A("Esta seção reúne **somente** o que foi obtido no Packet Tracer. As capturas de tela estão nas figuras; as demais saídas (testes de ping, IPs recebidos) estão em tabelas, em texto.\n")
    A("### 4.1 VLANs e portas\n")
    for sw in D:
        A(ins("vlan:"+sw, f"SAÍDA REAL DE `show vlan brief` DO {sw}") + "\n\n" + leg("vlan:"+sw, f"VLANs e portas de acesso do {sw}") + "\n")
    A("### 4.2 Trunks e interligação dos switches\n")
    A("Os switches SW-COMP e SW-TI, que ocupam as posições centrais da cadeia, têm duas portas de trunk cada; juntos, seus vizinhos CDP comprovam os três enlaces da Tabela 3.\n")
    for sw in ("SW-COMP", "SW-TI"):
        A(ins("trunk:"+sw, f"SAÍDA REAL DE `show interfaces trunk` E `show cdp neighbors` DO {sw}") + "\n\n" + leg("trunk:"+sw, f"Trunks e vizinhos CDP do {sw}") + "\n")
    for sw in ("SW-ENG", "SW-INFRA"):
        A(f"`[COLAR AQUI A SAÍDA REAL (TEXTO) DE show interfaces trunk E show cdp neighbors DO {sw}, em bloco de código]`\n")
    A("### 4.3 IPs estáticos (Engenharia e TI Interno)\n")
    for k in FIG:
        if k.startswith("ip:") and isinstance(FIG[k], int):
            nome = k[3:]; A(ins(k, f"TELA DE IP ESTÁTICO DE {nome}") + "\n\n" + leg(k, f"IP estático de {nome}") + "\n")
    A("Os demais dispositivos de Engenharia e TI Interno foram configurados com os IPs da Tabela do Anexo A.\n")
    A("### 4.4 DHCP (Compras e Infraestrutura)\n")
    for k in FIG:
        if k.startswith(("dhcp:", "ipc:")) and isinstance(FIG[k], int):
            nome = k.split(":")[1]; tipo = {"dhcp": "POOL DHCP DO SERVIDOR", "ipc": "`ipconfig` DO PC"}[k.split(":")[0]]
            A(ins(k, f"{tipo} {nome}") + "\n\n" + leg(k, {"dhcp": f"Pool DHCP do servidor {nome}", "ipc": f"Endereço obtido por DHCP por {nome}"}[k.split(":")[0]]) + "\n")
    A("**Tabela 5 – Endereços recebidos por DHCP (valores reais)**\n")
    A("Preencha com o que `ipconfig` (PCs) e a tela *Config → FastEthernet0* (impressoras) mostraram. A coluna *IP previsto* vem do planejamento; *IP recebido* é o valor real.\n")
    A("| Departamento | VLAN | Dispositivo | IP previsto | IP recebido |\n|---|---|---|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for p, vid, papel, nome, a, o_ in H[sw]:
            if o_ == "DHCP": A(f"| {D[sw]['nome']} | {vid} | {nome} | {a} | `[INSERIR IP REAL]` |")
    A("")
    A("### 4.5 Testes de conectividade\n")
    A("A Tabela 6 lista os testes de conectividade. A coluna *Resultado obtido* só pode ser preenchida com o que o simulador mostrou (por exemplo: `4 respostas, 0% de perda`, ou `Request timed out, 100% de perda`). Nos testes cujo destino é PC ou impressora de Compras/Infraestrutura, o IP do comando é o IP **real** da Tabela 5 (o da tabela abaixo é o previsto).\n")
    A("**Tabela 6 – Testes de ping**\n\n| Teste | Origem | Destino | Comando | Resultado esperado pelo projeto | Resultado obtido | Captura |\n|---|---|---|---|---|---|---|")
    for t in TESTES:
        rp = t["print"]
        cap = f"Figura {rp}" if isinstance(rp, int) else "—"
        A(f"| {t['id']} | {t['src'][3]} | {t['dst'][3]} | `ping {t['dst'][4]}` | {'Sucesso' if t['ok'] else 'Falha (sub-redes diferentes, sem roteador)'} | `[INSERIR RESULTADO REAL DO PING {t['src'][3]} → {t['dst'][3]}]` | {cap} |")
    A("")
    for g, n in GR.items():
        if isinstance(n, int):
            tt = [t for t in TESTES if t["grupo"] == g]
            A(f"`[INSERIR FIGURA {n} — PINGS REAIS DOS TESTES {', '.join(x['id'] for x in tt)} A PARTIR DE {tt[0]['src'][3]}]`\n\n*Figura {n} – " + PRINTS_BY[n] + ".*\n")
    A("### 4.6 Interpretação\n")
    A("O projeto prevê que (a) os dispositivos de uma mesma VLAN se comuniquem, pois compartilham o domínio de broadcast e a sub-rede /28; (b) dispositivos de VLANs diferentes do mesmo departamento, e de departamentos diferentes, **não** se comuniquem, pois estão em sub-redes distintas e o roteiro não prevê roteador (camada 3); (c) os PCs e impressoras de Compras e Infraestrutura recebam endereços das faixas dos pools da Tabela 4, sem endereços de um departamento aparecerem em outro, porque cada VLAN tem exatamente um servidor DHCP; e (d) os enlaces entre switches apareçam como trunk e como vizinhos CDP. Os resultados reais das Tabelas 5 e 6 e das Figuras devem ser comparados com essa previsão.\n")
    A("`[INSERIR 1 A 3 FRASES: o que os resultados reais confirmaram e, se houver, o que divergiu da previsão e a causa]`\n")
    A("### 4.7 Observações da execução\n")
    A("`[INSERIR, SE HOUVER: comandos rejeitados pelo Packet Tracer e como foram contornados; ajustes feitos; qualquer comportamento inesperado. Se não houve, escrever \"Não houve observações relevantes\".]`\n")
    A("## 5. Conclusão\n")
    A("A atividade permitiu projetar e simular uma rede com quatro departamentos, cada um em seu bloco de endereços, e mostrou como o subnetting dimensiona os endereços à necessidade: um /27 por departamento, com folga de seis endereços, e um /28 por VLAN. Também evidenciou que as VLANs segmentam o tráfego dentro do próprio switch, que cada VLAN deve ter sua própria sub-rede e que repetir identificadores de VLAN em switches interligados une os domínios de broadcast e provoca conflito entre servidores DHCP. O DHCP automatiza a atribuição de endereços em Compras e Infraestrutura, desde que haja um servidor em cada VLAN. Por fim, a atividade mostra que switches isolam o tráfego na camada 2 e que a comunicação entre sub-redes diferentes exige um dispositivo de camada 3, que o roteiro não inclui.\n")
    A("`[INSERIR 1 FRASE FINAL sobre a execução, coerente com a seção 4.6: por exemplo, se a simulação confirmou todos os comportamentos previstos]`\n")
    A("## Referências\n")
    A("- CISCO. *Cisco Packet Tracer*. Software de simulação de redes.\n- IEEE. *IEEE 802.1Q – Bridges and Bridged Networks* (VLANs e trunk).\n- IETF. *RFC 791 – Internet Protocol*, 1981.\n- IETF. *RFC 1918 – Address Allocation for Private Internets*, 1996.\n- IETF. *RFC 2131 – Dynamic Host Configuration Protocol*, 1997.\n- IETF. *RFC 4632 – Classless Inter-domain Routing (CIDR)*, 2006.\n")
    A("## Anexo A – Tabela de endereçamento completa\n\nVer `tabela_enderecamento.md`.\n")
    return "\n".join(r) + "\n"

if __name__ == "__main__":
    open("02_guia_execucao_packet_tracer.md", "w").write(guia())
    open("04_relatorio.md", "w").write(relatorio())
    print("prints:", len(PRINTS), "testes:", len(TESTES))
