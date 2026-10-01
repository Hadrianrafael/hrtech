<!-- ATENÇÃO (apagar antes de entregar): a redação em tempo presente descreve o PROJETO. Só entregue depois de executar o guia e substituir TODOS os marcadores `[INSERIR ...]` por resultados reais obtidos no seu Packet Tracer. Não deixe resultado previsto como se fosse obtido. -->

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

Foram utilizados o Cisco Packet Tracer, 4 switches (modelo **[INFORMAR O MODELO USADO — 2950T-24 ou o que passou no PASSO 0]**), 80 PCs, 8 servidores e 8 impressoras. Cada departamento tem 20 estações, 2 servidores e 2 impressoras, totalizando 24 hosts por departamento e 96 hosts na rede.

`[INSERIR FIGURA 1 — SAÍDA REAL DE `show ip interface brief` DO SWITCH ESCOLHIDO]`

*Figura 1 – Interfaces do switch utilizado.*

O enunciado pede o switch 2950-24. Como as 24 portas FastEthernet são ocupadas pelos hosts, a interligação dos switches exige portas adicionais; por isso foi utilizado o modelo da mesma família que possui duas portas Gigabit (Gi0/1 e Gi0/2), conforme a Figura 1. **[AJUSTAR este parágrafo conforme o que o Packet Tracer realmente mostrou no PASSO 0.]**

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

`[INSERIR FIGURA 2 — TOPOLOGIA COMPLETA DO PACKET TRACER]`

*Figura 2 – Topologia completa da rede da Super Tech.*

**Tabela 1 – Sub-redes por departamento (/27)**

| Departamento | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast |
|---|---|---|---|---|---|---|
| Engenharia | 192.168.10.0 | 255.255.255.224 | /27 | 192.168.10.1 | 192.168.10.30 | 192.168.10.31 |
| Compras | 192.168.10.32 | 255.255.255.224 | /27 | 192.168.10.33 | 192.168.10.62 | 192.168.10.63 |
| TI Interno | 192.168.10.64 | 255.255.255.224 | /27 | 192.168.10.65 | 192.168.10.94 | 192.168.10.95 |
| Infraestrutura | 192.168.10.96 | 255.255.255.224 | /27 | 192.168.10.97 | 192.168.10.126 | 192.168.10.127 |

**Tabela 2 – Sub-redes por VLAN (/28)**

| Departamento | VLAN | Portas | Rede | Máscara | CIDR | 1º IP válido | Último IP válido | Broadcast |
|---|---|---|---|---|---|---|---|---|
| Engenharia | 11 | Fa0/1–12 | 192.168.10.0 | 255.255.255.240 | /28 | 192.168.10.1 | 192.168.10.14 | 192.168.10.15 |
| Engenharia | 12 | Fa0/13–24 | 192.168.10.16 | 255.255.255.240 | /28 | 192.168.10.17 | 192.168.10.30 | 192.168.10.31 |
| Compras | 21 | Fa0/1–12 | 192.168.10.32 | 255.255.255.240 | /28 | 192.168.10.33 | 192.168.10.46 | 192.168.10.47 |
| Compras | 22 | Fa0/13–24 | 192.168.10.48 | 255.255.255.240 | /28 | 192.168.10.49 | 192.168.10.62 | 192.168.10.63 |
| TI Interno | 31 | Fa0/1–12 | 192.168.10.64 | 255.255.255.240 | /28 | 192.168.10.65 | 192.168.10.78 | 192.168.10.79 |
| TI Interno | 32 | Fa0/13–24 | 192.168.10.80 | 255.255.255.240 | /28 | 192.168.10.81 | 192.168.10.94 | 192.168.10.95 |
| Infraestrutura | 41 | Fa0/1–12 | 192.168.10.96 | 255.255.255.240 | /28 | 192.168.10.97 | 192.168.10.110 | 192.168.10.111 |
| Infraestrutura | 42 | Fa0/13–24 | 192.168.10.112 | 255.255.255.240 | /28 | 192.168.10.113 | 192.168.10.126 | 192.168.10.127 |

