# Tabela de endereçamento (v2)

Bloco: **192.168.10.0/24** (Classe C). Cada departamento recebe um /27 (24 hosts + folga); dentro dele, cada VLAN recebe um /28 (12 hosts + 2 de folga). Os hosts são configurados com a máscara **/28 = 255.255.255.240**.

## Sub-redes por departamento (agregado /27)

| Departamento | Bloco /27 | Máscara /27 | 1º IP | Último IP | Broadcast |
|---|---|---|---|---|---|
| Engenharia | 192.168.10.0/27 | 255.255.255.224 | 192.168.10.1 | 192.168.10.30 | 192.168.10.31 |
| Compras | 192.168.10.32/27 | 255.255.255.224 | 192.168.10.33 | 192.168.10.62 | 192.168.10.63 |
| TI Interno | 192.168.10.64/27 | 255.255.255.224 | 192.168.10.65 | 192.168.10.94 | 192.168.10.95 |
| Infraestrutura | 192.168.10.96/27 | 255.255.255.224 | 192.168.10.97 | 192.168.10.126 | 192.168.10.127 |

## Sub-redes por VLAN (/28 – usadas pelos hosts)

| Departamento | VLAN | Portas | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast | IPs úteis |
|---|---|---|---|---|---|---|---|---|---|
| Engenharia | 11 | Fa0/1-12 | 192.168.10.0 | 255.255.255.240 | /28 | 192.168.10.1 | 192.168.10.14 | 192.168.10.15 | 14 |
| Engenharia | 12 | Fa0/13-24 | 192.168.10.16 | 255.255.255.240 | /28 | 192.168.10.17 | 192.168.10.30 | 192.168.10.31 | 14 |
| Compras | 21 | Fa0/1-12 | 192.168.10.32 | 255.255.255.240 | /28 | 192.168.10.33 | 192.168.10.46 | 192.168.10.47 | 14 |
| Compras | 22 | Fa0/13-24 | 192.168.10.48 | 255.255.255.240 | /28 | 192.168.10.49 | 192.168.10.62 | 192.168.10.63 | 14 |
| TI Interno | 31 | Fa0/1-12 | 192.168.10.64 | 255.255.255.240 | /28 | 192.168.10.65 | 192.168.10.78 | 192.168.10.79 | 14 |
| TI Interno | 32 | Fa0/13-24 | 192.168.10.80 | 255.255.255.240 | /28 | 192.168.10.81 | 192.168.10.94 | 192.168.10.95 | 14 |
| Infraestrutura | 41 | Fa0/1-12 | 192.168.10.96 | 255.255.255.240 | /28 | 192.168.10.97 | 192.168.10.110 | 192.168.10.111 | 14 |
| Infraestrutura | 42 | Fa0/13-24 | 192.168.10.112 | 255.255.255.240 | /28 | 192.168.10.113 | 192.168.10.126 | 192.168.10.127 | 14 |

## Endereçamento por porta

Regra: o último octeto = endereço da rede da VLAN + posição do host na VLAN (porta 1 ou 13 → +1 … porta 12 ou 24 → +12). Nomes sugeridos: `PC-ENG-11-01`, `IMP-ENG-11`, `SRV-ENG-11`.


### Engenharia – SW-ENG – IP estático – bloco 192.168.10.0/27

