# Auditoria requisito × entrega

Legenda: **Projetado** = definido/configs prontas, ainda não executado no PT. Nada aqui foi simulado.

| Req. | Situação | Onde |
|---|---|---|
| R1 Packet Tracer | **Pendente (você)** – PT indisponível aqui | guia 02 |
| R2/R3 4 deptos, 24 hosts | Projetado | tabela_enderecamento.md |
| R4/R5 máscara, Classe C, estrela | Projetado (/27, 192.168.10.0) | 01 |
| R6/R7 sequência, 1º/último/broadcast | Atendido no papel (validado por script) | tabela |
| R8 2950-24 por depto, interligados | Projetado (ver risco 4: uplinks) | configs/, 02 |
| R9 sub-rede por depto | Projetado | tabela |
| R10/R11 VLANs 1-12 / 13-24, 10+1+1 | Projetado | configs/, tabela |
| R12 estático Eng/TI | Projetado | tabela |
| R13 dinâmico Compras/Infra em sequência | Projetado (DHCP nos servidores) | 02 |
| R14 relatório | Rascunho pronto; **Resultados dependem dos seus testes** | 04_relatorio.md |
| Testes de ping, .pkt, screenshots | **Não realizados** | 02 |

Ambiguidades: ver itens 1–6 em 01_checklist_e_planejamento.md (principalmente ausência de roteador e conflito DHCP).
