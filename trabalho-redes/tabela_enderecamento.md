# Tabela de endereçamento

## Subnetting (Classe C 192.168.10.0/24 -> /27)

| Departamento | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast | Hosts úteis |
|---|---|---|---|---|---|---|---|
| Engenharia | 192.168.10.0 | 255.255.255.224 | /27 | 192.168.10.1 | 192.168.10.30 | 192.168.10.31 | 30 |
| Compras | 192.168.10.32 | 255.255.255.224 | /27 | 192.168.10.33 | 192.168.10.62 | 192.168.10.63 | 30 |
| TI Interno | 192.168.10.64 | 255.255.255.224 | /27 | 192.168.10.65 | 192.168.10.94 | 192.168.10.95 | 30 |
| Infraestrutura | 192.168.10.96 | 255.255.255.224 | /27 | 192.168.10.97 | 192.168.10.126 | 192.168.10.127 | 30 |

## Endereçamento por porta


### Engenharia (SW-ENG) - IP estatico - 192.168.10.0/27

| Porta | VLAN | Dispositivo | Nome | IP | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 1 | PC | PC-ENG-V1-1 | 192.168.10.1 | Estático |
| Fa0/2 | 1 | PC | PC-ENG-V1-2 | 192.168.10.2 | Estático |
| Fa0/3 | 1 | PC | PC-ENG-V1-3 | 192.168.10.3 | Estático |
| Fa0/4 | 1 | PC | PC-ENG-V1-4 | 192.168.10.4 | Estático |
| Fa0/5 | 1 | PC | PC-ENG-V1-5 | 192.168.10.5 | Estático |
| Fa0/6 | 1 | PC | PC-ENG-V1-6 | 192.168.10.6 | Estático |
| Fa0/7 | 1 | PC | PC-ENG-V1-7 | 192.168.10.7 | Estático |
| Fa0/8 | 1 | PC | PC-ENG-V1-8 | 192.168.10.8 | Estático |
| Fa0/9 | 1 | PC | PC-ENG-V1-9 | 192.168.10.9 | Estático |
| Fa0/10 | 1 | PC | PC-ENG-V1-10 | 192.168.10.10 | Estático |
| Fa0/11 | 1 | Impressora | PRT-ENG-V1-1 | 192.168.10.11 | Estático |
| Fa0/12 | 1 | Servidor | SRV-ENG-V1-1 | 192.168.10.12 | Estático |
| Fa0/13 | 2 | PC | PC-ENG-V2-11 | 192.168.10.13 | Estático |
| Fa0/14 | 2 | PC | PC-ENG-V2-12 | 192.168.10.14 | Estático |
| Fa0/15 | 2 | PC | PC-ENG-V2-13 | 192.168.10.15 | Estático |
| Fa0/16 | 2 | PC | PC-ENG-V2-14 | 192.168.10.16 | Estático |
| Fa0/17 | 2 | PC | PC-ENG-V2-15 | 192.168.10.17 | Estático |
| Fa0/18 | 2 | PC | PC-ENG-V2-16 | 192.168.10.18 | Estático |
| Fa0/19 | 2 | PC | PC-ENG-V2-17 | 192.168.10.19 | Estático |
| Fa0/20 | 2 | PC | PC-ENG-V2-18 | 192.168.10.20 | Estático |
| Fa0/21 | 2 | PC | PC-ENG-V2-19 | 192.168.10.21 | Estático |
| Fa0/22 | 2 | PC | PC-ENG-V2-20 | 192.168.10.22 | Estático |
| Fa0/23 | 2 | Impressora | PRT-ENG-V2-2 | 192.168.10.23 | Estático |
| Fa0/24 | 2 | Servidor | SRV-ENG-V2-2 | 192.168.10.24 | Estático |

### Compras (SW-COMP) - IP dinamico - 192.168.10.32/27

