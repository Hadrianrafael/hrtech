# GUIA FINAL – execução no Cisco Packet Tracer

> # ▶ PASSO 0 — CONCLUÍDO
> **Modelo definitivo dos 4 switches: Cisco 2960-24TT.** Confirmado pelo aluno no Packet Tracer com `show ip interface brief`: FastEthernet0/1 a 0/24, GigabitEthernet0/1, GigabitEthernet0/2 e Vlan1.

## PASSO 0 — verificação do switch (feito)

Registro do que foi feito: switch **2960-24TT** (categoria Switches) colocado na área de trabalho → aba **CLI** → Enter → `enable` → `show ip interface brief` → saída com Fa0/1-24, Gi0/1, Gi0/2 e Vlan1. Essa captura é a **Figura 1** do relatório.

Daqui em diante, **todos os switches são 2960-24TT**. Apague o switch de teste do PASSO 0 ou aproveite-o como SW-ENG (nesse caso, renomeie-o no PASSO 1).

---

Convenções do guia: **PC**, **Printer** e **Server** são os ícones da categoria *End Devices* (parte inferior esquerda do Packet Tracer). Máscara de **todos** os hosts: `255.255.255.240`. Gateway e DNS: deixar **vazios** em todos os dispositivos. Nenhuma etapa deste guia foi executada pelo autor do projeto: os resultados saem do **seu** Packet Tracer. Valores marcados com `*` são IPs **previstos** pelo DHCP; use sempre o valor real mostrado por `ipconfig`.

---

## PASSO 1 — adicionar equipamentos (total: 100 equipamentos = 4 switches + 80 PCs + 8 impressoras + 8 servidores)

**Neste passo você só coloca e nomeia os equipamentos. Não ligue cabos e não configure nada.** Os cabos são o PASSO 2.

### 1.1 Preparação
1. Abra o Packet Tracer com o projeto vazio (ou o do PASSO 0). Confira que está na visão **Logical** (botão no canto superior esquerdo da área de trabalho).
2. Para caber tudo na tela, aumente a janela e use o zoom: roda do mouse com **Ctrl**, ou os botões de zoom da barra lateral direita.
3. Salve já: **File → Save As →** `SuperTech.pkt`. Salve de novo ao fim de cada passo.

### 1.2 Onde estão os equipamentos (barra inferior esquerda)
- **Switch:** clique no ícone **Switches** (o segundo da fileira de categorias) → na lista ao lado, clique em **2960-24TT**.
- **PC, Impressora e Servidor:** clique no ícone **End Devices** (primeiro da fileira) → na lista ao lado, clique em **PC** (computador), **Printer** (impressora) ou **Server** (servidor).
- **Como colocar:** clique no modelo e depois clique **uma vez** na área de trabalho. **Dica:** para colocar vários seguidos, segure **Ctrl** ao clicar no modelo e clique na área de trabalho quantas vezes quiser; aperte **Esc** para parar.

### 1.3 Como nomear cada equipamento
Clique no equipamento → aba **Config** → no topo, campo **Display Name** → apague o nome padrão, digite o nome da tabela abaixo e aperte **Enter**. O nome aparece embaixo do ícone. (Nos switches, o nome do CLI é ajustado no PASSO 3; aqui ajuste só o Display Name.) Confira a grafia: o resto do guia usa estes nomes exatos, em maiúsculas.

### 1.4 Quantidades e nomes

| Departamento | Equipamento | Qtd | Modelo (categoria) | Nomes exatos |
|---|---|---|---|---|
| Engenharia | Switch | 1 | 2960-24TT (Switches) | SW-ENG |
| | PC | 20 | PC (End Devices) | PC-ENG-11-01 a PC-ENG-11-10 e PC-ENG-12-01 a PC-ENG-12-10 |
| | Impressora | 2 | Printer (End Devices) | IMP-ENG-11, IMP-ENG-12 |
| | Servidor | 2 | Server (End Devices) | SRV-ENG-11, SRV-ENG-12 |
| Compras | Switch | 1 | 2960-24TT (Switches) | SW-COMP |
| | PC | 20 | PC (End Devices) | PC-COMP-21-01 a PC-COMP-21-10 e PC-COMP-22-01 a PC-COMP-22-10 |
| | Impressora | 2 | Printer (End Devices) | IMP-COMP-21, IMP-COMP-22 |
| | Servidor | 2 | Server (End Devices) | SRV-COMP-21, SRV-COMP-22 |
| TI Interno | Switch | 1 | 2960-24TT (Switches) | SW-TI |
| | PC | 20 | PC (End Devices) | PC-TI-31-01 a PC-TI-31-10 e PC-TI-32-01 a PC-TI-32-10 |
| | Impressora | 2 | Printer (End Devices) | IMP-TI-31, IMP-TI-32 |
| | Servidor | 2 | Server (End Devices) | SRV-TI-31, SRV-TI-32 |
| Infraestrutura | Switch | 1 | 2960-24TT (Switches) | SW-INFRA |
| | PC | 20 | PC (End Devices) | PC-INFRA-41-01 a PC-INFRA-41-10 e PC-INFRA-42-01 a PC-INFRA-42-10 |
| | Impressora | 2 | Printer (End Devices) | IMP-INFRA-41, IMP-INFRA-42 |
| | Servidor | 2 | Server (End Devices) | SRV-INFRA-41, SRV-INFRA-42 |

### 1.5 Onde posicionar
Divida a área de trabalho em **4 colunas, da esquerda para a direita, na ordem da cadeia de switches**: Engenharia | Compras | TI Interno | Infraestrutura. Em cada coluna, o **switch fica no meio**; os 12 dispositivos da **1ª VLAN ficam acima** do switch e os 12 da **2ª VLAN ficam abaixo** (topologia estrela; cada grupo de 12 em 2 fileiras de 6):

```
  fileira 1 (acima):   PC-xx-v1-01 .. PC-xx-v1-06
  fileira 2 (acima):   PC-xx-v1-07 .. PC-xx-v1-10, IMP-xx-v1, SRV-xx-v1

                       [ SW-xxxx ]   <- centro da coluna

  fileira 3 (abaixo):  PC-xx-v2-01 .. PC-xx-v2-06
  fileira 4 (abaixo):  PC-xx-v2-07 .. PC-xx-v2-10, IMP-xx-v2, SRV-xx-v2
```
Mantenha a mesma ordem da esquerda para a direita em todas as fileiras (01, 02, 03…). Isso evita cruzar cabos no PASSO 2. Se a tela ficar apertada, afaste as colunas e use zoom menor; o que importa é a posição relativa, não a distância.

As VLANs de cada departamento são (1ª VLAN = portas 1-12; 2ª VLAN = portas 13-24):