| Porta | VLAN | Dispositivo | Nome sugerido | IP / máscara | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 11 | PC | PC-ENG-11-01 | 192.168.10.1/28 | estático |
| Fa0/2 | 11 | PC | PC-ENG-11-02 | 192.168.10.2/28 | estático |
| Fa0/3 | 11 | PC | PC-ENG-11-03 | 192.168.10.3/28 | estático |
| Fa0/4 | 11 | PC | PC-ENG-11-04 | 192.168.10.4/28 | estático |
| Fa0/5 | 11 | PC | PC-ENG-11-05 | 192.168.10.5/28 | estático |
| Fa0/6 | 11 | PC | PC-ENG-11-06 | 192.168.10.6/28 | estático |
| Fa0/7 | 11 | PC | PC-ENG-11-07 | 192.168.10.7/28 | estático |
| Fa0/8 | 11 | PC | PC-ENG-11-08 | 192.168.10.8/28 | estático |
| Fa0/9 | 11 | PC | PC-ENG-11-09 | 192.168.10.9/28 | estático |
| Fa0/10 | 11 | PC | PC-ENG-11-10 | 192.168.10.10/28 | estático |
| Fa0/11 | 11 | Impressora | IMP-ENG-11 | 192.168.10.11/28 | estático |
| Fa0/12 | 11 | Servidor | SRV-ENG-11 | 192.168.10.12/28 | estático |
| Fa0/13 | 12 | PC | PC-ENG-12-01 | 192.168.10.17/28 | estático |
| Fa0/14 | 12 | PC | PC-ENG-12-02 | 192.168.10.18/28 | estático |
| Fa0/15 | 12 | PC | PC-ENG-12-03 | 192.168.10.19/28 | estático |
| Fa0/16 | 12 | PC | PC-ENG-12-04 | 192.168.10.20/28 | estático |
| Fa0/17 | 12 | PC | PC-ENG-12-05 | 192.168.10.21/28 | estático |
| Fa0/18 | 12 | PC | PC-ENG-12-06 | 192.168.10.22/28 | estático |
| Fa0/19 | 12 | PC | PC-ENG-12-07 | 192.168.10.23/28 | estático |
| Fa0/20 | 12 | PC | PC-ENG-12-08 | 192.168.10.24/28 | estático |
| Fa0/21 | 12 | PC | PC-ENG-12-09 | 192.168.10.25/28 | estático |
| Fa0/22 | 12 | PC | PC-ENG-12-10 | 192.168.10.26/28 | estático |
| Fa0/23 | 12 | Impressora | IMP-ENG-12 | 192.168.10.27/28 | estático |
| Fa0/24 | 12 | Servidor | SRV-ENG-12 | 192.168.10.28/28 | estático |

### Compras – SW-COMP – IP DHCP – bloco 192.168.10.32/27

| Porta | VLAN | Dispositivo | Nome sugerido | IP / máscara | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 21 | PC | PC-COMP-21-01 | 192.168.10.33/28 | DHCP |
| Fa0/2 | 21 | PC | PC-COMP-21-02 | 192.168.10.34/28 | DHCP |
| Fa0/3 | 21 | PC | PC-COMP-21-03 | 192.168.10.35/28 | DHCP |
| Fa0/4 | 21 | PC | PC-COMP-21-04 | 192.168.10.36/28 | DHCP |
| Fa0/5 | 21 | PC | PC-COMP-21-05 | 192.168.10.37/28 | DHCP |
| Fa0/6 | 21 | PC | PC-COMP-21-06 | 192.168.10.38/28 | DHCP |
| Fa0/7 | 21 | PC | PC-COMP-21-07 | 192.168.10.39/28 | DHCP |
| Fa0/8 | 21 | PC | PC-COMP-21-08 | 192.168.10.40/28 | DHCP |
| Fa0/9 | 21 | PC | PC-COMP-21-09 | 192.168.10.41/28 | DHCP |
| Fa0/10 | 21 | PC | PC-COMP-21-10 | 192.168.10.42/28 | DHCP |
| Fa0/11 | 21 | Impressora | IMP-COMP-21 | 192.168.10.43/28 | DHCP |
| Fa0/12 | 21 | Servidor | SRV-COMP-21 | 192.168.10.44/28 | estático |
| Fa0/13 | 22 | PC | PC-COMP-22-01 | 192.168.10.49/28 | DHCP |
| Fa0/14 | 22 | PC | PC-COMP-22-02 | 192.168.10.50/28 | DHCP |
| Fa0/15 | 22 | PC | PC-COMP-22-03 | 192.168.10.51/28 | DHCP |
| Fa0/16 | 22 | PC | PC-COMP-22-04 | 192.168.10.52/28 | DHCP |
| Fa0/17 | 22 | PC | PC-COMP-22-05 | 192.168.10.53/28 | DHCP |
| Fa0/18 | 22 | PC | PC-COMP-22-06 | 192.168.10.54/28 | DHCP |
| Fa0/19 | 22 | PC | PC-COMP-22-07 | 192.168.10.55/28 | DHCP |
| Fa0/20 | 22 | PC | PC-COMP-22-08 | 192.168.10.56/28 | DHCP |
| Fa0/21 | 22 | PC | PC-COMP-22-09 | 192.168.10.57/28 | DHCP |
| Fa0/22 | 22 | PC | PC-COMP-22-10 | 192.168.10.58/28 | DHCP |
| Fa0/23 | 22 | Impressora | IMP-COMP-22 | 192.168.10.59/28 | DHCP |
| Fa0/24 | 22 | Servidor | SRV-COMP-22 | 192.168.10.60/28 | estático |

