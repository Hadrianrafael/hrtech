# Super Tech – Checklist do roteiro e planejamento

## 1. Requisitos do roteiro (somente o que está no PDF)

| # | Requisito | Onde é atendido |
|---|---|---|
| R1 | Usar o Cisco Packet Tracer (instalar e simular o cenário) | Projeto e configurações preparados para o Packet Tracer; modelo de switch verificado no simulador (Figura 1); procedimento de montagem em `02_guia_execucao_packet_tracer.md` |
| R2 | 4 departamentos: Engenharia, Compras, TI Interno e Infraestrutura | Relatório, seções 2.1 e 3.1 (Tabela 1) |
| R3 | 20 estações + 2 servidores + 2 impressoras = 24 hosts por departamento | Tabela 1; Anexo A |
| R4 | Máscara de sub-rede que atenda à necessidade | Relatório, seção 2.2: /27 por departamento e /28 por VLAN |
| R5 | Rede Classe C e topologia estrela | 192.168.10.0/24; uma estrela por departamento (seção 3.1) |
| R6 | Numeração IP em sequência, de acordo com a máscara | Posição na VLAN = último octeto relativo (Tabela 7; Anexo A) |
| R7 | 1º IP válido, último IP válido e broadcast de cada sub-rede | Tabelas 5 e 6 |
| R8 | Switch 2950-24 por departamento, interligados entre si | 2960-24TT (ver ambiguidade 6); enlaces na Tabela 3 |
| R9 | Cada departamento em uma sub-rede | Um /27 por departamento (Tabela 5) |
| R10 | 2 VLANs de 12 portas: portas 1-12 e 13-24 | Tabela 2; configs em `configs/` e Anexo B |
| R11 | Cada VLAN com 10 estações, 1 impressora e 1 servidor | Tabela 2; Anexo A |
| R12 | Engenharia e TI Interno com IP estático | Seção 3.2; Anexo A |
| R13 | Compras e Infraestrutura com IP dinâmico, seguindo a sequência dos estáticos | Seção 3.3; Tabela 4 |
| R14 | Relatório com introdução, métodos, resultados e conclusão | `04_relatorio.md` (e `entrega/Relatorio_SuperTech.docx` e `.pdf`) |

Nada além disso foi acrescentado ao projeto: não há roteador, ACL, gateway, SVI nem DNS.

## 2. Interpretação de "rede seria de 227, host de 25"
O trecho é tecnicamente inconsistente: 227 não é octeto de máscara válido (só 0, 128, 192, 224, 240, 248, 252, 254 e 255) e 25 não é quantidade de hosts. Foi lido como **/27 e 2⁵**: 5 bits de host dão 32 endereços, 30 úteis (2⁵ − 2), suficientes para 24 hosts. O agregado de cada departamento é, portanto, um /27.

## 3. Duas interpretações analisadas

**A) Literal.** Cada switch com VLAN 1 (portas 1-12) e VLAN 2 (13-24), mesmos identificadores nos quatro switches, departamento inteiro em um /27.
- Com os switches em trunk, a VLAN 1 passa a ser um único domínio de broadcast com os quatro departamentos (e a VLAN 2 também): os departamentos deixam de estar separados e os servidores DHCP de Compras e Infraestrutura respondem aos mesmos pedidos.
- Impedir que as VLANs atravessem os enlaces eliminaria o conflito, mas deixaria os switches interligados só fisicamente.
- Em qualquer variante, duas VLANs no mesmo /27 formam dois domínios de broadcast para um único prefixo IP, o que é incorreto.

**B) Tecnicamente correta (adotada).**
- Uma sub-rede IP por VLAN: /28 (14 úteis) para 12 hosts. Os dois /28 de um departamento formam o seu /27.
- Identificadores de VLAN exclusivos por departamento, mantendo a divisão das portas 1-12 e 13-24: Engenharia 11 e 12, Compras 21 e 22, TI Interno 31 e 32, Infraestrutura 41 e 42.
- Trunks 802.1Q entre os switches, com o mesmo banco de VLANs nos quatro (VTP transparente); cada VLAN tem portas de acesso em um único switch, então não há domínio de broadcast compartilhado.
- Um servidor DHCP por VLAN, na própria VLAN, sem relay.

## 4. Ambiguidades do enunciado e decisões
1. **"227 / host de 25"**: lido como /27 e 2⁵.
2. **"VLAN 1" e "VLAN 2"**: o texto não diz se são números literais. Adotada a leitura "primeira e segunda VLAN", com identificadores exclusivos. Com números repetidos em switches interligados não existe configuração que mantenha os departamentos separados sem impedir as VLANs de atravessar os enlaces.
3. **Quantas máscaras**: o roteiro fala em "uma máscara". São duas, ambas justificadas: /27 para o departamento e /28 para cada VLAN. Os hosts usam /28 (255.255.255.240).
4. **Roteador**: o PDF não prevê roteador nem camada 3, e não foi acrescentado. Por consequência, VLANs diferentes e departamentos diferentes não se comunicam.
5. **Desenho da interligação**: o enunciado não define; adotada a cadeia ENG–COMP–TI–INFRA (3 enlaces, sem laços).
6. **Modelo do switch**: um 2950-24 não deixa porta livre para a interligação (as 24 portas são dos hosts). Foi adotado o **2960-24TT**, verificado no Packet Tracer: Fa0/1-24, Gi0/1, Gi0/2 e Vlan1 (Figura 1).
7. **Servidores DHCP**: os "2 servidores" de cada departamento são Server-PT; em Compras e Infraestrutura, o de cada VLAN executa o DHCP com IP estático.
8. **Gateway e DNS**: não definidos no PDF; ficam vazios.

## 5. Plano lógico
Bloco 192.168.10.0/24, quatro /27 (192.168.10.128/25 fica livre):

| Departamento | /27 | 1ª VLAN (portas 1-12) | /28 | 2ª VLAN (portas 13-24) | /28 | Endereços |
|---|---|---|---|---|---|---|
| Engenharia | .0/27 | 11 | .0/28 | 12 | .16/28 | estático |
| Compras | .32/27 | 21 | .32/28 | 22 | .48/28 | DHCP |
| TI Interno | .64/27 | 31 | .64/28 | 32 | .80/28 | estático |
| Infraestrutura | .96/27 | 41 | .96/28 | 42 | .112/28 | DHCP |

Por VLAN: posições +1 a +10 para PCs, +11 impressora e +12 servidor (relativas ao endereço da rede /28). Interligação: SW-ENG Gi0/1 – SW-COMP Gi0/1; SW-COMP Gi0/2 – SW-TI Gi0/1; SW-TI Gi0/2 – SW-INFRA Gi0/1.