| Departamento | 1ª VLAN (acima do switch) | 2ª VLAN (abaixo do switch) |
|---|---|---|
| Engenharia (SW-ENG) | 11 | 12 |
| Compras (SW-COMP) | 21 | 22 |
| TI Interno (SW-TI) | 31 | 32 |
| Infraestrutura (SW-INFRA) | 41 | 42 |

### 1.6 Checkpoint do PASSO 1 (confira antes de seguir)
- [ ] 4 switches 2960-24TT, nomeados SW-ENG, SW-COMP, SW-TI, SW-INFRA, na ordem da esquerda para a direita.
- [ ] Em cada departamento: 20 PCs, 2 impressoras e 2 servidores (24 equipamentos ao redor do switch).
- [ ] Nenhum nome repetido ou com erro de grafia (compare com a tabela 1.4).
- [ ] Nenhum cabo ligado e nenhuma configuração feita.
- [ ] Arquivo salvo.

**Envie-me ao terminar:** uma captura da área de trabalho inteira (zoom que mostre os 4 departamentos) e a confirmação de que o checkpoint está completo, com qualquer dúvida ou nome que não tenha conseguido digitar.

---

## PASSO 2 — conectar equipamentos

### 2.1 Hosts → switch (96 cabos)
Categoria **Connections** (ícone do raio) → **Copper Straight-Through** (linha preta contínua). Clique no host A, escolha a porta A; clique no switch B, escolha a porta B.


**Engenharia – SW-ENG** (Dispositivo B = SW-ENG)

| Dispositivo A | Porta A | Porta B (SW-ENG) | Cabo |
|---|---|---|---|
| PC-ENG-11-01 | FastEthernet0 | FastEthernet0/1 | Copper Straight-Through |
| PC-ENG-11-02 | FastEthernet0 | FastEthernet0/2 | Copper Straight-Through |
| PC-ENG-11-03 | FastEthernet0 | FastEthernet0/3 | Copper Straight-Through |
| PC-ENG-11-04 | FastEthernet0 | FastEthernet0/4 | Copper Straight-Through |
| PC-ENG-11-05 | FastEthernet0 | FastEthernet0/5 | Copper Straight-Through |
| PC-ENG-11-06 | FastEthernet0 | FastEthernet0/6 | Copper Straight-Through |
| PC-ENG-11-07 | FastEthernet0 | FastEthernet0/7 | Copper Straight-Through |
| PC-ENG-11-08 | FastEthernet0 | FastEthernet0/8 | Copper Straight-Through |
| PC-ENG-11-09 | FastEthernet0 | FastEthernet0/9 | Copper Straight-Through |
| PC-ENG-11-10 | FastEthernet0 | FastEthernet0/10 | Copper Straight-Through |
| IMP-ENG-11 | FastEthernet0 | FastEthernet0/11 | Copper Straight-Through |
| SRV-ENG-11 | FastEthernet0 | FastEthernet0/12 | Copper Straight-Through |
| PC-ENG-12-01 | FastEthernet0 | FastEthernet0/13 | Copper Straight-Through |
| PC-ENG-12-02 | FastEthernet0 | FastEthernet0/14 | Copper Straight-Through |
| PC-ENG-12-03 | FastEthernet0 | FastEthernet0/15 | Copper Straight-Through |
| PC-ENG-12-04 | FastEthernet0 | FastEthernet0/16 | Copper Straight-Through |
| PC-ENG-12-05 | FastEthernet0 | FastEthernet0/17 | Copper Straight-Through |
| PC-ENG-12-06 | FastEthernet0 | FastEthernet0/18 | Copper Straight-Through |
| PC-ENG-12-07 | FastEthernet0 | FastEthernet0/19 | Copper Straight-Through |
| PC-ENG-12-08 | FastEthernet0 | FastEthernet0/20 | Copper Straight-Through |
| PC-ENG-12-09 | FastEthernet0 | FastEthernet0/21 | Copper Straight-Through |
| PC-ENG-12-10 | FastEthernet0 | FastEthernet0/22 | Copper Straight-Through |
| IMP-ENG-12 | FastEthernet0 | FastEthernet0/23 | Copper Straight-Through |
| SRV-ENG-12 | FastEthernet0 | FastEthernet0/24 | Copper Straight-Through |

**Compras – SW-COMP** (Dispositivo B = SW-COMP)

| Dispositivo A | Porta A | Porta B (SW-COMP) | Cabo |
|---|---|---|---|
| PC-COMP-21-01 | FastEthernet0 | FastEthernet0/1 | Copper Straight-Through |
| PC-COMP-21-02 | FastEthernet0 | FastEthernet0/2 | Copper Straight-Through |
| PC-COMP-21-03 | FastEthernet0 | FastEthernet0/3 | Copper Straight-Through |
| PC-COMP-21-04 | FastEthernet0 | FastEthernet0/4 | Copper Straight-Through |
| PC-COMP-21-05 | FastEthernet0 | FastEthernet0/5 | Copper Straight-Through |
| PC-COMP-21-06 | FastEthernet0 | FastEthernet0/6 | Copper Straight-Through |
| PC-COMP-21-07 | FastEthernet0 | FastEthernet0/7 | Copper Straight-Through |
| PC-COMP-21-08 | FastEthernet0 | FastEthernet0/8 | Copper Straight-Through |
| PC-COMP-21-09 | FastEthernet0 | FastEthernet0/9 | Copper Straight-Through |
| PC-COMP-21-10 | FastEthernet0 | FastEthernet0/10 | Copper Straight-Through |
| IMP-COMP-21 | FastEthernet0 | FastEthernet0/11 | Copper Straight-Through |
| SRV-COMP-21 | FastEthernet0 | FastEthernet0/12 | Copper Straight-Through |
| PC-COMP-22-01 | FastEthernet0 | FastEthernet0/13 | Copper Straight-Through |
| PC-COMP-22-02 | FastEthernet0 | FastEthernet0/14 | Copper Straight-Through |
| PC-COMP-22-03 | FastEthernet0 | FastEthernet0/15 | Copper Straight-Through |
| PC-COMP-22-04 | FastEthernet0 | FastEthernet0/16 | Copper Straight-Through |
| PC-COMP-22-05 | FastEthernet0 | FastEthernet0/17 | Copper Straight-Through |
| PC-COMP-22-06 | FastEthernet0 | FastEthernet0/18 | Copper Straight-Through |
| PC-COMP-22-07 | FastEthernet0 | FastEthernet0/19 | Copper Straight-Through |
| PC-COMP-22-08 | FastEthernet0 | FastEthernet0/20 | Copper Straight-Through |
| PC-COMP-22-09 | FastEthernet0 | FastEthernet0/21 | Copper Straight-Through |
| PC-COMP-22-10 | FastEthernet0 | FastEthernet0/22 | Copper Straight-Through |
| IMP-COMP-22 | FastEthernet0 | FastEthernet0/23 | Copper Straight-Through |
| SRV-COMP-22 | FastEthernet0 | FastEthernet0/24 | Copper Straight-Through |