> Em PCs e impressoras com origem DHCP, o IP da tabela é o **previsto** pela sequência do pool; a associação exata porta↔IP depende da ordem em que cada dispositivo pede o endereço. Os servidores são sempre estáticos.

**Pools DHCP (um servidor por VLAN):**

| VLAN | Servidor (estático) | Start IP | Máscara | Max users | Faixa entregue |
|---|---|---|---|---|---|
| 21 | 192.168.10.44 | 192.168.10.33 | 255.255.255.240 | 11 | 192.168.10.33 – 192.168.10.43 |
| 22 | 192.168.10.60 | 192.168.10.49 | 255.255.255.240 | 11 | 192.168.10.49 – 192.168.10.59 |

### TI Interno – SW-TI – IP estático – bloco 192.168.10.64/27

| Porta | VLAN | Dispositivo | Nome sugerido | IP / máscara | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 31 | PC | PC-TI-31-01 | 192.168.10.65/28 | estático |
| Fa0/2 | 31 | PC | PC-TI-31-02 | 192.168.10.66/28 | estático |
| Fa0/3 | 31 | PC | PC-TI-31-03 | 192.168.10.67/28 | estático |
| Fa0/4 | 31 | PC | PC-TI-31-04 | 192.168.10.68/28 | estático |
| Fa0/5 | 31 | PC | PC-TI-31-05 | 192.168.10.69/28 | estático |
| Fa0/6 | 31 | PC | PC-TI-31-06 | 192.168.10.70/28 | estático |
| Fa0/7 | 31 | PC | PC-TI-31-07 | 192.168.10.71/28 | estático |
| Fa0/8 | 31 | PC | PC-TI-31-08 | 192.168.10.72/28 | estático |
| Fa0/9 | 31 | PC | PC-TI-31-09 | 192.168.10.73/28 | estático |
| Fa0/10 | 31 | PC | PC-TI-31-10 | 192.168.10.74/28 | estático |
| Fa0/11 | 31 | Impressora | IMP-TI-31 | 192.168.10.75/28 | estático |
| Fa0/12 | 31 | Servidor | SRV-TI-31 | 192.168.10.76/28 | estático |
| Fa0/13 | 32 | PC | PC-TI-32-01 | 192.168.10.81/28 | estático |
| Fa0/14 | 32 | PC | PC-TI-32-02 | 192.168.10.82/28 | estático |
| Fa0/15 | 32 | PC | PC-TI-32-03 | 192.168.10.83/28 | estático |
| Fa0/16 | 32 | PC | PC-TI-32-04 | 192.168.10.84/28 | estático |
| Fa0/17 | 32 | PC | PC-TI-32-05 | 192.168.10.85/28 | estático |
| Fa0/18 | 32 | PC | PC-TI-32-06 | 192.168.10.86/28 | estático |
| Fa0/19 | 32 | PC | PC-TI-32-07 | 192.168.10.87/28 | estático |
| Fa0/20 | 32 | PC | PC-TI-32-08 | 192.168.10.88/28 | estático |
| Fa0/21 | 32 | PC | PC-TI-32-09 | 192.168.10.89/28 | estático |
| Fa0/22 | 32 | PC | PC-TI-32-10 | 192.168.10.90/28 | estático |
| Fa0/23 | 32 | Impressora | IMP-TI-32 | 192.168.10.91/28 | estático |
| Fa0/24 | 32 | Servidor | SRV-TI-32 | 192.168.10.92/28 | estático |

