# Auditoria requisito × entrega (v2)

Nada foi simulado no Packet Tracer. "Verificado por script" significa: `validar_projeto.py` leu `tabela_enderecamento.md` e `configs/*.txt` e conferiu as regras. Saída completa: `validacao_saida.txt` (**127 verificações, 0 falhas**).

## 1. O que mudou da v1 e por quê
| Problema da v1 | Correção |
|---|---|
| VLAN 1/2 repetidas nos 4 switches + trunk = domínio de broadcast compartilhado entre departamentos | IDs exclusivos (11/12, 21/22, 31/32, 41/42); cada VLAN só tem portas em 1 switch |
| 2 servidores DHCP concorrentes (Compras × Infra) | 1 servidor DHCP por VLAN, em VLANs distintas |
| 2 VLANs de um departamento na mesma sub-rede /27 | 1 sub-rede /28 por VLAN; as duas somam o /27 do departamento |
| Uplinks Gi0/1-2 assumidos sem checagem | Modelo 2950T-24 + passo 0 de verificação no guia (ainda **não confirmado no PT**) |
| Solução de teste "desligar trunks" | Removida; trunks permanecem ligados em todos os cenários |

## 2. Auditoria matemática (conferível à mão)
- /28: 2⁴ = 16 endereços, 16 − 2 = **14 úteis ≥ 12** hosts por VLAN ✔. /29 (6) não serve.
- /27: 2⁵ = 32, **30 úteis ≥ 24** por departamento ✔; /28 sozinho (14) **não** serve para 24 – por isso o agregado do departamento é /27 ✔.
- Máscaras: /27 = 255.255.255.224 (256 − 32); /28 = 255.255.255.240 (256 − 16) ✔.
- 4 × /27 = 128 endereços de 256; 8 × /28 = 128; sobra 192.168.10.128/25 ✔.
- Alinhamento: cada /28 começa em múltiplo de 16 (0, 16, 32, 48, 64, 80, 96, 112) e cada /27 em múltiplo de 32 ✔.
- Hosts por VLAN: 10 + 1 + 1 = 12 → IPs +1…+12, sobram +13 e +14 ✔. Hosts por departamento: 20 + 2 + 2 = 24; total 96 ✔.
- Pools: 10 PCs + 1 impressora = 11 clientes por VLAN; Start IP = rede+1, max 11 → rede+1…rede+11; servidor em rede+12, fora do pool ✔.

## 3. Auditoria lógica (script)
Por switch: 24 portas Fa0/1-24; 20 PC/2 impressoras/2 servidores; exatamente 2 VLANs; 1ª VLAN = portas 1-12 e 2ª = 13-24; cada VLAN com 10+1+1; IPs dentro do /28, sem rede/broadcast, distintos e sequenciais; Engenharia/TI 100% estáticos; Compras/Infra com só servidores estáticos e pool == exatamente os clientes DHCP; servidor DHCP fora do pool.
Global: 96 IPs distintos; 8 /28 sem sobreposição e dentro de 192.168.10.0/24; 8 IDs de VLAN únicos; cada VLAN com portas de acesso em um único switch; 4 servidores DHCP em 4 VLANs distintas; configs com VTP transparente, 8 VLANs, portas 1-12/13-24 na VLAN correta, trunks em Gi0/1-2 permitindo as 8 VLANs, nenhuma interface fora de Fa0/1-24 e Gi0/1-2; 3 enlaces, uplinks sem uso duplicado, grafo conexo e sem laço.

## 4. Requisito × situação
| Req. | Situação | Observação |
|---|---|---|
| R1 Packet Tracer | **Pendente (você)** | Não há PT aqui |
| R2/R3 4 deptos, 24 hosts | Atendido no projeto | verificado por script |
| R4 máscara que atenda | Atendido | /27 (depto) e /28 (VLAN); ambiguidade 3 |
| R5 Classe C, estrela | Atendido | 192.168.10.0/24; estrela por departamento |
| R6/R7 sequência, 1º/último/broadcast | Atendido | tabela_enderecamento.md |
| R8 2950-24 por depto, interligados | Atendido com ressalva | 2950T-24 por causa das Gi; confirmar no PT |
| R9 sub-rede por depto | Atendido | /27 por depto |
| R10 VLANs 1-12 / 13-24 | Atendido com ressalva | portas corretas; IDs 11/12… e não 1/2 (ambiguidade 2) |
| R11 10+1+1 por VLAN | Atendido | verificado por script |
| R12 estático Eng/TI | Atendido | |
| R13 DHCP Compras/Infra em sequência | Atendido no projeto | DHCP em servidores; porta↔IP exato depende da ordem de requisição |
| R14 relatório | Rascunho pronto | Resultados e Conclusão dependem dos seus testes |
| Pings, .pkt, prints | **Não realizados** | guia 02 |

## 5. Limitações declaradas
1. Nada foi executado em PT: sintaxe de CLI (`vtp mode transparent`, `trunk allowed vlan`) e o comportamento do DHCP do Server-PT são esperados, não testados.
2. Modelo do switch não confirmado dentro do PT (site oficial inacessível a partir daqui).
3. Sem roteador (por não estar no PDF): pings entre VLANs/departamentos **falham por projeto**.
4. VLANs com IDs 11…42 em vez de 1 e 2: decisão técnica explicada, não literal.