**TI Interno – SW-TI** (Dispositivo B = SW-TI)

| Dispositivo A | Porta A | Porta B (SW-TI) | Cabo |
|---|---|---|---|
| PC-TI-31-01 | FastEthernet0 | FastEthernet0/1 | Copper Straight-Through |
| PC-TI-31-02 | FastEthernet0 | FastEthernet0/2 | Copper Straight-Through |
| PC-TI-31-03 | FastEthernet0 | FastEthernet0/3 | Copper Straight-Through |
| PC-TI-31-04 | FastEthernet0 | FastEthernet0/4 | Copper Straight-Through |
| PC-TI-31-05 | FastEthernet0 | FastEthernet0/5 | Copper Straight-Through |
| PC-TI-31-06 | FastEthernet0 | FastEthernet0/6 | Copper Straight-Through |
| PC-TI-31-07 | FastEthernet0 | FastEthernet0/7 | Copper Straight-Through |
| PC-TI-31-08 | FastEthernet0 | FastEthernet0/8 | Copper Straight-Through |
| PC-TI-31-09 | FastEthernet0 | FastEthernet0/9 | Copper Straight-Through |
| PC-TI-31-10 | FastEthernet0 | FastEthernet0/10 | Copper Straight-Through |
| IMP-TI-31 | FastEthernet0 | FastEthernet0/11 | Copper Straight-Through |
| SRV-TI-31 | FastEthernet0 | FastEthernet0/12 | Copper Straight-Through |
| PC-TI-32-01 | FastEthernet0 | FastEthernet0/13 | Copper Straight-Through |
| PC-TI-32-02 | FastEthernet0 | FastEthernet0/14 | Copper Straight-Through |
| PC-TI-32-03 | FastEthernet0 | FastEthernet0/15 | Copper Straight-Through |
| PC-TI-32-04 | FastEthernet0 | FastEthernet0/16 | Copper Straight-Through |
| PC-TI-32-05 | FastEthernet0 | FastEthernet0/17 | Copper Straight-Through |
| PC-TI-32-06 | FastEthernet0 | FastEthernet0/18 | Copper Straight-Through |
| PC-TI-32-07 | FastEthernet0 | FastEthernet0/19 | Copper Straight-Through |
| PC-TI-32-08 | FastEthernet0 | FastEthernet0/20 | Copper Straight-Through |
| PC-TI-32-09 | FastEthernet0 | FastEthernet0/21 | Copper Straight-Through |
| PC-TI-32-10 | FastEthernet0 | FastEthernet0/22 | Copper Straight-Through |
| IMP-TI-32 | FastEthernet0 | FastEthernet0/23 | Copper Straight-Through |
| SRV-TI-32 | FastEthernet0 | FastEthernet0/24 | Copper Straight-Through |

**Infraestrutura – SW-INFRA** (Dispositivo B = SW-INFRA)

| Dispositivo A | Porta A | Porta B (SW-INFRA) | Cabo |
|---|---|---|---|
| PC-INFRA-41-01 | FastEthernet0 | FastEthernet0/1 | Copper Straight-Through |
| PC-INFRA-41-02 | FastEthernet0 | FastEthernet0/2 | Copper Straight-Through |
| PC-INFRA-41-03 | FastEthernet0 | FastEthernet0/3 | Copper Straight-Through |
| PC-INFRA-41-04 | FastEthernet0 | FastEthernet0/4 | Copper Straight-Through |
| PC-INFRA-41-05 | FastEthernet0 | FastEthernet0/5 | Copper Straight-Through |
| PC-INFRA-41-06 | FastEthernet0 | FastEthernet0/6 | Copper Straight-Through |
| PC-INFRA-41-07 | FastEthernet0 | FastEthernet0/7 | Copper Straight-Through |
| PC-INFRA-41-08 | FastEthernet0 | FastEthernet0/8 | Copper Straight-Through |
| PC-INFRA-41-09 | FastEthernet0 | FastEthernet0/9 | Copper Straight-Through |
| PC-INFRA-41-10 | FastEthernet0 | FastEthernet0/10 | Copper Straight-Through |
| IMP-INFRA-41 | FastEthernet0 | FastEthernet0/11 | Copper Straight-Through |
| SRV-INFRA-41 | FastEthernet0 | FastEthernet0/12 | Copper Straight-Through |
| PC-INFRA-42-01 | FastEthernet0 | FastEthernet0/13 | Copper Straight-Through |
| PC-INFRA-42-02 | FastEthernet0 | FastEthernet0/14 | Copper Straight-Through |
| PC-INFRA-42-03 | FastEthernet0 | FastEthernet0/15 | Copper Straight-Through |
| PC-INFRA-42-04 | FastEthernet0 | FastEthernet0/16 | Copper Straight-Through |
| PC-INFRA-42-05 | FastEthernet0 | FastEthernet0/17 | Copper Straight-Through |
| PC-INFRA-42-06 | FastEthernet0 | FastEthernet0/18 | Copper Straight-Through |
| PC-INFRA-42-07 | FastEthernet0 | FastEthernet0/19 | Copper Straight-Through |
| PC-INFRA-42-08 | FastEthernet0 | FastEthernet0/20 | Copper Straight-Through |
| PC-INFRA-42-09 | FastEthernet0 | FastEthernet0/21 | Copper Straight-Through |
| PC-INFRA-42-10 | FastEthernet0 | FastEthernet0/22 | Copper Straight-Through |
| IMP-INFRA-42 | FastEthernet0 | FastEthernet0/23 | Copper Straight-Through |
| SRV-INFRA-42 | FastEthernet0 | FastEthernet0/24 | Copper Straight-Through |

### 2.2 Switch ↔ switch (3 cabos)
Categoria **Connections** → **Copper Cross-Over** (linha preta tracejada).

| Dispositivo A | Porta A | Dispositivo B | Porta B | Cabo |
|---|---|---|---|---|
| SW-ENG | GigabitEthernet0/1 | SW-COMP | GigabitEthernet0/1 | Copper Cross-Over |
| SW-COMP | GigabitEthernet0/2 | SW-TI | GigabitEthernet0/1 | Copper Cross-Over |
| SW-TI | GigabitEthernet0/2 | SW-INFRA | GigabitEthernet0/1 | Copper Cross-Over |

Aguarde as luzes dos enlaces ficarem verdes (alguns segundos; use o botão de avanço de tempo, se necessário). Os enlaces entre switches só ficam verdes após o PASSO 3.

---

## PASSO 3 — configurar os 4 switches (CLI)

Para **cada switch**: clique no switch → aba **CLI** → Enter → cole o bloco inteiro (botão direito → Paste, ou Ctrl+V). Se faltarem linhas, cole em blocos de ~10 linhas. Os mesmos arquivos estão em `configs/`.


