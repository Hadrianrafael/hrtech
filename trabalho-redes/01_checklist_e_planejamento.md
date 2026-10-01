# Super Tech – Checklist extraído do roteiro e planejamento

## Checklist (somente o que está no PDF)
- [ ] R1. Usar o Cisco Packet Tracer (checklist do roteiro: instalar e simular o cenário).
- [ ] R2. 4 departamentos: Engenharia, Compras, TI Interno, Infraestrutura.
- [ ] R3. Cada departamento: 20 estações + 2 servidores + 2 impressoras = 24 hosts.
- [ ] R4. Máscara de sub-rede que comporte os 24 hosts.
- [ ] R5. Rede Classe C, topologia estrela.
- [ ] R6. Numeração IP em sequência dentro das sub-redes, de acordo com a máscara.
- [ ] R7. Descrever cada sub-rede: 1º IP válido, último IP válido e broadcast.
- [ ] R8. Um switch Cisco 2950-24 por departamento, interligados entre si.
- [ ] R9. Cada departamento em uma sub-rede própria.
- [ ] R10. Em cada sub-rede, 2 VLANs de 12 portas: portas 1-12 = VLAN 1; 13-24 = VLAN 2.
- [ ] R11. Cada VLAN: 10 estações, 1 impressora, 1 servidor.
- [ ] R12. Engenharia e TI Interno: IPs estáticos.
- [ ] R13. Compras e Infraestrutura: IPs dinâmicos, seguindo a sequência dos IPs estáticos.
- [ ] R14. Relatório com introdução, métodos, resultados e conclusão.

(Os demais itens do pedido – tabela, testes de ping, auditoria – vêm da sua mensagem, não do PDF.)

## Interpretação do trecho "rede seria de 227, host de 25"
Tecnicamente inconsistente: 227 não é máscara válida (um octeto de máscara só pode ser 0, 128, 192, 224, 240, 248, 252, 254 ou 255) e "host de 25" não é uma quantidade que se obtenha com bits inteiros.
Interpretação adotada: **/27** (255.255.255.224) → **5 bits de host** (2^5 = 32 endereços, 30 úteis). É o menor bloco que comporta 24 hosts (/28 daria só 14; /26 desperdiçaria). O "227" do roteiro é lido como o "/27" e o "25" como "2^5". Sobram 6 endereços livres por sub-rede.

## Plano lógico
- Bloco: 192.168.10.0/24 (Classe C) dividido em /27; usadas as 4 primeiras (.0, .32, .64, .96); as 4 restantes (.128–.255) ficam livres para crescimento.
- Em cada departamento, a posição do host na sub-rede segue o número da porta: porta N → endereço rede+N (sequência pedida em R6/R13).
- Portas por VLAN: Fa0/1-10 PCs, Fa0/11 impressora, Fa0/12 servidor (VLAN 1); Fa0/13-22 PCs, Fa0/23 impressora, Fa0/24 servidor (VLAN 2).
- Detalhes: ver `tabela_enderecamento.md` (gerada e validada por script).
- Interligação: cadeia SW-ENG Gi0/1 ↔ Gi0/1 SW-COMP; SW-COMP Gi0/2 ↔ Gi0/1 SW-TI; SW-TI Gi0/2 ↔ Gi0/1 SW-INFRA, em trunk. Cada departamento é uma estrela (hosts → switch). Usam-se as portas Gigabit para não consumir as 24 portas de hosts.
- DHCP (Compras e Infra): como VLANs separam o broadcast, cada VLAN usa **o servidor dela** como servidor DHCP (IP do servidor estático): pool VLAN 1 = endereços das portas 1-11; pool VLAN 2 = portas 13-23. Servidores ficam nas portas 12 e 24 (.12/.24 relativos).

## Pontos ambíguos / riscos técnicos (leia antes de executar)
1. **"227 / host de 25"** – tratado acima.
2. **Sem roteador no roteiro.** VLAN 1 e VLAN 2 do mesmo departamento usam a mesma sub-rede, mas VLANs diferentes são domínios de broadcast separados: sem roteador, PC da VLAN 1 **não pingará** PC da VLAN 2, e departamentos (sub-redes diferentes) não se comunicam entre si. O roteiro não pede roteador, então não o incluí; ping esperado só dentro da mesma VLAN. Se o professor exigir comunicação entre VLANs/departamentos, é preciso acrescentar um roteador (fora do escopo do PDF).
3. **Conflito de DHCP entre switches interligados.** Com VLAN 1/2 em trunk, o broadcast DHCP da VLAN 1 de Compras chega à VLAN 1 de Infra (mesmo domínio L2), e os dois servidores DHCP responderiam a ambos. Sugestão: validar o DHCP primeiro com os trunks desligados (`shutdown` nas Gi), depois ligar. Para eliminar o problema sem roteador seria preciso IDs de VLAN distintos por departamento, o que contradiz "VLAN 1 / VLAN 2" do PDF – decisão sua/do professor.
4. **Portas de uplink.** Os 24 hosts ocupam as 24 portas Fast. O 2950-24 do PT pode não ter Gi0/1-2 (o 2950T-24 tem). Confira; se faltar, use o 2950T-24 ou ajuste a interface nos arquivos de config.
5. "Impressora/servidor" no PT: usar *Printer-PT* e *Server-PT*; estações como *PC-PT*.
6. Gateway/DNS: o roteiro não define; ficam em branco/0.0.0.0.
