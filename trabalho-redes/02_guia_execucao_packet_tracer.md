# Guia de montagem e verificação no Cisco Packet Tracer

Este guia descreve, em ordem, como montar e configurar a rede da Super Tech no Cisco Packet Tracer e como verificá-la. É um procedimento de reprodução: não contém resultados de execução. Todos os valores vêm de `tabela_enderecamento.md` e de `configs/`.

Convenções: **PC**, **Printer** e **Server** são ícones da categoria *End Devices* (parte inferior esquerda do programa). Máscara de todos os hosts: `255.255.255.240`. Gateway e DNS: vazios em todos os dispositivos. Valores com `*` são endereços previstos para dispositivos em DHCP; vale o endereço efetivamente recebido.

---

## PASSO 0 — modelo do switch (concluído)

O modelo definitivo dos quatro switches é o **Cisco 2960-24TT**. Verificação feita no Packet Tracer: categoria *Switches* → **2960-24TT** → aba **CLI** → Enter → `enable` → `show ip interface brief`. A saída lista FastEthernet0/1 a 0/24, GigabitEthernet0/1, GigabitEthernet0/2 e Vlan1 (Figura 1 do relatório). Se houver outro modelo de switch na área de trabalho, apague-o.

---

## PASSO 1 — adicionar e nomear os equipamentos (100 no total)

Neste passo apenas se colocam e nomeiam os equipamentos: 4 switches, 80 PCs, 8 impressoras e 8 servidores. Cabos e configurações ficam para os passos seguintes.

### 1.1 Preparação
1. Abra o Packet Tracer na visão **Logical** (botão no canto superior esquerdo da área de trabalho).
2. Ajuste o zoom com **Ctrl + roda do mouse**.
3. Salve: **File → Save As →** `SuperTech.pkt`. Salve novamente ao fim de cada passo.

### 1.2 Onde estão os equipamentos (barra inferior esquerda)
- **Switch:** categoria **Switches** → **2960-24TT**.
- **PC, impressora e servidor:** categoria **End Devices** → **PC**, **Printer** ou **Server**.
- **Como colocar:** clique no modelo e depois uma vez na área de trabalho. Para colocar vários seguidos, segure **Ctrl** ao clicar no modelo e clique na área de trabalho; **Esc** encerra.

### 1.3 Como nomear
Clique no equipamento → aba **Config** → campo **Display Name** → digite o nome → **Enter**. Nos switches, o nome do CLI (hostname) é definido no PASSO 3; aqui ajusta-se só o Display Name. Os nomes abaixo são usados em todo o guia.

### 1.4 Quantidades e nomes

| Departamento | Equipamento | Qtd | Modelo (categoria) | Nomes |
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

### 1.5 Posicionamento
Quatro colunas, da esquerda para a direita, na ordem da cadeia de switches: Engenharia, Compras, TI Interno, Infraestrutura. Em cada coluna o switch fica no centro; os 12 dispositivos da 1ª VLAN ficam acima e os 12 da 2ª VLAN ficam abaixo, em duas fileiras de 6 (topologia estrela):

```
  fileira 1 (acima):   PC-xx-v1-01 .. PC-xx-v1-06
  fileira 2 (acima):   PC-xx-v1-07 .. PC-xx-v1-10, IMP-xx-v1, SRV-xx-v1

                       [ SW-xxxx ]

  fileira 3 (abaixo):  PC-xx-v2-01 .. PC-xx-v2-06
  fileira 4 (abaixo):  PC-xx-v2-07 .. PC-xx-v2-10, IMP-xx-v2, SRV-xx-v2
```
Manter a mesma ordem da esquerda para a direita em todas as fileiras evita cruzamento de cabos no PASSO 2.

| Departamento | 1ª VLAN (acima do switch) | 2ª VLAN (abaixo do switch) |
|---|---|---|
| Engenharia (SW-ENG) | 11 | 12 |
| Compras (SW-COMP) | 21 | 22 |
| TI Interno (SW-TI) | 31 | 32 |
| Infraestrutura (SW-INFRA) | 41 | 42 |

