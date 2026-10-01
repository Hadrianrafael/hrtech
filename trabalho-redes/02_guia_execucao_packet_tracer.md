# Guia de execução no Packet Tracer (v2)

Não há Packet Tracer neste ambiente; **nada abaixo foi executado**. Registre as saídas reais.

## 0. Confirmar o modelo do switch (obrigatório, 1 minuto)
1. Arraste um switch **2950T-24** para a área de trabalho → aba *Physical* (ou *CLI*, `show ip interface brief`).
2. Deve listar `FastEthernet0/1-24` e `GigabitEthernet0/1-2`.
3. Faça o mesmo com o **2950-24**. Se ele só listar FastEthernet, ele não serve para esta topologia (24 portas de hosts + uplink); use o 2950T-24 e anote isso no relatório.
4. Se o seu modelo escolhido não tiver Gi0/1-2, **não cole** os arquivos de `configs/`: troque as interfaces `GigabitEthernet0/x` pelas que ele realmente tem (e confirme que não conflitam com as 24 portas dos hosts).

## 1. Montagem
1. 4 switches **2950T-24**: SW-ENG, SW-COMP, SW-TI, SW-INFRA.
2. Em cada um: 20 PC-PT, 2 Server-PT, 2 Printer-PT, cabo **copper straight-through**, portas conforme `tabela_enderecamento.md` (Fa0/1-10 PCs, Fa0/11 impressora, Fa0/12 servidor; Fa0/13-22 PCs, Fa0/23 impressora, Fa0/24 servidor).
3. Cabos **copper cross-over** entre switches: SW-ENG Gi0/1 – SW-COMP Gi0/1; SW-COMP Gi0/2 – SW-TI Gi0/1; SW-TI Gi0/2 – SW-INFRA Gi0/1.
4. CLI de cada switch: cole `configs/SW-xxx.txt`.
   - Se o PT rejeitar `vtp mode transparent` ou `switchport trunk allowed vlan ...`, remova só essa linha (o isolamento continua garantido pelos IDs únicos).

## 2. Engenharia e TI Interno (estático, máscara 255.255.255.240)
Para cada dispositivo, IP e máscara da tabela; gateway e DNS vazios. PCs: Desktop → IP Configuration → Static. Servidores e impressoras: Config → FastEthernet0 → Static.

## 3. Compras e Infraestrutura (DHCP)
Faça esta etapa **antes** de ligar os PCs em DHCP.
1. Servidores (Fa0/12 e Fa0/24 de cada switch): IP **estático** da tabela, máscara 255.255.255.240.
2. Em cada servidor, Services → DHCP → Service **On**; edite o pool existente (*serverPool*) com:

| Servidor | VLAN | Start IP | Máscara | Max users | Gateway/DNS |
|---|---|---|---|---|---|
| SW-COMP Fa0/12 (.44) | 21 | 192.168.10.33 | 255.255.255.240 | 11 | 0.0.0.0 |
| SW-COMP Fa0/24 (.60) | 22 | 192.168.10.49 | 255.255.255.240 | 11 | 0.0.0.0 |
| SW-INFRA Fa0/12 (.108) | 41 | 192.168.10.97 | 255.255.255.240 | 11 | 0.0.0.0 |
| SW-INFRA Fa0/24 (.124) | 42 | 192.168.10.113 | 255.255.255.240 | 11 | 0.0.0.0 |

3. PCs e impressoras desses switches: **DHCP**.
4. Por que não há conflito: cada VLAN (21, 22, 41, 42) tem exatamente 1 servidor DHCP e as VLANs só têm portas de acesso em um switch.

## 4. Verificações nos switches (cole as saídas no relatório)
- `show vlan brief`: em cada switch, as 8 VLANs existem; as portas Fa0/1-12 aparecem na 1ª VLAN do departamento e Fa0/13-24 na 2ª (VLAN 1 sem portas).
- `show interfaces trunk`: Gi em trunking, allowed 11,12,21,22,31,32,41,42.
- `show cdp neighbors`: cada switch enxerga o(s) vizinho(s) da cadeia. **É assim que se comprova a interligação** (ping entre departamentos não funciona, ver abaixo).

## 5. Testes (tabela a preencher com resultado real)
| # | Teste | Esperado |
|---|---|---|
| 1 | Em cada VLAN (8): PC → outro PC, → impressora, → servidor da mesma VLAN | Sucesso |
| 2 | Compras/Infra: `ipconfig` em todos os PCs/impressoras: IP dentro da faixa do pool da VLAN, máscara 255.255.255.240, sem repetição | Sucesso |
| 3 | Compras VLAN 21/22: nenhum PC recebe IP 192.168.10.96-127 (Infra) e vice-versa | Nenhum cruzamento (prova de não-conflito DHCP) |
| 4 | PC da 1ª VLAN → PC da 2ª VLAN do mesmo departamento | **Falha** (sub-redes distintas, sem roteador) |
| 5 | PC de um departamento → PC de outro | **Falha** (idem) |
| 6 | `show interfaces trunk` e `show cdp neighbors` | Enlaces e vizinhos corretos |
| 7 | Engenharia/TI: nenhum IP duplicado (o PT alerta se houver) | Sem alerta |

Os testes 4 e 5 são resultado correto no escopo do PDF e devem ser registrados como evidência de segmentação, não como defeito. Salve como `SuperTech.pkt`.
