#!/usr/bin/env python3
"""Gera 02_guia_execucao_packet_tracer.md, 04_relatorio.md e entrega/Relatorio_SuperTech.{docx,pdf}
a partir do mesmo modelo usado para tabela_enderecamento.md e configs/*.txt."""
import html, ipaddress as ip, os, re, shutil, subprocess, sys
from gerar_projeto import modelo, config, LINKS, UPLINKS

D = modelo(); TODAS = list(D.values())
MASCARA = "255.255.255.240"

def hosts(dep):
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
    return [h for h in H[sw] if h[1] == vid and h[2] == papel][k - 1]

# ---------- plano de verificação ----------
TESTES = []
def novo(src, dst, ok): TESTES.append(dict(id=f"T{len(TESTES)+1:02d}", src=src, dst=dst, ok=ok))
for sw, dep in D.items():
    for v in dep["vlans"]:
        vid = v["id"]; s = find(sw, vid, "PC", 1)
        for d in (find(sw, vid, "PC", 2), find(sw, vid, "Impressora"), find(sw, vid, "Servidor")): novo(s, d, True)
for sw, dep in D.items():
    v1, v2 = dep["vlans"]; novo(find(sw, v1["id"], "PC", 1), find(sw, v2["id"], "Servidor"), False)
novo(find("SW-ENG", 11, "PC", 1), find("SW-COMP", 21, "Servidor"), False)
novo(find("SW-COMP", 21, "PC", 1), find("SW-TI", 31, "Servidor"), False)
novo(find("SW-TI", 31, "PC", 1), find("SW-INFRA", 41, "Servidor"), False)
def ipf(h): return h[4] + ("*" if h[5] == "DHCP" and h[2] != "Servidor" else "")
ESP_OK = "Respostas do destino (comunicação na mesma VLAN)"
ESP_NOK = "Sem resposta (sub-redes diferentes, sem roteador)"
def linha_teste(t):
    s, d = t["src"], t["dst"]
    return f"| {t['id']} | {s[3]} | {ipf(s)} | {d[3]} | {ipf(d)} | `ping {d[4]}` | {ESP_OK if t['ok'] else ESP_NOK} |"
CAB_TESTE = "| Teste | Origem | IP origem | Destino | IP destino | Comando | Comportamento esperado |\n|---|---|---|---|---|---|---|"
NOTA_DHCP = "`*` indica endereço previsto para dispositivo em DHCP; na execução, usar o endereço efetivamente recebido."