### 1.6 Conferência do PASSO 1
- 4 switches 2960-24TT nomeados SW-ENG, SW-COMP, SW-TI e SW-INFRA, nessa ordem.
- Em cada departamento: 20 PCs, 2 impressoras e 2 servidores.
- Nomes sem repetição e sem erro de grafia.
- Nenhum cabo ligado e nenhuma configuração feita.

---

## PASSO 2 — conectar os equipamentos

### 2.1 Hosts → switch (96 cabos)
Categoria **Connections** (ícone do raio) → **Copper Straight-Through** (linha contínua). Clique no host (Dispositivo A), escolha a porta A; clique no switch (Dispositivo B), escolha a porta B.


**Engenharia – SW-ENG**

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

**Compras – SW-COMP**

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

**TI Interno – SW-TI**

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

**Infraestrutura – SW-INFRA**

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
Categoria **Connections** → **Copper Cross-Over** (linha tracejada).

| Dispositivo A | Porta A | Dispositivo B | Porta B | Cabo |
|---|---|---|---|---|
| SW-ENG | GigabitEthernet0/1 | SW-COMP | GigabitEthernet0/1 | Copper Cross-Over |
| SW-COMP | GigabitEthernet0/2 | SW-TI | GigabitEthernet0/1 | Copper Cross-Over |
| SW-TI | GigabitEthernet0/2 | SW-INFRA | GigabitEthernet0/1 | Copper Cross-Over |

Os enlaces entre switches só ficam ativos depois do PASSO 3.

---

## PASSO 3 — configurar os 4 switches (CLI)

Para cada switch: clique no switch → aba **CLI** → Enter → cole o bloco inteiro. Se faltarem linhas, cole em blocos de cerca de 10 linhas. Os mesmos textos estão em `configs/`.


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

Se o Packet Tracer rejeitar apenas a linha `vtp mode transparent` ou a linha `switchport trunk allowed vlan ...`, remover essa linha e prosseguir: o isolamento entre departamentos não depende delas, pois os identificadores de VLAN são exclusivos.

---

## PASSO 4 — IPs estáticos

Máscara `255.255.255.240`; gateway e DNS vazios.

- **PC:** clique no PC → aba **Desktop** → **IP Configuration** → **Static** → preencher **IP Address** e **Subnet Mask**.
- **Impressora e servidor:** clique no equipamento → aba **Config** → **FastEthernet0** (menu lateral) → em *IP Configuration* marcar **Static** → preencher **IP Address** e **Subnet Mask**.


### Engenharia – 24 dispositivos (estático)

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

### TI Interno – 24 dispositivos (estático)

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

### Compras e Infraestrutura – servidores (estático; são os servidores DHCP)

| Dispositivo | Onde configurar | IP Address | Subnet Mask | VLAN |
|---|---|---|---|---|
| SRV-COMP-21 | Config → FastEthernet0 | 192.168.10.44 | 255.255.255.240 | 21 |
| SRV-COMP-22 | Config → FastEthernet0 | 192.168.10.60 | 255.255.255.240 | 22 |
| SRV-INFRA-41 | Config → FastEthernet0 | 192.168.10.108 | 255.255.255.240 | 41 |
| SRV-INFRA-42 | Config → FastEthernet0 | 192.168.10.124 | 255.255.255.240 | 42 |

---

## PASSO 5 — serviço DHCP nos servidores de Compras e Infraestrutura

Antes do PASSO 6. Em cada servidor: aba **Services** → **DHCP** → **Service: On** → editar o pool existente (*serverPool*) com os valores abaixo → **Save**.