### SW-ENG (Engenharia)
```
! SW-ENG - Cisco 2960-24TT - Departamento Engenharia
! Modelo confirmado no PASSO 0: Fa0/1-24, Gi0/1-2 e Vlan1 (show ip interface brief)
enable
configure terminal
hostname SW-ENG
!
! VTP transparente: cada switch mantém o próprio banco de VLANs, sem anúncios
vtp mode transparent
!
! Banco de VLANs idêntico nos 4 switches (padrão corporativo; só as VLANs do
! próprio departamento têm portas de acesso neste switch)
vlan 11
 name ENG-VLAN1
vlan 12
 name ENG-VLAN2
vlan 21
 name COMP-VLAN1
vlan 22
 name COMP-VLAN2
vlan 31
 name TI-VLAN1
vlan 32
 name TI-VLAN2
vlan 41
 name INFRA-VLAN1
vlan 42
 name INFRA-VLAN2
exit
!
interface range FastEthernet0/1 - 12
 switchport mode access
 switchport access vlan 11
 no shutdown
exit
interface range FastEthernet0/13 - 24
 switchport mode access
 switchport access vlan 12
 no shutdown
exit
!
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 11,12,21,22,31,32,41,42
 no shutdown
exit
!
end
write memory
!
! Verificação: show vlan brief | show interfaces trunk | show running-config
```

### SW-COMP (Compras)
```
! SW-COMP - Cisco 2960-24TT - Departamento Compras
! Modelo confirmado no PASSO 0: Fa0/1-24, Gi0/1-2 e Vlan1 (show ip interface brief)
enable
configure terminal
hostname SW-COMP
!
! VTP transparente: cada switch mantém o próprio banco de VLANs, sem anúncios
vtp mode transparent
!
! Banco de VLANs idêntico nos 4 switches (padrão corporativo; só as VLANs do
! próprio departamento têm portas de acesso neste switch)
vlan 11
 name ENG-VLAN1
vlan 12
 name ENG-VLAN2
vlan 21
 name COMP-VLAN1
vlan 22
 name COMP-VLAN2
vlan 31
 name TI-VLAN1
vlan 32
 name TI-VLAN2
vlan 41
 name INFRA-VLAN1
vlan 42
 name INFRA-VLAN2
exit
!
interface range FastEthernet0/1 - 12
 switchport mode access
 switchport access vlan 21
 no shutdown
exit
interface range FastEthernet0/13 - 24
 switchport mode access
 switchport access vlan 22
 no shutdown
exit
!
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 11,12,21,22,31,32,41,42
 no shutdown
exit
!
interface GigabitEthernet0/2
 switchport mode trunk
 switchport trunk allowed vlan 11,12,21,22,31,32,41,42
 no shutdown
exit
!
end
write memory
!
! Verificação: show vlan brief | show interfaces trunk | show running-config
```

### SW-TI (TI Interno)
```
! SW-TI - Cisco 2960-24TT - Departamento TI Interno
! Modelo confirmado no PASSO 0: Fa0/1-24, Gi0/1-2 e Vlan1 (show ip interface brief)
enable
configure terminal
hostname SW-TI
!
! VTP transparente: cada switch mantém o próprio banco de VLANs, sem anúncios
vtp mode transparent
!
! Banco de VLANs idêntico nos 4 switches (padrão corporativo; só as VLANs do
! próprio departamento têm portas de acesso neste switch)
vlan 11
 name ENG-VLAN1
vlan 12
 name ENG-VLAN2
vlan 21
 name COMP-VLAN1
vlan 22
 name COMP-VLAN2
vlan 31
 name TI-VLAN1
vlan 32
 name TI-VLAN2
vlan 41
 name INFRA-VLAN1
vlan 42
 name INFRA-VLAN2
exit
!
interface range FastEthernet0/1 - 12
 switchport mode access
 switchport access vlan 31
 no shutdown
exit
interface range FastEthernet0/13 - 24
 switchport mode access
 switchport access vlan 32
 no shutdown
exit
!
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 11,12,21,22,31,32,41,42
 no shutdown
exit
!
interface GigabitEthernet0/2
 switchport mode trunk
 switchport trunk allowed vlan 11,12,21,22,31,32,41,42
 no shutdown
exit
!
end
write memory
!
! Verificação: show vlan brief | show interfaces trunk | show running-config
```

### SW-INFRA (Infraestrutura)
```
! SW-INFRA - Cisco 2960-24TT - Departamento Infraestrutura
! Modelo confirmado no PASSO 0: Fa0/1-24, Gi0/1-2 e Vlan1 (show ip interface brief)
enable
configure terminal
hostname SW-INFRA
!
! VTP transparente: cada switch mantém o próprio banco de VLANs, sem anúncios
vtp mode transparent
!
! Banco de VLANs idêntico nos 4 switches (padrão corporativo; só as VLANs do
! próprio departamento têm portas de acesso neste switch)
vlan 11
 name ENG-VLAN1
vlan 12
 name ENG-VLAN2
vlan 21
 name COMP-VLAN1
vlan 22
 name COMP-VLAN2
vlan 31
 name TI-VLAN1
vlan 32
 name TI-VLAN2
vlan 41
 name INFRA-VLAN1
vlan 42
 name INFRA-VLAN2
exit
!
interface range FastEthernet0/1 - 12
 switchport mode access
 switchport access vlan 41
 no shutdown
exit
interface range FastEthernet0/13 - 24
 switchport mode access
 switchport access vlan 42
 no shutdown
exit
!
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 11,12,21,22,31,32,41,42
 no shutdown
exit
!
end
write memory
!
! Verificação: show vlan brief | show interfaces trunk | show running-config
```

Se o Packet Tracer rejeitar **apenas** a linha `vtp mode transparent` ou a linha `switchport trunk allowed vlan ...`, apague essa linha e continue; o isolamento não depende delas (IDs de VLAN exclusivos). Anote qualquer linha rejeitada para me enviar.

---

## PASSO 4 — IPs estáticos

Máscara em todos: `255.255.255.240`. Gateway e DNS vazios.

- **PC:** clique no PC → aba **Desktop** → ícone **IP Configuration** → marque **Static** → preencha **IP Address** e **Subnet Mask** → feche a janela.
- **Impressora e Servidor:** clique no equipamento → aba **Config** → no menu da esquerda clique em **FastEthernet0** → em *IP Configuration* marque **Static** → preencha **IP Address** e **Subnet Mask**.


### Engenharia – todos os 24 dispositivos (estático)

| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |
|---|---|---|---|---|
| PC-ENG-11-01 | Desktop → IP Configuration | 192.168.10.1 | 255.255.255.240 | 11 |
| PC-ENG-11-02 | Desktop → IP Configuration | 192.168.10.2 | 255.255.255.240 | 11 |
| PC-ENG-11-03 | Desktop → IP Configuration | 192.168.10.3 | 255.255.255.240 | 11 |
| PC-ENG-11-04 | Desktop → IP Configuration | 192.168.10.4 | 255.255.255.240 | 11 |
| PC-ENG-11-05 | Desktop → IP Configuration | 192.168.10.5 | 255.255.255.240 | 11 |
| PC-ENG-11-06 | Desktop → IP Configuration | 192.168.10.6 | 255.255.255.240 | 11 |
| PC-ENG-11-07 | Desktop → IP Configuration | 192.168.10.7 | 255.255.255.240 | 11 |
| PC-ENG-11-08 | Desktop → IP Configuration | 192.168.10.8 | 255.255.255.240 | 11 |
| PC-ENG-11-09 | Desktop → IP Configuration | 192.168.10.9 | 255.255.255.240 | 11 |
| PC-ENG-11-10 | Desktop → IP Configuration | 192.168.10.10 | 255.255.255.240 | 11 |
| IMP-ENG-11 | Config → FastEthernet0 | 192.168.10.11 | 255.255.255.240 | 11 |
| SRV-ENG-11 | Config → FastEthernet0 | 192.168.10.12 | 255.255.255.240 | 11 |
| PC-ENG-12-01 | Desktop → IP Configuration | 192.168.10.17 | 255.255.255.240 | 12 |
| PC-ENG-12-02 | Desktop → IP Configuration | 192.168.10.18 | 255.255.255.240 | 12 |
| PC-ENG-12-03 | Desktop → IP Configuration | 192.168.10.19 | 255.255.255.240 | 12 |
| PC-ENG-12-04 | Desktop → IP Configuration | 192.168.10.20 | 255.255.255.240 | 12 |
| PC-ENG-12-05 | Desktop → IP Configuration | 192.168.10.21 | 255.255.255.240 | 12 |
| PC-ENG-12-06 | Desktop → IP Configuration | 192.168.10.22 | 255.255.255.240 | 12 |
| PC-ENG-12-07 | Desktop → IP Configuration | 192.168.10.23 | 255.255.255.240 | 12 |
| PC-ENG-12-08 | Desktop → IP Configuration | 192.168.10.24 | 255.255.255.240 | 12 |
| PC-ENG-12-09 | Desktop → IP Configuration | 192.168.10.25 | 255.255.255.240 | 12 |
| PC-ENG-12-10 | Desktop → IP Configuration | 192.168.10.26 | 255.255.255.240 | 12 |
| IMP-ENG-12 | Config → FastEthernet0 | 192.168.10.27 | 255.255.255.240 | 12 |
| SRV-ENG-12 | Config → FastEthernet0 | 192.168.10.28 | 255.255.255.240 | 12 |

### TI Interno – todos os 24 dispositivos (estático)

| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |
|---|---|---|---|---|
| PC-TI-31-01 | Desktop → IP Configuration | 192.168.10.65 | 255.255.255.240 | 31 |
| PC-TI-31-02 | Desktop → IP Configuration | 192.168.10.66 | 255.255.255.240 | 31 |
| PC-TI-31-03 | Desktop → IP Configuration | 192.168.10.67 | 255.255.255.240 | 31 |
| PC-TI-31-04 | Desktop → IP Configuration | 192.168.10.68 | 255.255.255.240 | 31 |
| PC-TI-31-05 | Desktop → IP Configuration | 192.168.10.69 | 255.255.255.240 | 31 |
| PC-TI-31-06 | Desktop → IP Configuration | 192.168.10.70 | 255.255.255.240 | 31 |
| PC-TI-31-07 | Desktop → IP Configuration | 192.168.10.71 | 255.255.255.240 | 31 |
| PC-TI-31-08 | Desktop → IP Configuration | 192.168.10.72 | 255.255.255.240 | 31 |
| PC-TI-31-09 | Desktop → IP Configuration | 192.168.10.73 | 255.255.255.240 | 31 |
| PC-TI-31-10 | Desktop → IP Configuration | 192.168.10.74 | 255.255.255.240 | 31 |
| IMP-TI-31 | Config → FastEthernet0 | 192.168.10.75 | 255.255.255.240 | 31 |
| SRV-TI-31 | Config → FastEthernet0 | 192.168.10.76 | 255.255.255.240 | 31 |
| PC-TI-32-01 | Desktop → IP Configuration | 192.168.10.81 | 255.255.255.240 | 32 |
| PC-TI-32-02 | Desktop → IP Configuration | 192.168.10.82 | 255.255.255.240 | 32 |
| PC-TI-32-03 | Desktop → IP Configuration | 192.168.10.83 | 255.255.255.240 | 32 |
| PC-TI-32-04 | Desktop → IP Configuration | 192.168.10.84 | 255.255.255.240 | 32 |
| PC-TI-32-05 | Desktop → IP Configuration | 192.168.10.85 | 255.255.255.240 | 32 |
| PC-TI-32-06 | Desktop → IP Configuration | 192.168.10.86 | 255.255.255.240 | 32 |
| PC-TI-32-07 | Desktop → IP Configuration | 192.168.10.87 | 255.255.255.240 | 32 |
| PC-TI-32-08 | Desktop → IP Configuration | 192.168.10.88 | 255.255.255.240 | 32 |
| PC-TI-32-09 | Desktop → IP Configuration | 192.168.10.89 | 255.255.255.240 | 32 |
| PC-TI-32-10 | Desktop → IP Configuration | 192.168.10.90 | 255.255.255.240 | 32 |
| IMP-TI-32 | Config → FastEthernet0 | 192.168.10.91 | 255.255.255.240 | 32 |
| SRV-TI-32 | Config → FastEthernet0 | 192.168.10.92 | 255.255.255.240 | 32 |

### Compras e Infraestrutura – somente os 2 servidores de cada departamento (4 no total; estático; são os servidores DHCP)

| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |
|---|---|---|---|---|
| SRV-COMP-21 | Config → FastEthernet0 | 192.168.10.44 | 255.255.255.240 | 21 |
| SRV-COMP-22 | Config → FastEthernet0 | 192.168.10.60 | 255.255.255.240 | 22 |
| SRV-INFRA-41 | Config → FastEthernet0 | 192.168.10.108 | 255.255.255.240 | 41 |
| SRV-INFRA-42 | Config → FastEthernet0 | 192.168.10.124 | 255.255.255.240 | 42 |

---

## PASSO 5 — serviço DHCP nos 4 servidores (Compras e Infraestrutura)

Faça **antes** do PASSO 6. Para cada servidor da tabela: clique no servidor → aba **Services** → menu da esquerda **DHCP** → **Service: On** → na lista de pools, clique no pool existente (*serverPool*) e edite os campos abaixo → clique **Save**.