# ---------- GUIA ----------
def guia():
    o = []; A = o.append
    A("# Guia de montagem e verificação no Cisco Packet Tracer\n")
    A("Este guia descreve, em ordem, como montar e configurar a rede da Super Tech no Cisco Packet Tracer e como verificá-la. É um procedimento de reprodução: não contém resultados de execução. Todos os valores vêm de `tabela_enderecamento.md` e de `configs/`.\n")
    A("Convenções: **PC**, **Printer** e **Server** são ícones da categoria *End Devices* (parte inferior esquerda do programa). Máscara de todos os hosts: `255.255.255.240`. Gateway e DNS: vazios em todos os dispositivos. Valores com `*` são endereços previstos para dispositivos em DHCP; vale o endereço efetivamente recebido.\n")
    A("---\n\n## PASSO 0 — modelo do switch (concluído)\n")
    A("O modelo definitivo dos quatro switches é o **Cisco 2960-24TT**. Verificação feita no Packet Tracer: categoria *Switches* → **2960-24TT** → aba **CLI** → Enter → `enable` → `show ip interface brief`. A saída lista FastEthernet0/1 a 0/24, GigabitEthernet0/1, GigabitEthernet0/2 e Vlan1 (Figura 1 do relatório). Se houver outro modelo de switch na área de trabalho, apague-o.\n")
    A("---\n\n## PASSO 1 — adicionar e nomear os equipamentos (100 no total)\n")
    A("Neste passo apenas se colocam e nomeiam os equipamentos: 4 switches, 80 PCs, 8 impressoras e 8 servidores. Cabos e configurações ficam para os passos seguintes.\n")
    A("### 1.1 Preparação\n1. Abra o Packet Tracer na visão **Logical** (botão no canto superior esquerdo da área de trabalho).\n2. Ajuste o zoom com **Ctrl + roda do mouse**.\n3. Salve: **File → Save As →** `SuperTech.pkt`. Salve novamente ao fim de cada passo.\n")
    A("### 1.2 Onde estão os equipamentos (barra inferior esquerda)\n- **Switch:** categoria **Switches** → **2960-24TT**.\n- **PC, impressora e servidor:** categoria **End Devices** → **PC**, **Printer** ou **Server**.\n- **Como colocar:** clique no modelo e depois uma vez na área de trabalho. Para colocar vários seguidos, segure **Ctrl** ao clicar no modelo e clique na área de trabalho; **Esc** encerra.\n")
    A("### 1.3 Como nomear\nClique no equipamento → aba **Config** → campo **Display Name** → digite o nome → **Enter**. Nos switches, o nome do CLI (hostname) é definido no PASSO 3; aqui ajusta-se só o Display Name. Os nomes abaixo são usados em todo o guia.\n")
    A("### 1.4 Quantidades e nomes\n")
    A("| Departamento | Equipamento | Qtd | Modelo (categoria) | Nomes |\n|---|---|---|---|---|")
    for sw, dep in D.items():
        v1, v2 = dep["vlans"]; sg = sw.split("-")[1]
        A(f"| {dep['nome']} | Switch | 1 | 2960-24TT (Switches) | {sw} |")
        A(f"| | PC | 20 | PC (End Devices) | PC-{sg}-{v1['id']}-01 a PC-{sg}-{v1['id']}-10 e PC-{sg}-{v2['id']}-01 a PC-{sg}-{v2['id']}-10 |")
        A(f"| | Impressora | 2 | Printer (End Devices) | IMP-{sg}-{v1['id']}, IMP-{sg}-{v2['id']} |")
        A(f"| | Servidor | 2 | Server (End Devices) | SRV-{sg}-{v1['id']}, SRV-{sg}-{v2['id']} |")
    A("\n### 1.5 Posicionamento\nQuatro colunas, da esquerda para a direita, na ordem da cadeia de switches: Engenharia, Compras, TI Interno, Infraestrutura. Em cada coluna o switch fica no centro; os 12 dispositivos da 1ª VLAN ficam acima e os 12 da 2ª VLAN ficam abaixo, em duas fileiras de 6 (topologia estrela):\n")
    A("```\n  fileira 1 (acima):   PC-xx-v1-01 .. PC-xx-v1-06\n  fileira 2 (acima):   PC-xx-v1-07 .. PC-xx-v1-10, IMP-xx-v1, SRV-xx-v1\n\n                       [ SW-xxxx ]\n\n  fileira 3 (abaixo):  PC-xx-v2-01 .. PC-xx-v2-06\n  fileira 4 (abaixo):  PC-xx-v2-07 .. PC-xx-v2-10, IMP-xx-v2, SRV-xx-v2\n```")
    A("Manter a mesma ordem da esquerda para a direita em todas as fileiras evita cruzamento de cabos no PASSO 2.\n")
    A("| Departamento | 1ª VLAN (acima do switch) | 2ª VLAN (abaixo do switch) |\n|---|---|---|")
    for sw, dep in D.items(): A(f"| {dep['nome']} ({sw}) | {dep['vlans'][0]['id']} | {dep['vlans'][1]['id']} |")
    A("\n### 1.6 Conferência do PASSO 1\n- 4 switches 2960-24TT nomeados SW-ENG, SW-COMP, SW-TI e SW-INFRA, nessa ordem.\n- Em cada departamento: 20 PCs, 2 impressoras e 2 servidores.\n- Nomes sem repetição e sem erro de grafia.\n- Nenhum cabo ligado e nenhuma configuração feita.\n")
    A("---\n\n## PASSO 2 — conectar os equipamentos\n")
    A("### 2.1 Hosts → switch (96 cabos)\nCategoria **Connections** (ícone do raio) → **Copper Straight-Through** (linha contínua). Clique no host (Dispositivo A), escolha a porta A; clique no switch (Dispositivo B), escolha a porta B.\n")
    for sw, dep in D.items():
        A(f"\n**{dep['nome']} – {sw}**\n")
        A(f"| Dispositivo A | Porta A | Porta B ({sw}) | Cabo |\n|---|---|---|---|")
        for p, vid, papel, nome, a, o_ in H[sw]: A(f"| {nome} | FastEthernet0 | FastEthernet0/{p} | Copper Straight-Through |")
    A("\n### 2.2 Switch ↔ switch (3 cabos)\nCategoria **Connections** → **Copper Cross-Over** (linha tracejada).\n")
    A("| Dispositivo A | Porta A | Dispositivo B | Porta B | Cabo |\n|---|---|---|---|---|")
    for a, pa, b, pb in LINKS: A(f"| {a} | GigabitEthernet0/{pa[-1]} | {b} | GigabitEthernet0/{pb[-1]} | Copper Cross-Over |")
    A("\nOs enlaces entre switches só ficam ativos depois do PASSO 3.\n")
    A("---\n\n## PASSO 3 — configurar os 4 switches (CLI)\n")
    A("Para cada switch: clique no switch → aba **CLI** → Enter → cole o bloco inteiro. Se faltarem linhas, cole em blocos de cerca de 10 linhas. Os mesmos textos estão em `configs/`.\n")
    for sw, dep in D.items(): A(f"\n### {sw} ({dep['nome']})\n```\n{config(dep, TODAS).rstrip()}\n```")
    A("\nSe o Packet Tracer rejeitar apenas a linha `vtp mode transparent` ou a linha `switchport trunk allowed vlan ...`, remover essa linha e prosseguir: o isolamento entre departamentos não depende delas, pois os identificadores de VLAN são exclusivos.\n")
    A("---\n\n## PASSO 4 — IPs estáticos\n")
    A("Máscara `255.255.255.240`; gateway e DNS vazios.\n")
    A("- **PC:** clique no PC → aba **Desktop** → **IP Configuration** → **Static** → preencher **IP Address** e **Subnet Mask**.\n- **Impressora e servidor:** clique no equipamento → aba **Config** → **FastEthernet0** (menu lateral) → em *IP Configuration* marcar **Static** → preencher **IP Address** e **Subnet Mask**.\n")
    for sw in ("SW-ENG", "SW-TI"):
        A(f"\n### {D[sw]['nome']} – 24 dispositivos (estático)\n")
        A("| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |\n|---|---|---|---|---|")
        for p, vid, papel, nome, a, o_ in H[sw]:
            A(f"| {nome} | {'Desktop → IP Configuration' if papel == 'PC' else 'Config → FastEthernet0'} | {a} | {MASCARA} | {vid} |")
    A("\n### Compras e Infraestrutura – servidores (estático; são os servidores DHCP)\n")
    A("| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |\n|---|---|---|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for p, vid, papel, nome, a, o_ in H[sw]:
            if papel == "Servidor": A(f"| {nome} | Config → FastEthernet0 | {a} | {MASCARA} | {vid} |")
    A("\n---\n\n## PASSO 5 — serviço DHCP nos servidores de Compras e Infraestrutura\n")
    A("Antes do PASSO 6. Em cada servidor: aba **Services** → **DHCP** → **Service: On** → editar o pool existente (*serverPool*) com os valores abaixo → **Save**.\n")
    A("| Servidor | Pool Name | Default Gateway | DNS Server | Start IP Address | Subnet Mask | Maximum Number of Users |\n|---|---|---|---|---|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for v in D[sw]["vlans"]:
            h = find(sw, v["id"], "Servidor"); p = v["pool"]
            A(f"| {h[3]} ({h[4]}) | POOL-{v['id']} | 0.0.0.0 | 0.0.0.0 | {p['inicio']} | {MASCARA} | {p['max']} |")
    A("\nSe o nome do pool não puder ser editado, manter `serverPool`.\n")
    A("---\n\n## PASSO 6 — PCs e impressoras em DHCP (Compras e Infraestrutura)\n")
    A("- **PC:** **Desktop** → **IP Configuration** → **DHCP**.\n- **Impressora:** **Config** → **FastEthernet0** → *IP Configuration* → **DHCP**.\n")
    for sw in ("SW-COMP", "SW-INFRA"):
        nomes = [h[3] for h in H[sw] if h[5] == "DHCP"]
        A(f"**{D[sw]['nome']} – {len(nomes)} dispositivos em DHCP:** " + ", ".join(nomes) + "\n")
    A("Endereços previstos (a associação nome ↔ endereço depende da ordem dos pedidos; o que vale é a faixa do pool):\n")
    A("| Dispositivo | IP previsto |\n|---|---|")
    for sw in ("SW-COMP", "SW-INFRA"):
        for p, vid, papel, nome, a, o_ in H[sw]:
            if o_ == "DHCP": A(f"| {nome} | {a} |")
    A("\n---\n\n## PASSO 7 — verificação nos switches\n")
    A("Em cada switch: aba **CLI** → Enter → `enable` → comandos abaixo. Se aparecer `--More--`, usar a barra de espaço.\n")
    for sw, dep in D.items():
        v1, v2 = dep["vlans"]
        A(f"\n### {sw}\n```\nenable\nshow vlan brief\nshow interfaces trunk\nshow cdp neighbors\n```")
        A(f"- `show vlan brief`: VLAN **{v1['id']}** ({sw[3:]}-VLAN1) com Fa0/1 a Fa0/12; VLAN **{v2['id']}** ({sw[3:]}-VLAN2) com Fa0/13 a Fa0/24; as outras 6 VLANs aparecem sem portas; a VLAN 1 (`default`) aparece sem as portas Fa0/1-24.")
        gi = ", ".join(f"Gi0/{u[-1]}" for u in UPLINKS[sw])
        A(f"- `show interfaces trunk`: {gi} em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.")
        viz = []
        for a, pa, b, pb in LINKS:
            if a == sw: viz.append(f"{b} (local Gig 0/{pa[-1]}, porta remota Gig 0/{pb[-1]})")
            if b == sw: viz.append(f"{a} (local Gig 0/{pb[-1]}, porta remota Gig 0/{pa[-1]})")
        A("- `show cdp neighbors`: " + "; ".join(viz) + ".")
    A("\n---\n\n## PASSO 8 — testes de conectividade\n")
    A("Em cada teste: clique no PC de origem → aba **Desktop** → **Command Prompt** → digitar o comando → Enter. Antes de começar, nos PCs em DHCP, rodar `ipconfig` e confirmar o endereço de origem.\n")
    A(CAB_TESTE)
    for t in TESTES: A(linha_teste(t))
    A("\n" + NOTA_DHCP + " Os testes sem resposta decorrem do projeto (sub-redes distintas e ausência de roteador): demonstram a segmentação.\n")
    A("---\n\n## PASSO 9 — salvar\n**File → Save As →** `SuperTech.pkt`.\n")
    return "\n".join(o) + "\n"

# ---------- RELATÓRIO (blocos) ----------
def relatorio_blocos():
    B = []; add = B.append
    def tabela(cap, header, rows): add(("cap", cap)); add(("table", header, rows))
    add(("cover", ["ANHANGUERA", "", "Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas", "", "Disciplina: Redes de Computadores", "", "PROJETO DA REDE DA EMPRESA SUPER TECH NO CISCO PACKET TRACER", "", "",
                   "Aluno: Hadrian Rafael Silva de Oliveira", "RA: 3502923907", "Situação: Formando", "Unidade: Suzano/SP – I(12563675)AC", "Semestre: 2º semestre de 2026", "Mediador Pedagógico Online: Rogian Villa", "", "", "Suzano/SP, 2026"]))
    add(("pb",))
    add(("h1", "Sumário"))
    add(("ul", ["1. Introdução", "2. Métodos", "3. Desenvolvimento", "4. Resultados", "5. Conclusão", "Referências", "Anexo A – Endereçamento por porta", "Anexo B – Configuração dos switches", "Anexo C – Plano de verificação"]))
    add(("pb",))
    add(("h1", "1. Introdução"))
    add(("p", "Uma rede de computadores é um conjunto de dispositivos interligados que trocam dados por meio de meios de transmissão e de protocolos comuns. A forma como esses dispositivos são ligados entre si é a topologia. Neste trabalho cada departamento da empresa foi organizado em **topologia estrela**, em que todos os equipamentos se ligam a um ponto central, aqui um **switch**. Nessa topologia o defeito em um cabo afeta somente o equipamento ligado a ele; em contrapartida, a falha do ponto central interrompe todo o segmento."))
    add(("p", "O switch opera na camada de enlace: aprende os endereços MAC dos equipamentos ligados a cada porta e encaminha cada quadro apenas à porta de destino, o que reduz colisões e tráfego desnecessário. A comunicação entre redes diferentes, por sua vez, depende de equipamentos da camada de rede, como o roteador."))
    add(("p", "O endereçamento utiliza o **IPv4**, com 32 bits divididos em parte de rede e parte de host por meio de uma máscara. Em uma rede Classe C a máscara padrão é /24 (255.255.255.0), e esse bloco pode ser dividido em sub-redes menores (**subnetting**) tomando bits emprestados da parte de host. Uma sub-rede com *n* bits de host oferece 2ⁿ − 2 endereços utilizáveis, pois o primeiro endereço identifica a rede e o último é o de broadcast. O bloco 192.168.10.0/24, adotado aqui, pertence à faixa de endereços privados da RFC 1918."))
    add(("p", "As **VLANs** (redes locais virtuais) dividem logicamente um switch em domínios de broadcast independentes. Em geral, cada VLAN corresponde a uma sub-rede IP própria. Quando há mais de um switch, a ligação entre eles pode ser um **trunk** (IEEE 802.1Q), que transporta o tráfego de várias VLANs por um mesmo enlace."))
    add(("p", "O **DHCP** distribui endereços IP automaticamente a partir de uma faixa configurada em um servidor, dispensando a configuração manual de cada host. Como o pedido do cliente é um broadcast, ele só chega a servidores que estejam na mesma VLAN, a menos que exista um agente de relay."))
    add(("p", "O objetivo da atividade é projetar a rede da empresa fictícia Super Tech, com os departamentos de Engenharia, Compras, TI Interno e Infraestrutura, para o ambiente do **Cisco Packet Tracer**, aplicando subnetting, VLANs, interligação de switches e endereçamento estático e dinâmico. O documento apresenta o cálculo das sub-redes, o plano de endereçamento, as configurações dos switches e o plano de verificação."))
    add(("h1", "2. Métodos"))
    add(("h2", "2.1 Ferramenta e equipamentos"))
    add(("p", "A rede foi projetada para o Cisco Packet Tracer. Cada departamento tem 20 estações (PC), 2 servidores e 2 impressoras, ou seja, 24 hosts, e cada um deles possui um switch. Ao todo são 4 switches, 80 PCs, 8 servidores e 8 impressoras (100 equipamentos)."))
    add(("p", "O enunciado cita o switch 2950-24. Como as 24 portas FastEthernet de cada switch são ocupadas pelos hosts, a interligação entre os switches exige portas adicionais. Por isso, antes de fechar o projeto, consultou-se no simulador a lista de interfaces do switch com o comando `show ip interface brief`. O **Cisco 2960-24TT** apresentou 24 portas FastEthernet (Fa0/1 a Fa0/24), duas portas GigabitEthernet (Gi0/1 e Gi0/2) e a interface Vlan1 (Figura 1), e foi adotado nos quatro departamentos. As portas Gigabit são usadas na interligação dos switches. Trata-se de modelo diferente do citado no enunciado, escolhido pela disponibilidade dessas portas."))
    add(("img", "figuras/figura-01.png", "Saída do comando show ip interface brief no switch 2960-24TT, no Cisco Packet Tracer", "Figura 1 – Interfaces do switch 2960-24TT no Cisco Packet Tracer"))
    add(("h2", "2.2 Cálculo das sub-redes"))
    add(("p", "Cada departamento tem 24 hosts e cada VLAN, 12. Com 5 bits de host (/27) há 2⁵ − 2 = 30 endereços utilizáveis, suficientes para 24 hosts. Com 4 bits (/28) há 2⁴ − 2 = 14, número que não comporta 24 hosts, mas atende aos 12 de cada VLAN."))
    add(("p", "O enunciado afirma que \"a rede seria de 227, o host de 25\". Como 227 não é valor possível para um octeto de máscara (os valores válidos são 0, 128, 192, 224, 240, 248, 252, 254 e 255), o trecho foi interpretado como /27, isto é, 5 bits de host e 2⁵ endereços por sub-rede, que é o menor bloco capaz de comportar 24 hosts. Trata-se de uma interpretação do texto, registrada como tal."))
    add(("p", "A partir do bloco 192.168.10.0/24 foram reservados quatro blocos /27, um por departamento. Como cada departamento possui duas VLANs e cada VLAN deve ter sua própria sub-rede IP, cada /27 foi dividido em dois /28 (255.255.255.240), um por VLAN. Os hosts são configurados com a máscara /28. O espaço 192.168.10.128/25 permanece livre para expansão."))
    add(("h2", "2.3 VLANs e distribuição das portas"))
    add(("p", "Em cada switch, as portas Fa0/1 a Fa0/12 formam a primeira VLAN e as portas Fa0/13 a Fa0/24 formam a segunda, cada uma com 10 estações, 1 impressora e 1 servidor (portas 1 a 10, 11 e 12 na primeira; 13 a 22, 23 e 24 na segunda)."))
    add(("p", "Como os switches serão interligados por trunk, repetir os identificadores 1 e 2 em todos os departamentos faria cada VLAN atravessar todos os switches. Os quatro departamentos passariam a compartilhar o mesmo domínio de broadcast e dois servidores DHCP responderiam ao mesmo pedido. Para evitar isso, as VLANs receberam identificadores exclusivos por departamento, mantendo a divisão 1–12 e 13–24 pedida no roteiro: Engenharia 11 e 12, Compras 21 e 22, TI Interno 31 e 32 e Infraestrutura 41 e 42. O enunciado não esclarece se \"VLAN 1\" e \"VLAN 2\" são números literais ou apenas a primeira e a segunda VLAN de cada departamento; adotou-se a segunda leitura."))
    add(("h2", "2.4 Interligação dos switches"))
    add(("p", "Os switches são ligados em cadeia (SW-ENG, SW-COMP, SW-TI, SW-INFRA) por três enlaces em trunk 802.1Q nas portas Gigabit (Tabela 3 da seção 3). O enunciado não define o desenho da interligação; a cadeia usa o menor número de enlaces e não forma laços, de modo que o spanning-tree não precisa bloquear nenhuma porta. O banco de VLANs é o mesmo nos quatro switches, com o VTP em modo transparente, e cada VLAN possui portas de acesso em um único switch."))
    add(("h2", "2.5 Endereçamento IP"))
    add(("p", "Engenharia e TI Interno usam IP estático em todos os dispositivos. O endereço de cada host segue a posição dele na VLAN: o primeiro host recebe o endereço da rede mais 1, o segundo, mais 2, e assim por diante, até o décimo segundo."))
    add(("p", "Compras e Infraestrutura usam IP dinâmico. Cada VLAN possui um servidor, e é ele que executa o serviço DHCP, com endereço estático, na própria VLAN; assim não é necessário agente de relay e cada VLAN tem exatamente um servidor DHCP. PCs e impressoras recebem endereços de um pool que começa no endereço da rede mais 1 e tem 11 endereços (10 PCs e 1 impressora), de modo que a numeração dinâmica segue a mesma sequência da numeração estática. O servidor ocupa a posição 12 e fica fora do pool."))
    add(("h2", "2.6 Configuração dos switches"))
    add(("p", "Cada switch recebe a mesma estrutura de configuração: nome do equipamento, VTP em modo transparente, criação das oito VLANs do projeto, portas Fa0/1–12 como acesso na primeira VLAN do departamento, portas Fa0/13–24 como acesso na segunda VLAN e portas Gigabit em modo trunk com as oito VLANs permitidas. Como exemplo, o trecho abaixo mostra a configuração do SW-COMP; as quatro configurações completas estão no Anexo B."))
    cfg = config(D["SW-COMP"], TODAS)
    add(("code", "\n".join(l for l in cfg.splitlines() if not l.startswith("!"))))
    add(("h2", "2.7 Verificação"))
    add(("p", "A verificação prevista tem duas partes. Nos switches, os comandos `show vlan brief`, `show interfaces trunk` e `show cdp neighbors` confirmam as VLANs e as portas, os trunks e os vizinhos. Nos hosts, o comando `ipconfig` confere o endereço de cada dispositivo e o comando `ping` testa a comunicação dentro das VLANs, entre as VLANs de um departamento e entre departamentos. O Anexo C lista os 31 testes planejados, com origem, destino, comando e comportamento esperado."))
    add(("h1", "3. Desenvolvimento"))
    add(("h2", "3.1 Organização da rede"))
    add(("p", "A rede é formada por quatro estrelas, uma por departamento, ligadas em cadeia pelos switches. Em cada departamento, 24 equipamentos se ligam ao switch por cabo direto (copper straight-through), um por porta, nas portas Fa0/1 a Fa0/24. Os switches se ligam entre si por cabo cruzado (copper cross-over) nas portas Gigabit."))
    tabela("Tabela 1 – Equipamentos por departamento", ["Departamento", "Switch", "PCs", "Impressoras", "Servidores", "Hosts"],
           [[dep["nome"], sw, "20", "2", "2", "24"] for sw, dep in D.items()] + [["Total", "4", "80", "8", "8", "96"]])
    tabela("Tabela 2 – Distribuição das portas e das VLANs em cada switch", ["Departamento", "VLAN", "Portas", "PCs", "Impressora", "Servidor"],
           [[dep["nome"], str(v["id"]), "Fa0/1–12" if i == 0 else "Fa0/13–24", "Fa0/1–10" if i == 0 else "Fa0/13–22", "Fa0/11" if i == 0 else "Fa0/23", "Fa0/12" if i == 0 else "Fa0/24"]
            for dep in D.values() for i, v in enumerate(dep["vlans"])])
    tabela("Tabela 3 – Enlaces entre os switches (trunk 802.1Q, cabo cruzado)", ["Enlace", "Switch A / porta", "Switch B / porta"],
           [[str(i), f"{a} Gi0/{pa[-1]}", f"{b} Gi0/{pb[-1]}"] for i, (a, pa, b, pb) in enumerate(LINKS, 1)])
    add(("h2", "3.2 Endereçamento estático"))
    add(("p", "Em Engenharia e TI Interno, cada dispositivo é configurado manualmente com o endereço da Tabela 5, a máscara 255.255.255.240 e sem gateway. Nos PCs a configuração é feita em *Desktop → IP Configuration*; nas impressoras e nos servidores, em *Config → FastEthernet0*."))
    add(("h2", "3.3 Endereçamento dinâmico e servidores DHCP"))
    add(("p", "Em Compras e Infraestrutura, os quatro servidores recebem endereço estático e têm o serviço DHCP ativado em *Services → DHCP*, com os pools da Tabela 4. PCs e impressoras são configurados para obter endereço automaticamente. Como cada pool tem 11 endereços e o servidor ocupa a posição 12, o servidor nunca é entregue a um cliente."))
    tabela("Tabela 4 – Servidores DHCP e pools", ["VLAN", "Servidor", "IP do servidor (estático)", "Start IP", "Máximo de usuários", "Faixa do pool"],
           [[str(v["id"]), find(sw, v["id"], "Servidor")[3], find(sw, v["id"], "Servidor")[4], v["pool"]["inicio"], str(v["pool"]["max"]),
             f"{v['pool']['inicio']} a {ip.ip_address(v['pool']['inicio']) + v['pool']['max'] - 1}"] for sw in ("SW-COMP", "SW-INFRA") for v in D[sw]["vlans"]])
    add(("h1", "4. Resultados"))
    add(("p", "Esta seção apresenta o que o projeto produz: as sub-redes calculadas, o plano de endereçamento, a configuração resultante dos switches e a verificação de consistência do projeto. Não há, neste documento, resultados de execução de testes no simulador; o Anexo C descreve como obtê-los."))
    add(("h2", "4.1 Sub-redes"))
    tabela("Tabela 5 – Sub-redes por departamento (/27)", ["Departamento", "Rede", "Máscara", "CIDR", "1º IP válido", "Último IP válido", "Broadcast"],
           [[dep["nome"], str(ip.ip_network(dep["bloco27"]).network_address), str(ip.ip_network(dep["bloco27"]).netmask), "/27",
             str(list(ip.ip_network(dep["bloco27"]).hosts())[0]), str(list(ip.ip_network(dep["bloco27"]).hosts())[-1]), str(ip.ip_network(dep["bloco27"]).broadcast_address)] for dep in D.values()])
    rows = []
    for dep in D.values():
        for i, v in enumerate(dep["vlans"]):
            n = ip.ip_network(v["rede"]); h = list(n.hosts())
            rows.append([dep["nome"], str(v["id"]), "Fa0/1–12" if i == 0 else "Fa0/13–24", str(n.network_address), str(n.netmask), "/28", str(h[0]), str(h[-1]), str(n.broadcast_address)])
    tabela("Tabela 6 – Sub-redes por VLAN (/28)", ["Departamento", "VLAN", "Portas", "Rede", "Máscara", "CIDR", "1º IP válido", "Último IP válido", "Broadcast"], rows)
    add(("p", "Cada /28 tem 14 endereços utilizáveis para 12 hosts, e cada /27 tem 30 para os 24 hosts do departamento. Dos 256 endereços do bloco 192.168.10.0/24, 128 foram usados."))
    add(("h2", "4.2 Plano de endereçamento"))
    rows = []
    for sw, dep in D.items():
        for v in dep["vlans"]:
            pcs = [h for h in H[sw] if h[1] == v["id"] and h[2] == "PC"]; imp = find(sw, v["id"], "Impressora"); srv = find(sw, v["id"], "Servidor")
            rows.append([dep["nome"], str(v["id"]), f"{pcs[0][4]} a {pcs[-1][4]}", imp[4], srv[4], "Estático" if dep["modo"] == "estático" else "PCs e impressora por DHCP; servidor estático"])
    tabela("Tabela 7 – Endereços por VLAN (o endereçamento por porta está no Anexo A)", ["Departamento", "VLAN", "PCs", "Impressora", "Servidor", "Atribuição"], rows)
    add(("h2", "4.3 Configuração resultante dos switches"))
    tabela("Tabela 8 – Resumo da configuração dos switches", ["Switch", "Fa0/1–12", "Fa0/13–24", "Trunks (VLANs permitidas)"],
           [[sw, f"acesso, VLAN {dep['vlans'][0]['id']}", f"acesso, VLAN {dep['vlans'][1]['id']}", ", ".join(f"Gi0/{u[-1]}" for u in UPLINKS[sw]) + " (11, 12, 21, 22, 31, 32, 41, 42)"] for sw, dep in D.items()])
    add(("h2", "4.4 Verificação de consistência do projeto"))
    add(("p", "Para reduzir o risco de erro nas 96 atribuições de endereço e nas quatro configurações, as tabelas e os arquivos de configuração deste trabalho foram gerados por um script a partir de um único modelo de dados. Um segundo script, independente do primeiro, lê as tabelas e as configurações geradas e confere os pontos abaixo. Todas as verificações foram satisfeitas."))
    add(("ul", ["cada departamento tem 24 portas ocupadas, com 20 PCs, 2 impressoras e 2 servidores, e cada VLAN tem 10 PCs, 1 impressora e 1 servidor;",
                "as portas 1 a 12 pertencem à primeira VLAN e as portas 13 a 24, à segunda;",
                "todos os endereços pertencem à sub-rede /28 da própria VLAN, não coincidem com endereço de rede nem de broadcast, não se repetem (96 endereços distintos) e seguem a sequência da posição na VLAN;",
                "as oito sub-redes /28 não se sobrepõem, estão dentro de 192.168.10.0/24 e as duas de cada departamento formam o /27 dele;",
                "Engenharia e TI Interno usam apenas endereços estáticos; em Compras e Infraestrutura, só os servidores são estáticos;",
                "cada pool DHCP coincide exatamente com os endereços dos clientes da VLAN e não inclui o endereço do servidor;",
                "os identificadores de VLAN são únicos nos quatro switches e cada VLAN tem portas de acesso em um único switch, de modo que não há domínio de broadcast compartilhado entre departamentos nem dois servidores DHCP na mesma VLAN;",
                "as configurações definem as oito VLANs, as portas de acesso corretas e trunks apenas nas portas Gi0/1 e Gi0/2, e os três enlaces formam uma cadeia conexa sem laços."]))
    add(("h2", "4.5 Comportamento esperado da rede"))
    add(("p", "O que se segue decorre do endereçamento e da segmentação adotados; são previsões do projeto, e não resultados medidos."))
    add(("ul", ["Dispositivos da mesma VLAN estão no mesmo domínio de broadcast e na mesma sub-rede /28, portanto devem se comunicar.",
                "Dispositivos de VLANs diferentes do mesmo departamento, ou de departamentos diferentes, estão em sub-redes distintas e o roteiro não prevê roteador; portanto não devem se comunicar. Essa ausência é consequência do enunciado, e a segmentação é o efeito desejado.",
                "Em Compras e Infraestrutura, cada cliente deve receber endereço do pool do servidor da própria VLAN, pois não há outro servidor DHCP no mesmo domínio de broadcast.",
                "Os enlaces entre switches devem aparecer como trunk e, no CDP, como vizinhos. Como cada VLAN existe em apenas um switch, esses enlaces não precisam transportar tráfego de dados entre departamentos."]))
    add(("h1", "5. Conclusão"))
    add(("p", "O trabalho resultou em um projeto completo para a rede da Super Tech: quatro departamentos, cada um com 24 hosts, switch próprio e sub-rede /27, dividida em dois /28, um para cada uma das duas VLANs. O cálculo mostrou que 24 hosts exigem 5 bits de host e que 12 hosts por VLAN cabem em 4 bits, com folga de seis e de dois endereços, respectivamente."))
    add(("p", "O projeto evidencia alguns pontos sobre o funcionamento de redes. Primeiro, VLANs distintas devem corresponder a sub-redes distintas, pois cada VLAN é um domínio de broadcast. Segundo, repetir os mesmos identificadores de VLAN em switches interligados por trunk une os domínios de broadcast e faz servidores DHCP concorrerem entre si; por isso os identificadores foram tornados exclusivos. Terceiro, o DHCP precisa de um servidor em cada VLAN, a não ser que haja relay. Quarto, switches isolam o tráfego na camada de enlace, e a comunicação entre sub-redes diferentes exige um dispositivo de camada de rede, que o roteiro não inclui."))
    add(("p", "Quanto às limitações, este documento apresenta o projeto, o endereçamento e as configurações, além da verificação do modelo de switch no simulador (Figura 1). Os resultados de execução dos testes de conectividade e de DHCP não são apresentados; o Anexo C descreve como realizá-los. As duas interpretações adotadas (o /27 e o /28 no lugar de \"227\" e \"25\" e a numeração exclusiva das VLANs) estão justificadas nas seções 2.2 e 2.3."))
    add(("h1", "Referências"))
    add(("ul", ["CISCO. Cisco Packet Tracer. Software de simulação de redes.", "IEEE. IEEE 802.1Q – Bridges and Bridged Networks.", "IETF. RFC 791 – Internet Protocol, 1981.", "IETF. RFC 1918 – Address Allocation for Private Internets, 1996.",
                "IETF. RFC 2131 – Dynamic Host Configuration Protocol, 1997.", "IETF. RFC 4632 – Classless Inter-domain Routing (CIDR), 2006."]))
    add(("pb",))
    add(("h1", "Anexo A – Endereçamento por porta"))
    add(("p", "Em Compras e Infraestrutura, os endereços de PCs e impressoras (origem DHCP) são os previstos pela sequência do pool; os servidores têm endereço estático."))
    for sw, dep in D.items():
        add(("h2", f"{dep['nome']} ({sw}) – bloco {dep['bloco27']}"))
        add(("table", ["Porta", "VLAN", "Dispositivo", "Nome", "IP/máscara", "Origem"], [[f"Fa0/{p}", str(v), pa, n, f"{a}/28", o_] for p, v, pa, n, a, o_ in H[sw]]))
    add(("pb",))
    add(("h1", "Anexo B – Configuração dos switches"))
    for sw, dep in D.items():
        add(("h2", sw)); add(("code", config(dep, TODAS).rstrip()))
    add(("pb",))
    add(("h1", "Anexo C – Plano de verificação"))
    add(("p", "Em cada teste, o `ping` é executado no Command Prompt do PC de origem. " + NOTA_DHCP))
    add(("table", ["Teste", "Origem", "IP origem", "Destino", "IP destino", "Comando", "Comportamento esperado"],
         [[t["id"], t["src"][3], ipf(t["src"]), t["dst"][3], ipf(t["dst"]), f"`ping {t['dst'][4]}`", ESP_OK if t["ok"] else ESP_NOK] for t in TESTES]))
    add(("p", "Comandos nos switches (aba CLI, após `enable`): `show vlan brief`, `show interfaces trunk` e `show cdp neighbors`."))
    return B

# ---------- renderizadores ----------
def md_table(h, rows): return "| " + " | ".join(h) + " |\n|" + "---|" * len(h) + "\n" + "\n".join("| " + " | ".join(r) + " |" for r in rows)
def to_md(B):
    o = []
    for b in B:
        k = b[0]
        if k == "cover": o.append("\n\n".join(f"**{l}**" if i in (0, 1, 6) and l else l for i, l in enumerate(b[1]) if l))
        elif k == "pb": o.append("---")
        elif k == "h1": o.append("## " + b[1])
        elif k == "h2": o.append("### " + b[1])
        elif k == "p": o.append(b[1])
        elif k == "ul": o.append("\n".join("- " + x for x in b[1]))
        elif k == "cap": o.append("**" + b[1] + "**")
        elif k == "table": o.append(md_table(b[1], b[2]))
        elif k == "code": o.append("```\n" + b[1] + "\n```")
        elif k == "img": o.append(f"![{b[2]}]({b[1]})\n\n*{b[3]}*")
    return "\n\n".join(o) + "\n"
def inline(t, small=False):
    t = html.escape(t)
    t = re.sub(r"`([^`]+)`", (r"<code style='font-size:8pt'>\1</code>" if small else r"<code>\1</code>"), t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<i>\1</i>", t)
    return t
CSS = """body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.4}
h1{font-size:16pt;margin-top:18pt} h2{font-size:13pt;margin-top:12pt}
p{text-align:justify;margin:6pt 0} table{border-collapse:collapse;margin:6pt 0;width:100%}
td,th{border:1px solid #000;padding:2pt 4pt;font-size:9pt;vertical-align:top} th{background:#d9d9d9}
pre{font-family:'DejaVu Sans Mono',monospace;font-size:8pt;border:1px solid #999;padding:4pt}
code{font-family:'DejaVu Sans Mono',monospace;font-size:10pt} .cap{text-align:center;font-weight:bold;font-size:10pt;margin-top:10pt}
.cover p{text-align:center;font-size:13pt;margin:4pt}"""
def _src(path):
    import base64
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()
def to_html(B):
    o = [f"<html><head><meta charset='utf-8'><title>Projeto da rede Super Tech</title><style>{CSS}</style></head><body>"]
    brk = False
    def st():
        nonlocal brk
        r = " style='page-break-before:always'" if brk else ""; brk = False; return r
    for b in B:
        k = b[0]
        if k == "pb": brk = True; continue
        if k == "cover":
            for i, l in enumerate(b[1]):
                txt = html.escape(l) or "&nbsp;"
                if i in (0, 1, 6) and l: txt = "<b>" + txt + "</b>"
                o.append("<p align='center'>" + txt + "</p>")
        elif k == "h1": o.append(f"<h1{st()}>{inline(b[1])}</h1>")
        elif k == "h2": o.append(f"<h2{st()}>{inline(b[1])}</h2>")
        elif k == "p": o.append(f"<p{st()}>{inline(b[1])}</p>")
        elif k == "ul": o.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in b[1]) + "</ul>")
        elif k == "cap": o.append(f"<p class='cap' align='center'>{inline(b[1])}</p>")
        elif k == "table": o.append("<table border='1' cellpadding='3' cellspacing='0'><tr>" + "".join(f"<th>{inline(c)}</th>" for c in b[1]) + "</tr>" + "".join("<tr>" + "".join(f"<td{' nowrap' if ' ' not in c and len(c) < 24 else ''}>{inline(c, True)}</td>" for c in r) + "</tr>" for r in b[2]) + "</table>")
        elif k == "code": o.append("<pre>" + html.escape(b[1]) + "</pre>")
        elif k == "img": o.append(f"<p align='center'><img src='{_src(b[1])}' alt='{html.escape(b[2])}' width='560'></p><p class='cap' align='center'>{inline(b[3])}</p>")
    o.append("</body></html>"); return "\n".join(o)

def exportar(B):
    if not shutil.which("soffice"): print("soffice ausente: DOCX/PDF não gerados"); return
    os.makedirs("entrega", exist_ok=True); tmp = "entrega/_build"; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp + "/figuras")
    shutil.copy("figuras/figura-01.png", tmp + "/figuras/figura-01.png")
    open(tmp + "/Relatorio_SuperTech.html", "w", encoding="utf-8").write(to_html(B))
    for fmt, filt in (("docx", "docx:MS Word 2007 XML"), ("pdf", "pdf:writer_pdf_Export")):
        subprocess.run(["soffice", "--headless", "--infilter=HTML (StarWriter)", "--convert-to", filt, "--outdir", "entrega", tmp + "/Relatorio_SuperTech.html"], check=True, capture_output=True, timeout=240)
    shutil.rmtree(tmp, ignore_errors=True)

if __name__ == "__main__":
    B = relatorio_blocos()
    open("02_guia_execucao_packet_tracer.md", "w").write(guia())
    open("04_relatorio.md", "w").write(to_md(B))
    if "--sem-export" not in sys.argv: exportar(B)
    print("testes:", len(TESTES))