| Porta | VLAN | Dispositivo | Nome | IP | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 1 | PC | PC-COM-V1-1 | 192.168.10.33 | DHCP |
| Fa0/2 | 1 | PC | PC-COM-V1-2 | 192.168.10.34 | DHCP |
| Fa0/3 | 1 | PC | PC-COM-V1-3 | 192.168.10.35 | DHCP |
| Fa0/4 | 1 | PC | PC-COM-V1-4 | 192.168.10.36 | DHCP |
| Fa0/5 | 1 | PC | PC-COM-V1-5 | 192.168.10.37 | DHCP |
| Fa0/6 | 1 | PC | PC-COM-V1-6 | 192.168.10.38 | DHCP |
| Fa0/7 | 1 | PC | PC-COM-V1-7 | 192.168.10.39 | DHCP |
| Fa0/8 | 1 | PC | PC-COM-V1-8 | 192.168.10.40 | DHCP |
| Fa0/9 | 1 | PC | PC-COM-V1-9 | 192.168.10.41 | DHCP |
| Fa0/10 | 1 | PC | PC-COM-V1-10 | 192.168.10.42 | DHCP |
| Fa0/11 | 1 | Impressora | PRT-COM-V1-1 | 192.168.10.43 | DHCP |
| Fa0/12 | 1 | Servidor | SRV-COM-V1-1 | 192.168.10.44 | Estático |
| Fa0/13 | 2 | PC | PC-COM-V2-11 | 192.168.10.45 | DHCP |
| Fa0/14 | 2 | PC | PC-COM-V2-12 | 192.168.10.46 | DHCP |
| Fa0/15 | 2 | PC | PC-COM-V2-13 | 192.168.10.47 | DHCP |
| Fa0/16 | 2 | PC | PC-COM-V2-14 | 192.168.10.48 | DHCP |
| Fa0/17 | 2 | PC | PC-COM-V2-15 | 192.168.10.49 | DHCP |
| Fa0/18 | 2 | PC | PC-COM-V2-16 | 192.168.10.50 | DHCP |
| Fa0/19 | 2 | PC | PC-COM-V2-17 | 192.168.10.51 | DHCP |
| Fa0/20 | 2 | PC | PC-COM-V2-18 | 192.168.10.52 | DHCP |
| Fa0/21 | 2 | PC | PC-COM-V2-19 | 192.168.10.53 | DHCP |
| Fa0/22 | 2 | PC | PC-COM-V2-20 | 192.168.10.54 | DHCP |
| Fa0/23 | 2 | Impressora | PRT-COM-V2-2 | 192.168.10.55 | DHCP |
| Fa0/24 | 2 | Servidor | SRV-COM-V2-2 | 192.168.10.56 | Estático |

**Pools DHCP:** VLAN 1 → servidor .44 atende 192.168.10.33 a 192.168.10.43 (11 end.: 10 PCs + 1 impressora); VLAN 2 → servidor 192.168.10.56 atende 192.168.10.45 a 192.168.10.55 (11 end.).

### TI Interno (SW-TI) - IP estatico - 192.168.10.64/27

| Porta | VLAN | Dispositivo | Nome | IP | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 1 | PC | PC-TI-V1-1 | 192.168.10.65 | Estático |
| Fa0/2 | 1 | PC | PC-TI-V1-2 | 192.168.10.66 | Estático |
| Fa0/3 | 1 | PC | PC-TI-V1-3 | 192.168.10.67 | Estático |
| Fa0/4 | 1 | PC | PC-TI-V1-4 | 192.168.10.68 | Estático |
| Fa0/5 | 1 | PC | PC-TI-V1-5 | 192.168.10.69 | Estático |
| Fa0/6 | 1 | PC | PC-TI-V1-6 | 192.168.10.70 | Estático |
| Fa0/7 | 1 | PC | PC-TI-V1-7 | 192.168.10.71 | Estático |
| Fa0/8 | 1 | PC | PC-TI-V1-8 | 192.168.10.72 | Estático |
| Fa0/9 | 1 | PC | PC-TI-V1-9 | 192.168.10.73 | Estático |
| Fa0/10 | 1 | PC | PC-TI-V1-10 | 192.168.10.74 | Estático |
| Fa0/11 | 1 | Impressora | PRT-TI-V1-1 | 192.168.10.75 | Estático |
| Fa0/12 | 1 | Servidor | SRV-TI-V1-1 | 192.168.10.76 | Estático |
| Fa0/13 | 2 | PC | PC-TI-V2-11 | 192.168.10.77 | Estático |
| Fa0/14 | 2 | PC | PC-TI-V2-12 | 192.168.10.78 | Estático |
| Fa0/15 | 2 | PC | PC-TI-V2-13 | 192.168.10.79 | Estático |
| Fa0/16 | 2 | PC | PC-TI-V2-14 | 192.168.10.80 | Estático |
| Fa0/17 | 2 | PC | PC-TI-V2-15 | 192.168.10.81 | Estático |
| Fa0/18 | 2 | PC | PC-TI-V2-16 | 192.168.10.82 | Estático |
| Fa0/19 | 2 | PC | PC-TI-V2-17 | 192.168.10.83 | Estático |
| Fa0/20 | 2 | PC | PC-TI-V2-18 | 192.168.10.84 | Estático |
| Fa0/21 | 2 | PC | PC-TI-V2-19 | 192.168.10.85 | Estático |
| Fa0/22 | 2 | PC | PC-TI-V2-20 | 192.168.10.86 | Estático |
| Fa0/23 | 2 | Impressora | PRT-TI-V2-2 | 192.168.10.87 | Estático |
| Fa0/24 | 2 | Servidor | SRV-TI-V2-2 | 192.168.10.88 | Estático |