| Servidor | Pool Name | Default Gateway | DNS Server | Start IP Address | Subnet Mask | Maximum Number of Users |
|---|---|---|---|---|---|---|
| SRV-COMP-21 (192.168.10.44) | POOL-21 | 0.0.0.0 | 0.0.0.0 | 192.168.10.33 | 255.255.255.240 | 11 |
| SRV-COMP-22 (192.168.10.60) | POOL-22 | 0.0.0.0 | 0.0.0.0 | 192.168.10.49 | 255.255.255.240 | 11 |
| SRV-INFRA-41 (192.168.10.108) | POOL-41 | 0.0.0.0 | 0.0.0.0 | 192.168.10.97 | 255.255.255.240 | 11 |
| SRV-INFRA-42 (192.168.10.124) | POOL-42 | 0.0.0.0 | 0.0.0.0 | 192.168.10.113 | 255.255.255.240 | 11 |

Se o nome do pool não puder ser editado, manter `serverPool`.

---

## PASSO 6 — PCs e impressoras em DHCP (Compras e Infraestrutura)

- **PC:** **Desktop** → **IP Configuration** → **DHCP**.
- **Impressora:** **Config** → **FastEthernet0** → *IP Configuration* → **DHCP**.

**Compras – 22 dispositivos em DHCP:** PC-COMP-21-01, PC-COMP-21-02, PC-COMP-21-03, PC-COMP-21-04, PC-COMP-21-05, PC-COMP-21-06, PC-COMP-21-07, PC-COMP-21-08, PC-COMP-21-09, PC-COMP-21-10, IMP-COMP-21, PC-COMP-22-01, PC-COMP-22-02, PC-COMP-22-03, PC-COMP-22-04, PC-COMP-22-05, PC-COMP-22-06, PC-COMP-22-07, PC-COMP-22-08, PC-COMP-22-09, PC-COMP-22-10, IMP-COMP-22

**Infraestrutura – 22 dispositivos em DHCP:** PC-INFRA-41-01, PC-INFRA-41-02, PC-INFRA-41-03, PC-INFRA-41-04, PC-INFRA-41-05, PC-INFRA-41-06, PC-INFRA-41-07, PC-INFRA-41-08, PC-INFRA-41-09, PC-INFRA-41-10, IMP-INFRA-41, PC-INFRA-42-01, PC-INFRA-42-02, PC-INFRA-42-03, PC-INFRA-42-04, PC-INFRA-42-05, PC-INFRA-42-06, PC-INFRA-42-07, PC-INFRA-42-08, PC-INFRA-42-09, PC-INFRA-42-10, IMP-INFRA-42

Endereços previstos (a associação nome ↔ endereço depende da ordem dos pedidos; o que vale é a faixa do pool):

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

## PASSO 7 — verificação nos switches

Em cada switch: aba **CLI** → Enter → `enable` → comandos abaixo. Se aparecer `--More--`, usar a barra de espaço.


### SW-ENG
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **11** (ENG-VLAN1) com Fa0/1 a Fa0/12; VLAN **12** (ENG-VLAN2) com Fa0/13 a Fa0/24; as outras 6 VLANs aparecem sem portas; a VLAN 1 (`default`) aparece sem as portas Fa0/1-24.
- `show interfaces trunk`: Gi0/1 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-COMP (local Gig 0/1, porta remota Gig 0/1).

### SW-COMP
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **21** (COMP-VLAN1) com Fa0/1 a Fa0/12; VLAN **22** (COMP-VLAN2) com Fa0/13 a Fa0/24; as outras 6 VLANs aparecem sem portas; a VLAN 1 (`default`) aparece sem as portas Fa0/1-24.
- `show interfaces trunk`: Gi0/1, Gi0/2 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-ENG (local Gig 0/1, porta remota Gig 0/1); SW-TI (local Gig 0/2, porta remota Gig 0/1).

### SW-TI
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **31** (TI-VLAN1) com Fa0/1 a Fa0/12; VLAN **32** (TI-VLAN2) com Fa0/13 a Fa0/24; as outras 6 VLANs aparecem sem portas; a VLAN 1 (`default`) aparece sem as portas Fa0/1-24.
- `show interfaces trunk`: Gi0/1, Gi0/2 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-COMP (local Gig 0/1, porta remota Gig 0/2); SW-INFRA (local Gig 0/2, porta remota Gig 0/1).