### Infraestrutura – SW-INFRA – IP DHCP – bloco 192.168.10.96/27

| Porta | VLAN | Dispositivo | Nome sugerido | IP / máscara | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 41 | PC | PC-INFRA-41-01 | 192.168.10.97/28 | DHCP |
| Fa0/2 | 41 | PC | PC-INFRA-41-02 | 192.168.10.98/28 | DHCP |
| Fa0/3 | 41 | PC | PC-INFRA-41-03 | 192.168.10.99/28 | DHCP |
| Fa0/4 | 41 | PC | PC-INFRA-41-04 | 192.168.10.100/28 | DHCP |
| Fa0/5 | 41 | PC | PC-INFRA-41-05 | 192.168.10.101/28 | DHCP |
| Fa0/6 | 41 | PC | PC-INFRA-41-06 | 192.168.10.102/28 | DHCP |
| Fa0/7 | 41 | PC | PC-INFRA-41-07 | 192.168.10.103/28 | DHCP |
| Fa0/8 | 41 | PC | PC-INFRA-41-08 | 192.168.10.104/28 | DHCP |
| Fa0/9 | 41 | PC | PC-INFRA-41-09 | 192.168.10.105/28 | DHCP |
| Fa0/10 | 41 | PC | PC-INFRA-41-10 | 192.168.10.106/28 | DHCP |
| Fa0/11 | 41 | Impressora | IMP-INFRA-41 | 192.168.10.107/28 | DHCP |
| Fa0/12 | 41 | Servidor | SRV-INFRA-41 | 192.168.10.108/28 | estático |
| Fa0/13 | 42 | PC | PC-INFRA-42-01 | 192.168.10.113/28 | DHCP |
| Fa0/14 | 42 | PC | PC-INFRA-42-02 | 192.168.10.114/28 | DHCP |
| Fa0/15 | 42 | PC | PC-INFRA-42-03 | 192.168.10.115/28 | DHCP |
| Fa0/16 | 42 | PC | PC-INFRA-42-04 | 192.168.10.116/28 | DHCP |
| Fa0/17 | 42 | PC | PC-INFRA-42-05 | 192.168.10.117/28 | DHCP |
| Fa0/18 | 42 | PC | PC-INFRA-42-06 | 192.168.10.118/28 | DHCP |
| Fa0/19 | 42 | PC | PC-INFRA-42-07 | 192.168.10.119/28 | DHCP |
| Fa0/20 | 42 | PC | PC-INFRA-42-08 | 192.168.10.120/28 | DHCP |
| Fa0/21 | 42 | PC | PC-INFRA-42-09 | 192.168.10.121/28 | DHCP |
| Fa0/22 | 42 | PC | PC-INFRA-42-10 | 192.168.10.122/28 | DHCP |
| Fa0/23 | 42 | Impressora | IMP-INFRA-42 | 192.168.10.123/28 | DHCP |
| Fa0/24 | 42 | Servidor | SRV-INFRA-42 | 192.168.10.124/28 | estático |

> Em PCs e impressoras com origem DHCP, o IP da tabela é o **previsto** pela sequência do pool; a associação exata porta↔IP depende da ordem em que cada dispositivo pede o endereço. Os servidores são sempre estáticos.

**Pools DHCP (um servidor por VLAN):**

| VLAN | Servidor (estático) | Start IP | Máscara | Max users | Faixa entregue |
|---|---|---|---|---|---|
| 41 | 192.168.10.108 | 192.168.10.97 | 255.255.255.240 | 11 | 192.168.10.97 – 192.168.10.107 |
| 42 | 192.168.10.124 | 192.168.10.113 | 255.255.255.240 | 11 | 192.168.10.113 – 192.168.10.123 |

## Interligação dos switches (cadeia, trunk 802.1Q)

| Enlace | Ponta A | Ponta B |
|---|---|---|
| 1 | SW-ENG Gi0/1 | SW-COMP Gi0/1 |
| 2 | SW-COMP Gi0/2 | SW-TI Gi0/1 |
| 3 | SW-TI Gi0/2 | SW-INFRA Gi0/1 |