**Tabela 3 – Interligação dos switches (trunk 802.1Q, cabo cruzado)**

| Enlace | Switch A / porta | Switch B / porta |
|---|---|---|
| 1 | SW-ENG Gi0/1 | SW-COMP Gi0/1 |
| 2 | SW-COMP Gi0/2 | SW-TI Gi0/1 |
| 3 | SW-TI Gi0/2 | SW-INFRA Gi0/1 |

**Tabela 4 – Servidores DHCP e pools (Compras e Infraestrutura)**

| VLAN | Servidor | IP do servidor (estático) | Start IP | Máximo de usuários | Faixa prevista |
|---|---|---|---|---|---|
| 21 | SRV-COMP-21 | 192.168.10.44 | 192.168.10.33 | 11 | 192.168.10.33 – 192.168.10.43 |
| 22 | SRV-COMP-22 | 192.168.10.60 | 192.168.10.49 | 11 | 192.168.10.49 – 192.168.10.59 |
| 41 | SRV-INFRA-41 | 192.168.10.108 | 192.168.10.97 | 11 | 192.168.10.97 – 192.168.10.107 |
| 42 | SRV-INFRA-42 | 192.168.10.124 | 192.168.10.113 | 11 | 192.168.10.113 – 192.168.10.123 |

O endereçamento completo, porta por porta, está no Anexo A (`tabela_enderecamento.md`). As tabelas acima derivam apenas do planejamento; a confirmação no simulador está na seção 4.

## 4. Resultados

Esta seção reúne **somente** o que foi obtido no Packet Tracer.

### 4.1 VLANs e portas

`[INSERIR FIGURA 3 — SAÍDA REAL DE `show vlan brief` DO SW-ENG]`

*Figura 3 – VLANs e portas de acesso do SW-ENG.*

`[INSERIR FIGURA 4 — SAÍDA REAL DE `show vlan brief` DO SW-COMP]`

*Figura 4 – VLANs e portas de acesso do SW-COMP.*

`[INSERIR FIGURA 5 — SAÍDA REAL DE `show vlan brief` DO SW-TI]`

*Figura 5 – VLANs e portas de acesso do SW-TI.*

`[INSERIR FIGURA 6 — SAÍDA REAL DE `show vlan brief` DO SW-INFRA]`

*Figura 6 – VLANs e portas de acesso do SW-INFRA.*

### 4.2 Trunks e interligação dos switches

`[INSERIR FIGURA 7 — SAÍDA REAL DE `show interfaces trunk` E `show cdp neighbors` DO SW-ENG]`

*Figura 7 – Trunks e vizinhos CDP do SW-ENG.*

`[INSERIR FIGURA 8 — SAÍDA REAL DE `show interfaces trunk` E `show cdp neighbors` DO SW-COMP]`

*Figura 8 – Trunks e vizinhos CDP do SW-COMP.*

`[INSERIR FIGURA 9 — SAÍDA REAL DE `show interfaces trunk` E `show cdp neighbors` DO SW-TI]`

*Figura 9 – Trunks e vizinhos CDP do SW-TI.*

`[INSERIR FIGURA 10 — SAÍDA REAL DE `show interfaces trunk` E `show cdp neighbors` DO SW-INFRA]`

*Figura 10 – Trunks e vizinhos CDP do SW-INFRA.*

### 4.3 IPs estáticos (Engenharia e TI Interno)

`[INSERIR FIGURA 11 — TELA DE IP ESTÁTICO DE PC-ENG-11-01]`

*Figura 11 – IP estático de PC-ENG-11-01.*

`[INSERIR FIGURA 12 — TELA DE IP ESTÁTICO DE IMP-ENG-11]`