### SW-INFRA
```
enable
show vlan brief
show interfaces trunk
show cdp neighbors
```
- `show vlan brief`: VLAN **41** (INFRA-VLAN1) com Fa0/1 a Fa0/12; VLAN **42** (INFRA-VLAN2) com Fa0/13 a Fa0/24; as outras 6 VLANs aparecem sem portas; a VLAN 1 (`default`) aparece sem as portas Fa0/1-24.
- `show interfaces trunk`: Gi0/1 em modo `on`, encapsulamento `802.1q`, status `trunking`, VLANs permitidas `11-12,21-22,31-32,41-42`.
- `show cdp neighbors`: SW-TI (local Gig 0/1, porta remota Gig 0/2).

---

## PASSO 8 — testes de conectividade

Em cada teste: clique no PC de origem → aba **Desktop** → **Command Prompt** → digitar o comando → Enter. Antes de começar, nos PCs em DHCP, rodar `ipconfig` e confirmar o endereço de origem.

| Teste | Origem | IP origem | Destino | IP destino | Comando | Comportamento esperado |
|---|---|---|---|---|---|---|
| T01 | PC-ENG-11-01 | 192.168.10.1 | PC-ENG-11-02 | 192.168.10.2 | `ping 192.168.10.2` | Respostas do destino (comunicação na mesma VLAN) |
| T02 | PC-ENG-11-01 | 192.168.10.1 | IMP-ENG-11 | 192.168.10.11 | `ping 192.168.10.11` | Respostas do destino (comunicação na mesma VLAN) |
| T03 | PC-ENG-11-01 | 192.168.10.1 | SRV-ENG-11 | 192.168.10.12 | `ping 192.168.10.12` | Respostas do destino (comunicação na mesma VLAN) |
| T04 | PC-ENG-12-01 | 192.168.10.17 | PC-ENG-12-02 | 192.168.10.18 | `ping 192.168.10.18` | Respostas do destino (comunicação na mesma VLAN) |
| T05 | PC-ENG-12-01 | 192.168.10.17 | IMP-ENG-12 | 192.168.10.27 | `ping 192.168.10.27` | Respostas do destino (comunicação na mesma VLAN) |
| T06 | PC-ENG-12-01 | 192.168.10.17 | SRV-ENG-12 | 192.168.10.28 | `ping 192.168.10.28` | Respostas do destino (comunicação na mesma VLAN) |
| T07 | PC-COMP-21-01 | 192.168.10.33* | PC-COMP-21-02 | 192.168.10.34* | `ping 192.168.10.34` | Respostas do destino (comunicação na mesma VLAN) |
| T08 | PC-COMP-21-01 | 192.168.10.33* | IMP-COMP-21 | 192.168.10.43* | `ping 192.168.10.43` | Respostas do destino (comunicação na mesma VLAN) |
| T09 | PC-COMP-21-01 | 192.168.10.33* | SRV-COMP-21 | 192.168.10.44 | `ping 192.168.10.44` | Respostas do destino (comunicação na mesma VLAN) |
| T10 | PC-COMP-22-01 | 192.168.10.49* | PC-COMP-22-02 | 192.168.10.50* | `ping 192.168.10.50` | Respostas do destino (comunicação na mesma VLAN) |
| T11 | PC-COMP-22-01 | 192.168.10.49* | IMP-COMP-22 | 192.168.10.59* | `ping 192.168.10.59` | Respostas do destino (comunicação na mesma VLAN) |
| T12 | PC-COMP-22-01 | 192.168.10.49* | SRV-COMP-22 | 192.168.10.60 | `ping 192.168.10.60` | Respostas do destino (comunicação na mesma VLAN) |
| T13 | PC-TI-31-01 | 192.168.10.65 | PC-TI-31-02 | 192.168.10.66 | `ping 192.168.10.66` | Respostas do destino (comunicação na mesma VLAN) |
| T14 | PC-TI-31-01 | 192.168.10.65 | IMP-TI-31 | 192.168.10.75 | `ping 192.168.10.75` | Respostas do destino (comunicação na mesma VLAN) |
| T15 | PC-TI-31-01 | 192.168.10.65 | SRV-TI-31 | 192.168.10.76 | `ping 192.168.10.76` | Respostas do destino (comunicação na mesma VLAN) |
| T16 | PC-TI-32-01 | 192.168.10.81 | PC-TI-32-02 | 192.168.10.82 | `ping 192.168.10.82` | Respostas do destino (comunicação na mesma VLAN) |
| T17 | PC-TI-32-01 | 192.168.10.81 | IMP-TI-32 | 192.168.10.91 | `ping 192.168.10.91` | Respostas do destino (comunicação na mesma VLAN) |
| T18 | PC-TI-32-01 | 192.168.10.81 | SRV-TI-32 | 192.168.10.92 | `ping 192.168.10.92` | Respostas do destino (comunicação na mesma VLAN) |
| T19 | PC-INFRA-41-01 | 192.168.10.97* | PC-INFRA-41-02 | 192.168.10.98* | `ping 192.168.10.98` | Respostas do destino (comunicação na mesma VLAN) |
| T20 | PC-INFRA-41-01 | 192.168.10.97* | IMP-INFRA-41 | 192.168.10.107* | `ping 192.168.10.107` | Respostas do destino (comunicação na mesma VLAN) |
| T21 | PC-INFRA-41-01 | 192.168.10.97* | SRV-INFRA-41 | 192.168.10.108 | `ping 192.168.10.108` | Respostas do destino (comunicação na mesma VLAN) |
| T22 | PC-INFRA-42-01 | 192.168.10.113* | PC-INFRA-42-02 | 192.168.10.114* | `ping 192.168.10.114` | Respostas do destino (comunicação na mesma VLAN) |
| T23 | PC-INFRA-42-01 | 192.168.10.113* | IMP-INFRA-42 | 192.168.10.123* | `ping 192.168.10.123` | Respostas do destino (comunicação na mesma VLAN) |
| T24 | PC-INFRA-42-01 | 192.168.10.113* | SRV-INFRA-42 | 192.168.10.124 | `ping 192.168.10.124` | Respostas do destino (comunicação na mesma VLAN) |
| T25 | PC-ENG-11-01 | 192.168.10.1 | SRV-ENG-12 | 192.168.10.28 | `ping 192.168.10.28` | Sem resposta (sub-redes diferentes, sem roteador) |
| T26 | PC-COMP-21-01 | 192.168.10.33* | SRV-COMP-22 | 192.168.10.60 | `ping 192.168.10.60` | Sem resposta (sub-redes diferentes, sem roteador) |
| T27 | PC-TI-31-01 | 192.168.10.65 | SRV-TI-32 | 192.168.10.92 | `ping 192.168.10.92` | Sem resposta (sub-redes diferentes, sem roteador) |
| T28 | PC-INFRA-41-01 | 192.168.10.97* | SRV-INFRA-42 | 192.168.10.124 | `ping 192.168.10.124` | Sem resposta (sub-redes diferentes, sem roteador) |
| T29 | PC-ENG-11-01 | 192.168.10.1 | SRV-COMP-21 | 192.168.10.44 | `ping 192.168.10.44` | Sem resposta (sub-redes diferentes, sem roteador) |
| T30 | PC-COMP-21-01 | 192.168.10.33* | SRV-TI-31 | 192.168.10.76 | `ping 192.168.10.76` | Sem resposta (sub-redes diferentes, sem roteador) |
| T31 | PC-TI-31-01 | 192.168.10.65 | SRV-INFRA-41 | 192.168.10.108 | `ping 192.168.10.108` | Sem resposta (sub-redes diferentes, sem roteador) |

`*` indica endereço previsto para dispositivo em DHCP; na execução, usar o endereço efetivamente recebido. Os testes sem resposta decorrem do projeto (sub-redes distintas e ausência de roteador): demonstram a segmentação.

---

## PASSO 9 — salvar
**File → Save As →** `SuperTech.pkt`.