### Infraestrutura (SW-INFRA) - IP dinamico - 192.168.10.96/27

| Porta | VLAN | Dispositivo | Nome | IP | Origem |
|---|---|---|---|---|---|
| Fa0/1 | 1 | PC | PC-INF-V1-1 | 192.168.10.97 | DHCP |
| Fa0/2 | 1 | PC | PC-INF-V1-2 | 192.168.10.98 | DHCP |
| Fa0/3 | 1 | PC | PC-INF-V1-3 | 192.168.10.99 | DHCP |
| Fa0/4 | 1 | PC | PC-INF-V1-4 | 192.168.10.100 | DHCP |
| Fa0/5 | 1 | PC | PC-INF-V1-5 | 192.168.10.101 | DHCP |
| Fa0/6 | 1 | PC | PC-INF-V1-6 | 192.168.10.102 | DHCP |
| Fa0/7 | 1 | PC | PC-INF-V1-7 | 192.168.10.103 | DHCP |
| Fa0/8 | 1 | PC | PC-INF-V1-8 | 192.168.10.104 | DHCP |
| Fa0/9 | 1 | PC | PC-INF-V1-9 | 192.168.10.105 | DHCP |
| Fa0/10 | 1 | PC | PC-INF-V1-10 | 192.168.10.106 | DHCP |
| Fa0/11 | 1 | Impressora | PRT-INF-V1-1 | 192.168.10.107 | DHCP |
| Fa0/12 | 1 | Servidor | SRV-INF-V1-1 | 192.168.10.108 | Estático |
| Fa0/13 | 2 | PC | PC-INF-V2-11 | 192.168.10.109 | DHCP |
| Fa0/14 | 2 | PC | PC-INF-V2-12 | 192.168.10.110 | DHCP |
| Fa0/15 | 2 | PC | PC-INF-V2-13 | 192.168.10.111 | DHCP |
| Fa0/16 | 2 | PC | PC-INF-V2-14 | 192.168.10.112 | DHCP |
| Fa0/17 | 2 | PC | PC-INF-V2-15 | 192.168.10.113 | DHCP |
| Fa0/18 | 2 | PC | PC-INF-V2-16 | 192.168.10.114 | DHCP |
| Fa0/19 | 2 | PC | PC-INF-V2-17 | 192.168.10.115 | DHCP |
| Fa0/20 | 2 | PC | PC-INF-V2-18 | 192.168.10.116 | DHCP |
| Fa0/21 | 2 | PC | PC-INF-V2-19 | 192.168.10.117 | DHCP |
| Fa0/22 | 2 | PC | PC-INF-V2-20 | 192.168.10.118 | DHCP |
| Fa0/23 | 2 | Impressora | PRT-INF-V2-2 | 192.168.10.119 | DHCP |
| Fa0/24 | 2 | Servidor | SRV-INF-V2-2 | 192.168.10.120 | Estático |

**Pools DHCP:** VLAN 1 → servidor .108 atende 192.168.10.97 a 192.168.10.107 (11 end.: 10 PCs + 1 impressora); VLAN 2 → servidor 192.168.10.120 atende 192.168.10.109 a 192.168.10.119 (11 end.).