*Figura 12 – IP estático de IMP-ENG-11.*

`[INSERIR FIGURA 13 — TELA DE IP ESTÁTICO DE SRV-ENG-11]`

*Figura 13 – IP estático de SRV-ENG-11.*

`[INSERIR FIGURA 14 — TELA DE IP ESTÁTICO DE PC-TI-31-01]`

*Figura 14 – IP estático de PC-TI-31-01.*

`[INSERIR FIGURA 15 — TELA DE IP ESTÁTICO DE IMP-TI-31]`

*Figura 15 – IP estático de IMP-TI-31.*

`[INSERIR FIGURA 16 — TELA DE IP ESTÁTICO DE SRV-TI-31]`

*Figura 16 – IP estático de SRV-TI-31.*

### 4.4 DHCP (Compras e Infraestrutura)

`[INSERIR FIGURA 17 — TELA DE IP ESTÁTICO DE SRV-COMP-21]`

*Figura 17 – IP estático do servidor DHCP SRV-COMP-21.*

`[INSERIR FIGURA 18 — TELA DE IP ESTÁTICO DE SRV-INFRA-41]`

*Figura 18 – IP estático do servidor DHCP SRV-INFRA-41.*

`[INSERIR FIGURA 19 — POOL DHCP DO SERVIDOR SRV-COMP-21]`

*Figura 19 – Pool DHCP do servidor SRV-COMP-21.*

`[INSERIR FIGURA 20 — POOL DHCP DO SERVIDOR SRV-COMP-22]`

*Figura 20 – Pool DHCP do servidor SRV-COMP-22.*

`[INSERIR FIGURA 21 — POOL DHCP DO SERVIDOR SRV-INFRA-41]`

*Figura 21 – Pool DHCP do servidor SRV-INFRA-41.*

`[INSERIR FIGURA 22 — POOL DHCP DO SERVIDOR SRV-INFRA-42]`

*Figura 22 – Pool DHCP do servidor SRV-INFRA-42.*

`[INSERIR FIGURA 23 — `ipconfig` DO PC PC-COMP-21-01]`

*Figura 23 – Endereço obtido por DHCP por PC-COMP-21-01.*

`[INSERIR FIGURA 24 — `ipconfig` DO PC PC-COMP-22-01]`

*Figura 24 – Endereço obtido por DHCP por PC-COMP-22-01.*

`[INSERIR FIGURA 25 — `ipconfig` DO PC PC-INFRA-41-01]`

*Figura 25 – Endereço obtido por DHCP por PC-INFRA-41-01.*

`[INSERIR FIGURA 26 — `ipconfig` DO PC PC-INFRA-42-01]`

*Figura 26 – Endereço obtido por DHCP por PC-INFRA-42-01.*

`[INSERIR FIGURA 27 — IMPRESSORA EM DHCP IMP-COMP-21]`

*Figura 27 – Impressora IMP-COMP-21 em DHCP.*

`[INSERIR FIGURA 28 — IMPRESSORA EM DHCP IMP-INFRA-41]`

*Figura 28 – Impressora IMP-INFRA-41 em DHCP.*

`[INSERIR TABELA — IPs REAIS RECEBIDOS POR DHCP, com o dispositivo e o IP lidos de `ipconfig`/Config]`

### 4.5 Testes de conectividade

A Tabela 5 lista os testes de conectividade. A coluna *Resultado obtido* só pode ser preenchida com o que o simulador mostrou.

**Tabela 5 – Testes de ping**

