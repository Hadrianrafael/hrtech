# Auditoria final – projeto Super Tech × roteiro original

## 1. Resultado dos validadores
- `validar_projeto.py`: **207 verificações, 0 falhas** (saída completa em `validacao_saida.txt`).
- O validador lê os arquivos gerados (`tabela_enderecamento.md`, `configs/*.txt`, `projeto.json`, `02_guia_execucao_packet_tracer.md`, `04_relatorio.md` e `entrega/`) e confere, entre outros pontos: contagem de dispositivos por switch e por VLAN; faixas de portas; IPs dentro do /28 e sem rede/broadcast; 96 IPs distintos; 8 sub-redes /28 sem sobreposição dentro de 192.168.10.0/24; 8 identificadores de VLAN únicos e cada VLAN com portas em um só switch; pools DHCP idênticos aos clientes e fora do IP do servidor; configs com 8 VLANs, portas de acesso corretas e trunks só em Gi0/1-2; 3 enlaces conexos e sem laço; coerência entre `projeto.json`, tabela, guia, relatório e configs (96 cabos, 52 IPs estáticos, 4 pools, 31 testes, Anexos A e B); busca de placeholders, marcadores de pendência, textos de rascunho e referências a Figuras 2–20 ou a modelo de switch descartado; DOCX com a Figura 1 embutida e sem vínculos externos; PDF com os dados do aluno e as seções.
- `gerar_projeto.py` e `gerar_documentos.py` regeneram tabela, configs, guia, relatório e `entrega/` a partir do mesmo modelo.

## 2. Requisito por requisito (roteiro × entrega)
| # | Requisito do PDF | Entrega | Situação |
|---|---|---|---|
| 1 | 4 departamentos (Engenharia, Compras, TI Interno, Infraestrutura) | Relatório 2.1 e Tabela 1; um switch por departamento | Atendido |
| 2 | 20 estações + 2 servidores + 2 impressoras = 24 hosts por departamento | Tabela 1; Anexo A (96 dispositivos) | Atendido |
| 3 | Máscara que atenda à necessidade | /27 por departamento, /28 por VLAN (seção 2.2) | Atendido |
| 4 | Classe C, topologia estrela | 192.168.10.0/24; estrela por departamento | Atendido |
| 5 | Numeração em sequência | Posições +1…+12 por VLAN (Tabela 7; Anexo A) | Atendido |
| 6 | Descrever 1º IP, último IP e broadcast de cada sub-rede | Tabelas 5 e 6 | Atendido |
| 7 | Switch 2950-24 por departamento, interligados | 2960-24TT, verificado no Packet Tracer (Figura 1); enlaces na Tabela 3 | Atendido com interpretação (ambiguidade 6) |
| 8 | Cada departamento em uma sub-rede | Um /27 por departamento | Atendido |
| 9 | 2 VLANs com 12 portas: 1-12 e 13-24 | Tabela 2; Anexo B | Atendido com interpretação (ambiguidade 2: IDs 11/12, 21/22, 31/32, 41/42) |
| 10 | 10 estações, 1 impressora e 1 servidor por VLAN | Tabela 2; Anexo A | Atendido |
| 11 | Engenharia e TI Interno com IP estático | Seção 3.2; Anexo A | Atendido |
| 12 | Compras e Infraestrutura com IP dinâmico, em sequência | Seção 3.3; Tabela 4 (pools) | Atendido no projeto |
| 13 | Relatório: introdução, métodos, resultados e conclusão | `04_relatorio.md`, `.docx` e `.pdf` | Atendido |
| 14 | Instalar o Packet Tracer e simular a rede | Projeto e configs prontos; guia de montagem; modelo verificado no simulador | **Simulação completa não executada (ver seção 4)** |

## 3. Auditoria matemática (conferível à mão)
- /28: 2⁴ = 16 endereços, 14 úteis ≥ 12 hosts por VLAN. /27: 2⁵ = 32, 30 úteis ≥ 24 hosts por departamento. Um /28 sozinho (14) não comporta os 24 do departamento.
- Máscaras: /27 = 255.255.255.224; /28 = 255.255.255.240.
- Alinhamento: /28 em 0, 16, 32, 48, 64, 80, 96, 112; /27 em 0, 32, 64, 96. Usados 128 dos 256 endereços; livre 192.168.10.128/25.
- Por VLAN: 12 hosts nas posições +1…+12 (sobram +13 e +14). Pools DHCP de 11 endereços (10 PCs + 1 impressora), servidor na posição +12, fora do pool. Total: 4 × 24 = 96 hosts.

## 4. Pendências reais
1. **Simulação completa no Packet Tracer não foi executada.** Não existe `SuperTech.pkt`, e não há resultados de ping, de DHCP nem saídas dos comandos `show`. O relatório não afirma que a simulação foi feita: apresenta o projeto, as configurações, a verificação de consistência por script, o comportamento esperado e o plano de verificação (Anexo C). O roteiro pede "simular a rede conforme o cenário descrito"; se o professor exigir o arquivo `.pkt` ou evidências de execução, é preciso montar a rede seguindo `02_guia_execucao_packet_tracer.md` e acrescentar o resultado ao relatório.
2. Nenhuma outra pendência técnica: o que existe no repositório foi verificado.

## 5. Arquivos para entrega
- `entrega/Relatorio_SuperTech.pdf` e/ou `entrega/Relatorio_SuperTech.docx`: relatório completo, com capa, as cinco seções, referências e os Anexos A (endereçamento por porta), B (configurações dos switches) e C (plano de verificação).
- Opcionais: `configs/SW-ENG.txt`, `SW-COMP.txt`, `SW-TI.txt`, `SW-INFRA.txt` (as mesmas configurações do Anexo B) e `tabela_enderecamento.md`.
- Arquivos de trabalho, não destinados à entrega: `01_checklist_e_planejamento.md`, `02_guia_execucao_packet_tracer.md` (procedimento para montar a rede), este arquivo, `validacao_saida.txt`, `projeto.json` e os scripts `gerar_*.py` e `validar_projeto.py`.