| Servidor | Pool Name | Default Gateway | DNS Server | Start IP Address | Subnet Mask | Maximum Number of Users |
|---|---|---|---|---|---|---|
| SRV-COMP-21 (192.168.10.44) | POOL-21 | 0.0.0.0 | 0.0.0.0 | 192.168.10.33 | 255.255.255.240 | 11 |
| SRV-COMP-22 (192.168.10.60) | POOL-22 | 0.0.0.0 | 0.0.0.0 | 192.168.10.49 | 255.255.255.240 | 11 |
| SRV-INFRA-41 (192.168.10.108) | POOL-41 | 0.0.0.0 | 0.0.0.0 | 192.168.10.97 | 255.255.255.240 | 11 |
| SRV-INFRA-42 (192.168.10.124) | POOL-42 | 0.0.0.0 | 0.0.0.0 | 192.168.10.113 | 255.255.255.240 | 11 |

Se o campo *Pool Name* não puder ser editado, mantenha `serverPool`. Os demais campos (TFTP, WLC) ficam como estão.

---

## PASSO 6 — PCs e impressoras em DHCP (Compras e Infraestrutura)

- **PC:** clique no PC → **Desktop** → **IP Configuration** → marque **DHCP**. Aguarde aparecer `DHCP request successful` e o IP.
- **Impressora:** clique → **Config** → **FastEthernet0** → em *IP Configuration* marque **DHCP**.


**Compras – 22 dispositivos em DHCP:** PC-COMP-21-01, PC-COMP-21-02, PC-COMP-21-03, PC-COMP-21-04, PC-COMP-21-05, PC-COMP-21-06, PC-COMP-21-07, PC-COMP-21-08, PC-COMP-21-09, PC-COMP-21-10, IMP-COMP-21, PC-COMP-22-01, PC-COMP-22-02, PC-COMP-22-03, PC-COMP-22-04, PC-COMP-22-05, PC-COMP-22-06, PC-COMP-22-07, PC-COMP-22-08, PC-COMP-22-09, PC-COMP-22-10, IMP-COMP-22

**Infraestrutura – 22 dispositivos em DHCP:** PC-INFRA-41-01, PC-INFRA-41-02, PC-INFRA-41-03, PC-INFRA-41-04, PC-INFRA-41-05, PC-INFRA-41-06, PC-INFRA-41-07, PC-INFRA-41-08, PC-INFRA-41-09, PC-INFRA-41-10, IMP-INFRA-41, PC-INFRA-42-01, PC-INFRA-42-02, PC-INFRA-42-03, PC-INFRA-42-04, PC-INFRA-42-05, PC-INFRA-42-06, PC-INFRA-42-07, PC-INFRA-42-08, PC-INFRA-42-09, PC-INFRA-42-10, IMP-INFRA-42

IPs previstos (ordem em que cada um pede pode alterar a associação nome ↔ IP; o que vale é a faixa do pool):

| Dispositivo | IP previsto |
|---|---|
| PC-COMP-21-01 | 192.168.10.33 |
| PC-COMP-21-02 | 192.168.10.34 |
| PC-COMP-21-03 | 192.168.10.35 |
| PC-COMP-21-04 | 192.168.10.36 |
| PC-COMP-21-05 | 192.168.10.37 |
| PC-COMP-21-06 | 192.168.10.38 |
| PC-COMP-21-07 | 192.168.10.39 |
| PC-COMP-21-08 | 192.168.10.40 |
| PC-COMP-21-09 | 192.168.10.41 |
| PC-COMP-21-10 | 192.168.10.42 |
| IMP-COMP-21 | 192.168.10.43 |
| PC-COMP-22-01 | 192.168.10.49 |
| PC-COMP-22-02 | 192.168.10.50 |
| PC-COMP-22-03 | 192.168.10.51 |
| PC-COMP-22-04 | 192.168.10.52 |
| PC-COMP-22-05 | 192.168.10.53 |
| PC-COMP-22-06 | 192.168.10.54 |
| PC-COMP-22-07 | 192.168.10.55 |
| PC-COMP-22-08 | 192.168.10.56 |
| PC-COMP-22-09 | 192.168.10.57 |
| PC-COMP-22-10 | 192.168.10.58 |
| IMP-COMP-22 | 192.168.10.59 |
| PC-INFRA-41-01 | 192.168.10.97 |
| PC-INFRA-41-02 | 192.168.10.98 |
| PC-INFRA-41-03 | 192.168.10.99 |
| PC-INFRA-41-04 | 192.168.10.100 |
| PC-INFRA-41-05 | 192.168.10.101 |
| PC-INFRA-41-06 | 192.168.10.102 |
| PC-INFRA-41-07 | 192.168.10.103 |
| PC-INFRA-41-08 | 192.168.10.104 |
| PC-INFRA-41-09 | 192.168.10.105 |
| PC-INFRA-41-10 | 192.168.10.106 |
| IMP-INFRA-41 | 192.168.10.107 |
| PC-INFRA-42-01 | 192.168.10.113 |
| PC-INFRA-42-02 | 192.168.10.114 |
| PC-INFRA-42-03 | 192.168.10.115 |
| PC-INFRA-42-04 | 192.168.10.116 |
| PC-INFRA-42-05 | 192.168.10.117 |
| PC-INFRA-42-06 | 192.168.10.118 |
| PC-INFRA-42-07 | 192.168.10.119 |
| PC-INFRA-42-08 | 192.168.10.120 |
| PC-INFRA-42-09 | 192.168.10.121 |
| PC-INFRA-42-10 | 192.168.10.122 |
| IMP-INFRA-42 | 192.168.10.123 |

---

## PASSO 7 — comandos de verificação nos switches

Para **cada switch**: clique → **CLI** → Enter → `enable` → rode os comandos. Se aparecer `--More--`, pressione a barra de espaço.


### SW-ENG
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **11** (ENG-VLAN1) com **Fa0/1 a Fa0/12**; VLAN **12** (ENG-VLAN2) com **Fa0/13 a Fa0/24**; as outras 6 VLANs (dos demais departamentos) aparecem na lista **sem portas**; a VLAN 1 (`default`) aparece sem nenhuma das portas Fa0/1-24. **Figura 3.**
- `show interfaces trunk`: Gi0/1 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-COMP (local Gig 0/1, porta remota Gig 0/1). **Print D-01** (os dois últimos comandos; se não couberem em um print, tire dois).

### SW-COMP
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **21** (COMP-VLAN1) com **Fa0/1 a Fa0/12**; VLAN **22** (COMP-VLAN2) com **Fa0/13 a Fa0/24**; as outras 6 VLANs (dos demais departamentos) aparecem na lista **sem portas**; a VLAN 1 (`default`) aparece sem nenhuma das portas Fa0/1-24. **Figura 4.**
- `show interfaces trunk`: Gi0/1, Gi0/2 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-ENG (local Gig 0/1, porta remota Gig 0/1); SW-TI (local Gig 0/2, porta remota Gig 0/1). **Print 7** (os dois últimos comandos; se não couberem em um print, tire dois).

