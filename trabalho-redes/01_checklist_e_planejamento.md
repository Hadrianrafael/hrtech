# Super Tech – Checklist extraído do roteiro e planejamento (v2, aprovada como base)

> **v2.** A versão 1 reutilizava VLAN 1/2 nos quatro switches, com trunks, e colocava as duas VLANs de um departamento na mesma sub-rede. Isso criava domínio de broadcast compartilhado entre departamentos, conflito entre os servidores DHCP de Compras e Infraestrutura e duas VLANs sem separação IP. Esta versão corrige os três problemas (seção 3).

## 1. Checklist (somente o que está no PDF)
- [ ] R1. Usar o Cisco Packet Tracer (checklist do roteiro: instalar e simular o cenário).
- [ ] R2. 4 departamentos: Engenharia, Compras, TI Interno, Infraestrutura.
- [ ] R3. Cada departamento: 20 estações + 2 servidores + 2 impressoras = 24 hosts.
- [ ] R4. Máscara de sub-rede que atenda à necessidade apresentada.
- [ ] R5. Rede Classe C, topologia estrela.
- [ ] R6. Numeração IP em sequência nas sub-redes, de acordo com a máscara adotada.
- [ ] R7. Descrever cada sub-rede: 1º IP válido, último IP válido e broadcast.
- [ ] R8. Um switch Cisco 2950-24 por departamento, interligados entre si.
- [ ] R9. Cada departamento em uma sub-rede.
- [ ] R10. Em cada sub-rede, 2 VLANs com 12 portas cada: portas 1-12 = VLAN 1; 13-24 = VLAN 2.
- [ ] R11. Cada VLAN: 10 estações, 1 impressora, 1 servidor.
- [ ] R12. Engenharia e TI Interno: IPs estáticos.
- [ ] R13. Compras e Infraestrutura: IPs dinâmicos, seguindo a sequência dos IPs estáticos.
- [ ] R14. Relatório com introdução, métodos, resultados e conclusão.

Itens que vêm da mensagem do aluno, não do PDF: tabela de endereçamento, testes de ping, auditoria. **Nenhum requisito foi acrescentado ao projeto** (não há roteador, ACL, gateway, SVI, DNS, etc.).

## 2. Interpretação de "rede seria de 227, host de 25"
Tecnicamente inconsistente: 227 não é octeto de máscara válido (só 0, 128, 192, 224, 240, 248, 252, 254, 255), e "25" não é uma quantidade de hosts. Lido como **/27 e 2⁵**: com 5 bits de host há 32 endereços, 30 úteis (2⁵ − 2) ≥ 24. Por isso o **agregado de cada departamento é um /27**.

## 3. Duas interpretações analisadas

### A) Interpretação literal
Cada switch com VLAN 1 (portas 1-12) e VLAN 2 (13-24), IDs iguais nos 4 switches, o departamento inteiro em um /27.
- **A1 – switches em trunk com VLAN 1/2:** a VLAN 1 vira um único domínio L2 com os 4 departamentos (o mesmo para a VLAN 2). Os departamentos deixam de estar separados (viola R9), os dois servidores DHCP (Compras e Infra) respondem aos mesmos broadcasts e as sub-redes se misturam.
- **A2 – VLAN 1/2 sem atravessar os links:** elimina o conflito, mas só "interliga" o cabo. Foi descartada por você.
- **Problema comum a A1 e A2:** VLAN 1 e VLAN 2 do mesmo departamento na mesma sub-rede /27. São dois domínios de broadcast para um único prefixo IP: um PC da VLAN 1 considera "local" um endereço que está na VLAN 2 e faz ARP que nunca chega lá. Tecnicamente incorreto.

### B) Implementação tecnicamente correta (**escolhida**)
- **Uma sub-rede IP por VLAN**: cada VLAN de 12 hosts recebe um **/28** (14 úteis). Duas VLANs /28 ocupam exatamente o /27 do departamento, então R9 e R10 continuam valendo (departamento = /27; VLAN = /28).
- **IDs de VLAN exclusivos por departamento**: a "primeira VLAN" (portas 1-12) e a "segunda VLAN" (13-24) de cada switch são, respectivamente: Engenharia 11 e 12; Compras 21 e 22; TI 31 e 32; Infraestrutura 41 e 42 (dezena = departamento, unidade = 1ª/2ª VLAN).
- **Trunks 802.1Q** entre os switches, com as 8 VLANs permitidas e o mesmo banco de VLANs nos 4 switches (VTP transparente). Cada VLAN só tem portas de acesso em **um** switch, então o trunk não cria domínio de broadcast compartilhado entre departamentos.
- **DHCP:** um servidor DHCP por VLAN (cada VLAN já tem 1 servidor) dentro da própria VLAN, sem relay. Como as VLANs 21/22/41/42 são distintas e cada uma tem exatamente um servidor DHCP, não há conflito.