| Teste | Origem | Destino | Comando | Resultado esperado pelo projeto | Resultado obtido | Figura |
|---|---|---|---|---|---|---|
| T01 | PC-ENG-11-01 | PC-ENG-11-02 | `ping 192.168.10.2` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-ENG-11-01 → PC-ENG-11-02]` | 29 |
| T02 | PC-ENG-11-01 | IMP-ENG-11 | `ping 192.168.10.11` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-ENG-11-01 → IMP-ENG-11]` | 29 |
| T03 | PC-ENG-11-01 | SRV-ENG-11 | `ping 192.168.10.12` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-ENG-11-01 → SRV-ENG-11]` | 29 |
| T04 | PC-ENG-12-01 | PC-ENG-12-02 | `ping 192.168.10.18` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-ENG-12-01 → PC-ENG-12-02]` | 30 |
| T05 | PC-ENG-12-01 | IMP-ENG-12 | `ping 192.168.10.27` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-ENG-12-01 → IMP-ENG-12]` | 30 |
| T06 | PC-ENG-12-01 | SRV-ENG-12 | `ping 192.168.10.28` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-ENG-12-01 → SRV-ENG-12]` | 30 |
| T07 | PC-COMP-21-01 | PC-COMP-21-02 | `ping 192.168.10.34` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-COMP-21-01 → PC-COMP-21-02]` | 31 |
| T08 | PC-COMP-21-01 | IMP-COMP-21 | `ping 192.168.10.43` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-COMP-21-01 → IMP-COMP-21]` | 31 |
| T09 | PC-COMP-21-01 | SRV-COMP-21 | `ping 192.168.10.44` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-COMP-21-01 → SRV-COMP-21]` | 31 |
| T10 | PC-COMP-22-01 | PC-COMP-22-02 | `ping 192.168.10.50` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-COMP-22-01 → PC-COMP-22-02]` | 32 |
| T11 | PC-COMP-22-01 | IMP-COMP-22 | `ping 192.168.10.59` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-COMP-22-01 → IMP-COMP-22]` | 32 |
| T12 | PC-COMP-22-01 | SRV-COMP-22 | `ping 192.168.10.60` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-COMP-22-01 → SRV-COMP-22]` | 32 |
| T13 | PC-TI-31-01 | PC-TI-31-02 | `ping 192.168.10.66` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-TI-31-01 → PC-TI-31-02]` | 33 |
| T14 | PC-TI-31-01 | IMP-TI-31 | `ping 192.168.10.75` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-TI-31-01 → IMP-TI-31]` | 33 |
| T15 | PC-TI-31-01 | SRV-TI-31 | `ping 192.168.10.76` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-TI-31-01 → SRV-TI-31]` | 33 |
| T16 | PC-TI-32-01 | PC-TI-32-02 | `ping 192.168.10.82` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-TI-32-01 → PC-TI-32-02]` | 34 |
| T17 | PC-TI-32-01 | IMP-TI-32 | `ping 192.168.10.91` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-TI-32-01 → IMP-TI-32]` | 34 |
| T18 | PC-TI-32-01 | SRV-TI-32 | `ping 192.168.10.92` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-TI-32-01 → SRV-TI-32]` | 34 |
| T19 | PC-INFRA-41-01 | PC-INFRA-41-02 | `ping 192.168.10.98` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-INFRA-41-01 → PC-INFRA-41-02]` | 35 |
| T20 | PC-INFRA-41-01 | IMP-INFRA-41 | `ping 192.168.10.107` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-INFRA-41-01 → IMP-INFRA-41]` | 35 |
| T21 | PC-INFRA-41-01 | SRV-INFRA-41 | `ping 192.168.10.108` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-INFRA-41-01 → SRV-INFRA-41]` | 35 |
| T22 | PC-INFRA-42-01 | PC-INFRA-42-02 | `ping 192.168.10.114` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-INFRA-42-01 → PC-INFRA-42-02]` | 36 |
| T23 | PC-INFRA-42-01 | IMP-INFRA-42 | `ping 192.168.10.123` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-INFRA-42-01 → IMP-INFRA-42]` | 36 |
| T24 | PC-INFRA-42-01 | SRV-INFRA-42 | `ping 192.168.10.124` | Sucesso | `[INSERIR RESULTADO REAL DO PING PC-INFRA-42-01 → SRV-INFRA-42]` | 36 |
| T25 | PC-ENG-11-01 | SRV-ENG-12 | `ping 192.168.10.28` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-ENG-11-01 → SRV-ENG-12]` | 37 |
| T26 | PC-COMP-21-01 | SRV-COMP-22 | `ping 192.168.10.60` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-COMP-21-01 → SRV-COMP-22]` | 38 |
| T27 | PC-TI-31-01 | SRV-TI-32 | `ping 192.168.10.92` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-TI-31-01 → SRV-TI-32]` | 39 |
| T28 | PC-INFRA-41-01 | SRV-INFRA-42 | `ping 192.168.10.124` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-INFRA-41-01 → SRV-INFRA-42]` | 40 |
| T29 | PC-ENG-11-01 | SRV-COMP-21 | `ping 192.168.10.44` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-ENG-11-01 → SRV-COMP-21]` | 41 |
| T30 | PC-COMP-21-01 | SRV-TI-31 | `ping 192.168.10.76` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-COMP-21-01 → SRV-TI-31]` | 42 |
| T31 | PC-TI-31-01 | SRV-INFRA-41 | `ping 192.168.10.108` | Falha (sub-redes diferentes, sem roteador) | `[INSERIR RESULTADO REAL DO PING PC-TI-31-01 → SRV-INFRA-41]` | 43 |

Nos testes cujo destino é PC ou impressora de Compras/Infraestrutura, o IP do comando é o IP **real** lido no simulador (o da tabela é o previsto).

`[INSERIR FIGURA 29 — PINGS REAIS DO GRUPO G11 A PARTIR DE PC-ENG-11-01]`

*Figura 29 – Testes de ping na VLAN 11 (origem PC-ENG-11-01).*

`[INSERIR FIGURA 30 — PINGS REAIS DO GRUPO G12 A PARTIR DE PC-ENG-12-01]`

*Figura 30 – Testes de ping na VLAN 12 (origem PC-ENG-12-01).*

`[INSERIR FIGURA 31 — PINGS REAIS DO GRUPO G21 A PARTIR DE PC-COMP-21-01]`

*Figura 31 – Testes de ping na VLAN 21 (origem PC-COMP-21-01).*

`[INSERIR FIGURA 32 — PINGS REAIS DO GRUPO G22 A PARTIR DE PC-COMP-22-01]`

*Figura 32 – Testes de ping na VLAN 22 (origem PC-COMP-22-01).*

`[INSERIR FIGURA 33 — PINGS REAIS DO GRUPO G31 A PARTIR DE PC-TI-31-01]`

*Figura 33 – Testes de ping na VLAN 31 (origem PC-TI-31-01).*

`[INSERIR FIGURA 34 — PINGS REAIS DO GRUPO G32 A PARTIR DE PC-TI-32-01]`

*Figura 34 – Testes de ping na VLAN 32 (origem PC-TI-32-01).*

`[INSERIR FIGURA 35 — PINGS REAIS DO GRUPO G41 A PARTIR DE PC-INFRA-41-01]`

*Figura 35 – Testes de ping na VLAN 41 (origem PC-INFRA-41-01).*

`[INSERIR FIGURA 36 — PINGS REAIS DO GRUPO G42 A PARTIR DE PC-INFRA-42-01]`

*Figura 36 – Testes de ping na VLAN 42 (origem PC-INFRA-42-01).*

`[INSERIR FIGURA 37 — PINGS REAIS DO GRUPO NSW-ENG A PARTIR DE PC-ENG-11-01]`

*Figura 37 – Ping entre VLANs do mesmo departamento: PC-ENG-11-01 → SRV-ENG-12 (falha esperada).*

`[INSERIR FIGURA 38 — PINGS REAIS DO GRUPO NSW-COMP A PARTIR DE PC-COMP-21-01]`

*Figura 38 – Ping entre VLANs do mesmo departamento: PC-COMP-21-01 → SRV-COMP-22 (falha esperada).*

`[INSERIR FIGURA 39 — PINGS REAIS DO GRUPO NSW-TI A PARTIR DE PC-TI-31-01]`

*Figura 39 – Ping entre VLANs do mesmo departamento: PC-TI-31-01 → SRV-TI-32 (falha esperada).*

`[INSERIR FIGURA 40 — PINGS REAIS DO GRUPO NSW-INFRA A PARTIR DE PC-INFRA-41-01]`

*Figura 40 – Ping entre VLANs do mesmo departamento: PC-INFRA-41-01 → SRV-INFRA-42 (falha esperada).*

`[INSERIR FIGURA 41 — PINGS REAIS DO GRUPO X1 A PARTIR DE PC-ENG-11-01]`

*Figura 41 – Ping entre departamentos: PC-ENG-11-01 → SRV-COMP-21 (falha esperada).*

`[INSERIR FIGURA 42 — PINGS REAIS DO GRUPO X2 A PARTIR DE PC-COMP-21-01]`

*Figura 42 – Ping entre departamentos: PC-COMP-21-01 → SRV-TI-31 (falha esperada).*

`[INSERIR FIGURA 43 — PINGS REAIS DO GRUPO X3 A PARTIR DE PC-TI-31-01]`

*Figura 43 – Ping entre departamentos: PC-TI-31-01 → SRV-INFRA-41 (falha esperada).*

### 4.6 Análise dos resultados

`[ESCREVER APÓS OS TESTES, com base nos resultados reais: (a) pings dentro de cada VLAN; (b) falha entre VLANs do mesmo departamento e entre departamentos, e o que isso demonstra sobre segmentação e sobre a ausência de roteador; (c) endereços recebidos por DHCP dentro das faixas esperadas, sem endereço de um departamento aparecendo em outro; (d) interligação comprovada por trunk e CDP. Se qualquer resultado divergir do esperado, descrever a divergência e a causa.]`

## 5. Conclusão

`[AJUSTAR APÓS OS TESTES.]` A atividade permitiu simular uma rede com quatro departamentos, cada um em seu bloco de endereços, e mostrou como o subnetting dimensiona os endereços à necessidade: um /27 por departamento, com folga de seis endereços, e um /28 por VLAN. Também evidenciou que as VLANs segmentam o tráfego dentro do próprio switch, que cada VLAN deve ter sua sub-rede, e que repetir identificadores de VLAN em switches interligados une os domínios de broadcast e provoca conflito entre servidores DHCP. O DHCP automatizou a atribuição de endereços em Compras e Infraestrutura, desde que houvesse um servidor em cada VLAN. Por fim, a simulação mostrou que switches isolam o tráfego na camada 2 e que a comunicação entre sub-redes diferentes exige um dispositivo de camada 3, que o roteiro não inclui.

## Referências

*(Cite apenas as fontes que você de fato consultou; complete edição/ano dos livros conforme o seu exemplar.)*

- CISCO. *Cisco Packet Tracer* (software de simulação de redes).
- IEEE. *IEEE 802.1Q – Bridges and Bridged Networks* (VLANs e trunk).
- IETF. *RFC 791 – Internet Protocol*, 1981.
- IETF. *RFC 1918 – Address Allocation for Private Internets*, 1996.
- IETF. *RFC 2131 – Dynamic Host Configuration Protocol*, 1997.
- IETF. *RFC 4632 – Classless Inter-domain Routing (CIDR)*, 2006.
- KUROSE, J. F.; ROSS, K. W. *Redes de Computadores e a Internet: uma abordagem top-down*. Pearson. `[edição/ano]`
- TANENBAUM, A. S.; WETHERALL, D. *Redes de Computadores*. Pearson. `[edição/ano]`

## Anexo A – Tabela de endereçamento completa

Ver `tabela_enderecamento.md`.