### SW-TI
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **31** (TI-VLAN1) com **Fa0/1 a Fa0/12**; VLAN **32** (TI-VLAN2) com **Fa0/13 a Fa0/24**; as outras 6 VLANs (dos demais departamentos) aparecem na lista **sem portas**; a VLAN 1 (`default`) aparece sem nenhuma das portas Fa0/1-24. **Figura 5.**
- `show interfaces trunk`: Gi0/1, Gi0/2 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-COMP (local Gig 0/1, porta remota Gig 0/2); SW-INFRA (local Gig 0/2, porta remota Gig 0/1). **Print 8** (os dois últimos comandos; se não couberem em um print, tire dois).

### SW-INFRA
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **41** (INFRA-VLAN1) com **Fa0/1 a Fa0/12**; VLAN **42** (INFRA-VLAN2) com **Fa0/13 a Fa0/24**; as outras 6 VLANs (dos demais departamentos) aparecem na lista **sem portas**; a VLAN 1 (`default`) aparece sem nenhuma das portas Fa0/1-24. **Figura 6.**
- `show interfaces trunk`: Gi0/1 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-TI (local Gig 0/1, porta remota Gig 0/2). **Print D-02** (os dois últimos comandos; se não couberem em um print, tire dois).

---

## PASSO 8 — testes

Em cada teste: clique no PC de origem → aba **Desktop** → **Command Prompt** → digite o comando exato → Enter. Os pings do mesmo grupo (mesmo rótulo de captura) devem aparecer **na mesma tela** (rode em sequência, sem limpar). Antes de começar, em cada PC DHCP rode `ipconfig` e confirme o IP de origem.

| Teste | Computador de origem | IP origem | Destino | IP destino | Comando | Resultado esperado | Print |
|---|---|---|---|---|---|---|---|
| T01 | PC-ENG-11-01 | 192.168.10.1 | PC-ENG-11-02 | 192.168.10.2 | `ping 192.168.10.2` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 15 |
| T02 | PC-ENG-11-01 | 192.168.10.1 | IMP-ENG-11 | 192.168.10.11 | `ping 192.168.10.11` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 15 |
| T03 | PC-ENG-11-01 | 192.168.10.1 | SRV-ENG-11 | 192.168.10.12 | `ping 192.168.10.12` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 15 |
| T04 | PC-ENG-12-01 | 192.168.10.17 | PC-ENG-12-02 | 192.168.10.18 | `ping 192.168.10.18` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-15 |
| T05 | PC-ENG-12-01 | 192.168.10.17 | IMP-ENG-12 | 192.168.10.27 | `ping 192.168.10.27` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-15 |
| T06 | PC-ENG-12-01 | 192.168.10.17 | SRV-ENG-12 | 192.168.10.28 | `ping 192.168.10.28` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-15 |
| T07 | PC-COMP-21-01 | 192.168.10.33* | PC-COMP-21-02 | 192.168.10.34* | `ping 192.168.10.34` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 16 |
| T08 | PC-COMP-21-01 | 192.168.10.33* | IMP-COMP-21 | 192.168.10.43* | `ping 192.168.10.43` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 16 |
| T09 | PC-COMP-21-01 | 192.168.10.33* | SRV-COMP-21 | 192.168.10.44 | `ping 192.168.10.44` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 16 |
| T10 | PC-COMP-22-01 | 192.168.10.49* | PC-COMP-22-02 | 192.168.10.50* | `ping 192.168.10.50` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-16 |
| T11 | PC-COMP-22-01 | 192.168.10.49* | IMP-COMP-22 | 192.168.10.59* | `ping 192.168.10.59` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-16 |
| T12 | PC-COMP-22-01 | 192.168.10.49* | SRV-COMP-22 | 192.168.10.60 | `ping 192.168.10.60` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-16 |
| T13 | PC-TI-31-01 | 192.168.10.65 | PC-TI-31-02 | 192.168.10.66 | `ping 192.168.10.66` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 17 |
| T14 | PC-TI-31-01 | 192.168.10.65 | IMP-TI-31 | 192.168.10.75 | `ping 192.168.10.75` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 17 |
| T15 | PC-TI-31-01 | 192.168.10.65 | SRV-TI-31 | 192.168.10.76 | `ping 192.168.10.76` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 17 |
| T16 | PC-TI-32-01 | 192.168.10.81 | PC-TI-32-02 | 192.168.10.82 | `ping 192.168.10.82` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-17 |
| T17 | PC-TI-32-01 | 192.168.10.81 | IMP-TI-32 | 192.168.10.91 | `ping 192.168.10.91` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-17 |
| T18 | PC-TI-32-01 | 192.168.10.81 | SRV-TI-32 | 192.168.10.92 | `ping 192.168.10.92` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-17 |
| T19 | PC-INFRA-41-01 | 192.168.10.97* | PC-INFRA-41-02 | 192.168.10.98* | `ping 192.168.10.98` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 18 |
| T20 | PC-INFRA-41-01 | 192.168.10.97* | IMP-INFRA-41 | 192.168.10.107* | `ping 192.168.10.107` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 18 |
| T21 | PC-INFRA-41-01 | 192.168.10.97* | SRV-INFRA-41 | 192.168.10.108 | `ping 192.168.10.108` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | Figura 18 |
| T22 | PC-INFRA-42-01 | 192.168.10.113* | PC-INFRA-42-02 | 192.168.10.114* | `ping 192.168.10.114` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-18 |
| T23 | PC-INFRA-42-01 | 192.168.10.113* | IMP-INFRA-42 | 192.168.10.123* | `ping 192.168.10.123` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-18 |
| T24 | PC-INFRA-42-01 | 192.168.10.113* | SRV-INFRA-42 | 192.168.10.124 | `ping 192.168.10.124` | Sucesso: `Reply from ...` (a 1ª tentativa pode dar `Request timed out` por causa do ARP; vale o conjunto: ao menos 3 de 4 respostas) | D-18 |
| T25 | PC-ENG-11-01 | 192.168.10.1 | SRV-ENG-12 | 192.168.10.28 | `ping 192.168.10.28` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | Figura 19 |
| T26 | PC-COMP-21-01 | 192.168.10.33* | SRV-COMP-22 | 192.168.10.60 | `ping 192.168.10.60` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | D-19 |
| T27 | PC-TI-31-01 | 192.168.10.65 | SRV-TI-32 | 192.168.10.92 | `ping 192.168.10.92` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | D-20 |
| T28 | PC-INFRA-41-01 | 192.168.10.97* | SRV-INFRA-42 | 192.168.10.124 | `ping 192.168.10.124` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | D-21 |
| T29 | PC-ENG-11-01 | 192.168.10.1 | SRV-COMP-21 | 192.168.10.44 | `ping 192.168.10.44` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | Figura 20 |
| T30 | PC-COMP-21-01 | 192.168.10.33* | SRV-TI-31 | 192.168.10.76 | `ping 192.168.10.76` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | D-22 |
| T31 | PC-TI-31-01 | 192.168.10.65 | SRV-INFRA-41 | 192.168.10.108 | `ping 192.168.10.108` | Falha: `Request timed out` ou `Destination host unreachable`, 100% de perda (sub-redes diferentes e sem roteador) | D-23 |