**Por que B:** é a única que satisfaz ao mesmo tempo seus pontos 1 a 8 sem desligar trunks. A única "liberdade" tomada em relação ao texto é o número das VLANs (ver ambiguidade 2).

## 4. Ambiguidades do enunciado e decisões
1. **"227 / host de 25"** – lido como /27 e 2⁵ (seção 2).
2. **"VLAN 1" e "VLAN 2" em todos os departamentos.** O texto não diz se são IDs literais ou apenas "a primeira e a segunda VLAN". IDs literais repetidos em 4 switches interligados contradizem a separação dos departamentos (A1). Adotado: primeira/segunda VLAN, com IDs únicos. Se o professor exigir os números 1 e 2 literais, não existe configuração que satisfaça isso e a separação sem desligar os trunks; nesse caso a defesa é este item.
3. **Qual máscara?** O roteiro fala em "uma máscara". Aqui há duas, ambas explicadas: /27 para o departamento (24 hosts, R4/R9) e /28 para cada VLAN (12 hosts). Os **hosts são configurados com 255.255.255.240 (/28)**.
4. **Roteador.** O PDF não prevê roteador nem L3. Não foi acrescentado. Consequência (esperada e correta): sem L3, não há comunicação entre VLANs nem entre departamentos; **pings entre sub-redes distintas falham**. Os trunks deixam a infraestrutura L2 pronta, mas nenhum tráfego de dados precisa atravessá-los neste escopo. A interligação é comprovada por `show interfaces trunk` e `show cdp neighbors`, não por ping.
5. **Topologia entre switches.** "Interligando eles entre si" não define o desenho. Adotada cadeia ENG–COMP–TI–INFRA (3 enlaces, sem laço, sem STP relevante), usando as duas portas Gigabit; cada departamento é uma estrela.
6. **Modelo do switch e portas.** Um 2950-24 tem 24 portas FastEthernet; usando todas para hosts não sobra porta para interligar. O **2950T-24** (mesma família, 24 Fast + 2 Gigabit) tem Gi0/1 e Gi0/2. Fontes consultadas indicam isso, mas **não consegui abrir o Packet Tracer neste ambiente**; confirme no passo 0 do guia. O PASSO 0 do guia testa o 2950T-24 no seu PT; se ele não tiver Gi0/1-2, o plano B é o **2960-24TT** (Fa0/1-24 + Gi0/1-2, mesmos nomes de interface, mesmos comandos) – outra família, a declarar no relatório.
7. **Servidores DHCP.** Os "2 servidores" do departamento são Server-PT; em Compras/Infra, o de cada VLAN roda o serviço DHCP, com IP estático. PCs e impressoras usam DHCP.
8. **Gateway/DNS** não definidos no PDF: ficam vazios/0.0.0.0.

## 5. Plano lógico
Bloco **192.168.10.0/24**, quatro /27 (sobra 192.168.10.128/25 livre):

| Departamento | /27 | VLAN (portas 1-12) | /28 | VLAN (portas 13-24) | /28 |
|---|---|---|---|---|---|
| Engenharia (estático) | .0/27 | 11 | .0/28 | 12 | .16/28 |
| Compras (DHCP) | .32/27 | 21 | .32/28 | 22 | .48/28 |
| TI Interno (estático) | .64/27 | 31 | .64/28 | 32 | .80/28 |
| Infraestrutura (DHCP) | .96/27 | 41 | .96/28 | 42 | .112/28 |

Por VLAN: portas +1…+10 PCs, +11 impressora, +12 servidor (relativo ao endereço de rede do /28). Detalhes por porta, máscaras, 1º/último IP e broadcast: `tabela_enderecamento.md` (gerada por `gerar_projeto.py` e checada por `validar_projeto.py`).

Cadeia de switches: SW-ENG Gi0/1 – SW-COMP Gi0/1; SW-COMP Gi0/2 – SW-TI Gi0/1; SW-TI Gi0/2 – SW-INFRA Gi0/1.