Observação: `*` = IP previsto de dispositivo DHCP: **troque pelo IP real** (`ipconfig` no PC; tela *Config → FastEthernet0* da impressora) antes de digitar o `ping`. Os testes de **falha** são o resultado tecnicamente correto neste projeto (sub-redes distintas, sem roteador) e provam a segmentação; **não** são defeito.

---

## PASSO 9 — salvar
Menu **File → Save As** → nome `SuperTech.pkt`. Salve de novo ao final de todos os testes.

---

## CHECKLIST DE PRINTS PARA O TRABALHO

Capture cada tela (Windows: Win+Shift+S) e salve como `figura-NN.png` ou `D-NN.png`. Nada abaixo foi capturado ainda. Total: **43 capturas**, das quais **20 entram no relatório** e 23 servem só para validação.

### A) OBRIGATÓRIOS PARA O RELATÓRIO (20 figuras)

Cada um vira a **Figura de mesmo número** em `04_relatorio.md`. As demais saídas entram no relatório como **texto** (tabelas), não como imagem.

| Figura | O que capturar | Feito |
|---|---|---|
| 1 | CLI do switch escolhido: `show ip interface brief` | [x] já capturada (`figuras/figura-01.png`) |
| 2 | Topologia completa (workspace inteiro, zoom que mostre os 4 departamentos e os 3 enlaces entre switches) | [ ] |
| 3 | CLI de SW-ENG: `show vlan brief` | [ ] |
| 4 | CLI de SW-COMP: `show vlan brief` | [ ] |
| 5 | CLI de SW-TI: `show vlan brief` | [ ] |
| 6 | CLI de SW-INFRA: `show vlan brief` | [ ] |
| 7 | CLI de SW-COMP: `show interfaces trunk` e `show cdp neighbors` | [ ] |
| 8 | CLI de SW-TI: `show interfaces trunk` e `show cdp neighbors` | [ ] |
| 9 | Tela de IP estático de PC-ENG-11-01 | [ ] |
| 10 | Tela de IP estático de PC-TI-31-01 | [ ] |
| 11 | Aba Services → DHCP de SRV-COMP-21 | [ ] |
| 12 | Aba Services → DHCP de SRV-INFRA-41 | [ ] |
| 13 | Command Prompt de PC-COMP-21-01: `ipconfig` | [ ] |
| 14 | Command Prompt de PC-INFRA-41-01: `ipconfig` | [ ] |
| 15 | Command Prompt de PC-ENG-11-01: pings dos testes T01, T02, T03 (tudo na mesma tela) | [ ] |
| 16 | Command Prompt de PC-COMP-21-01: pings dos testes T07, T08, T09 (tudo na mesma tela) | [ ] |
| 17 | Command Prompt de PC-TI-31-01: pings dos testes T13, T14, T15 (tudo na mesma tela) | [ ] |
| 18 | Command Prompt de PC-INFRA-41-01: pings dos testes T19, T20, T21 (tudo na mesma tela) | [ ] |
| 19 | Command Prompt de PC-ENG-11-01: pings dos testes T25 (tudo na mesma tela) | [ ] |
| 20 | Command Prompt de PC-ENG-11-01: pings dos testes T29 (tudo na mesma tela) | [ ] |

### B) APENAS PARA VALIDAÇÃO/DIAGNÓSTICO (23 capturas)

**Não** vão para o relatório. Capture se puder (servem de prova pessoal e de diagnóstico se algo falhar); o **texto** dos pings e dos IPs correspondentes entra nas tabelas do relatório.

| Rótulo | O que capturar | Feito |
|---|---|---|
| D-01 | CLI de SW-ENG: `show interfaces trunk` e `show cdp neighbors` | [ ] |
| D-02 | CLI de SW-INFRA: `show interfaces trunk` e `show cdp neighbors` | [ ] |
| D-03 | Tela de IP estático de IMP-ENG-11 | [ ] |
| D-04 | Tela de IP estático de SRV-ENG-11 | [ ] |
| D-05 | Tela de IP estático de IMP-TI-31 | [ ] |
| D-06 | Tela de IP estático de SRV-TI-31 | [ ] |
| D-07 | Tela de IP estático de SRV-COMP-21 | [ ] |
| D-08 | Tela de IP estático de SRV-INFRA-41 | [ ] |
| D-09 | Aba Services → DHCP de SRV-COMP-22 | [ ] |
| D-10 | Aba Services → DHCP de SRV-INFRA-42 | [ ] |
| D-11 | Command Prompt de PC-COMP-22-01: `ipconfig` | [ ] |
| D-12 | Command Prompt de PC-INFRA-42-01: `ipconfig` | [ ] |
| D-13 | Config → FastEthernet0 de IMP-COMP-21 (DHCP) | [ ] |
| D-14 | Config → FastEthernet0 de IMP-INFRA-41 (DHCP) | [ ] |
| D-15 | Command Prompt de PC-ENG-12-01: pings dos testes T04, T05, T06 (tudo na mesma tela) | [ ] |
| D-16 | Command Prompt de PC-COMP-22-01: pings dos testes T10, T11, T12 (tudo na mesma tela) | [ ] |
| D-17 | Command Prompt de PC-TI-32-01: pings dos testes T16, T17, T18 (tudo na mesma tela) | [ ] |
| D-18 | Command Prompt de PC-INFRA-42-01: pings dos testes T22, T23, T24 (tudo na mesma tela) | [ ] |
| D-19 | Command Prompt de PC-COMP-21-01: pings dos testes T26 (tudo na mesma tela) | [ ] |
| D-20 | Command Prompt de PC-TI-31-01: pings dos testes T27 (tudo na mesma tela) | [ ] |
| D-21 | Command Prompt de PC-INFRA-41-01: pings dos testes T28 (tudo na mesma tela) | [ ] |
| D-22 | Command Prompt de PC-COMP-21-01: pings dos testes T30 (tudo na mesma tela) | [ ] |
| D-23 | Command Prompt de PC-TI-31-01: pings dos testes T31 (tudo na mesma tela) | [ ] |

---

## O QUE ME ENVIAR DEPOIS

1. **Texto copiado** (não só imagem) das saídas: `show ip interface brief` (PASSO 0), os `show` dos 4 switches e os pings dos 31 testes (assim eu monto as tabelas de resultado sem erro de leitura).
2. As figuras obrigatórias numeradas, ou ao menos a confirmação de quais foram tiradas.
3. O modelo de switch que você de fato usou.
4. Qualquer linha de configuração rejeitada, qualquer teste que **não** deu o resultado esperado (copie a saída) e os IPs reais recebidos por DHCP.
5. O `SuperTech.pkt` (entrega sua, ao professor).
