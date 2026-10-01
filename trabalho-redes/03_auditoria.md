# Auditoria final – v2 × PDF original (roteiro, 3 páginas)

Nada foi simulado no Packet Tracer. "Verificado por script" = `validar_projeto.py` lê `tabela_enderecamento.md`, `configs/*.txt`, `02_guia_execucao_packet_tracer.md` e `04_relatorio.md` e confere as regras (**173 verificações, 0 falhas** – `validacao_saida.txt`). Os arquivos `02` e `04` são gerados por `gerar_documentos.py` a partir do mesmo modelo da tabela e das configs.

## 1. Erro na v2?
**Nenhum erro de arquitetura, de cálculo ou de configuração foi encontrado.** A única pendência técnica da v2 continua sendo o que depende do simulador (modelo do switch com Gi0/1-2 e sintaxe de duas linhas de CLI), tratada no PASSO 0 e no PASSO 3 do guia. Durante esta etapa, o próprio script de verificação apontou duas falhas **na redação do guia novo** (contagem de dispositivos estáticos e uma frase sobre VLANs no `show vlan brief`); foram corrigidas antes do commit.

## 2. Requisito por requisito (texto do PDF → entrega)
| # | Texto do PDF | Entrega | Situação |
|---|---|---|---|
| 1 | "São 4 departamentos: Engenharia, Compras, TI Interno e Infraestrutura" | 4 departamentos com esses nomes: SW-ENG, SW-COMP, SW-TI, SW-INFRA | Atendido (script) |
| 2 | "20 estações, 2 servidores e 2 impressoras, totalizando 24 hosts" | Por switch: 20 PC + 2 impressoras + 2 servidores = 24; total 96 nomes distintos | Atendido (script) |
| 3 | "máscara de sub-rede que atenda a necessidade" | /27 por departamento (30 úteis ≥ 24) e /28 por VLAN (14 úteis ≥ 12) | Atendido; ambiguidade 3 |
| 4 | "A rede é de Classe C" | 192.168.10.0/24 | Atendido |
| 5 | "topologia estrela" | Cada departamento: 24 hosts ligados a um switch central (96 cabos retos). Entre switches: cadeia | Atendido; desenho entre switches é decisão (amb. 5) |
| 6 | "sequência nas sub-redes de acordo com a máscara" | IP = rede da VLAN + posição (+1…+12) | Atendido (script) |
| 7 | "rede seria de 227, o host de 25" | Lido como /27 e 2⁵; explicado no relatório (seção 2.2) | Ambiguidade 1 |
| 8 | "Descreva a rede, seu 1º IP válido, último IP válido e broadcast de cada Sub-Rede" | Tabelas 1 e 2 do relatório e `tabela_enderecamento.md`, para os 4 /27 e os 8 /28 | Atendido (script) |
| 9 | "switch 2950-24 ... para cada departamento, interligando eles entre si" | 4 switches; 3 enlaces trunk em Gi0/1-2 (cadeia) | Atendido com ressalva (modelo, amb. 6) |
| 10 | "Cada departamento deve estar em uma sub-rede" | 1 bloco /27 por departamento, sem sobreposição | Atendido (script) |
| 11 | "2 Vlan com 12 portas cada. Da 1-12 VLAN 1 e da 13-24 VLAN2" | Fa0/1-12 = 1ª VLAN, Fa0/13-24 = 2ª VLAN em cada switch | Atendido com ressalva (IDs 11/12…, amb. 2) |
| 12 | "10 estações, 1 impressora e um Servidor" por VLAN | Portas 1-10/11/12 e 13-22/23/24 (script) | Atendido |
| 13 | Engenharia e TI Interno com IPs estáticos | 48 dispositivos estáticos (24 + 24) | Atendido (script) |
| 14 | Compras e Infraestrutura dinâmicos, "de maneira que siga a sequência dos IPs estáticos" | PCs e impressoras em DHCP; pools começam em rede+1, máx. 11; servidores estáticos em rede+12 | Atendido no projeto; associação exata nome↔IP depende da ordem de requisição |
| 15 | "Instalar ... Simular a rede conforme o cenário descrito" | Guia final passo a passo | **Pendente: você executa** |
| 16 | "relatório ... introdução, métodos, resultados e conclusão" | `04_relatorio.md`: capa, identificação, introdução, métodos, desenvolvimento, resultados, conclusão, referências, com marcadores para evidências | Estrutura pronta; Resultados/Conclusão dependem da execução |

Comentário sobre o item 5: "topologia estrela" aplica-se aos departamentos; o PDF não descreve a interligação dos switches.

## 3. Auditoria matemática (conferível à mão)
- /28: 2⁴ = 16 endereços, 14 úteis ≥ 12. /27: 2⁵ = 32, 30 úteis ≥ 24. Um /28 sozinho (14) não comporta os 24 do departamento – por isso o agregado do departamento é /27.
- Máscaras: /27 = 255.255.255.224; /28 = 255.255.255.240.
- Alinhamento: /28 em 0, 16, 32, 48, 64, 80, 96, 112; /27 em 0, 32, 64, 96. Usado: 128 dos 256 endereços; livre: 192.168.10.128/25.
- Cada VLAN: 12 hosts nos offsets +1…+12; sobram +13 e +14. Pools de 11 endereços (10 PCs + 1 impressora) terminam em +11; servidor em +12.

## 4. Auditoria lógica
Cobre: contagem de dispositivos por switch e por VLAN; faixas de portas; IPs dentro do /28, sem rede/broadcast, únicos e sequenciais; 8 /28 sem sobreposição; 8 IDs de VLAN únicos; cada VLAN com portas em um único switch (sem domínio de broadcast compartilhado) e 1 servidor DHCP por VLAN; configs com 8 VLANs, VTP transparente, trunks apenas em Gi0/1-2 e nenhuma interface fora de Fa0/1-24; 3 enlaces, grafo conexo, sem laço; **guia:** 96 cabos corretos, 52 IPs estáticos idênticos à tabela, 4 pools idênticos, blocos de CLI idênticos a `configs/`, 31 testes coerentes com a tabela (sucesso ⇔ mesma /28), 43 prints numerados e figuras do relatório batendo com o checklist; **relatório:** dados do aluno presentes, seções obrigatórias, tabelas iguais à tabela de endereçamento, nenhuma saída de ping, nenhuma afirmação de execução.

## 5. Ambiguidades do PDF (decididas, não alteradas)
1. "227 / host de 25" → /27 e 2⁵.
2. "VLAN 1 / VLAN 2" literais ou "primeira/segunda VLAN" → primeira/segunda, com IDs exclusivos (11/12, 21/22, 31/32, 41/42), pois IDs repetidos em switches em trunk unem os departamentos e geram conflito DHCP.
3. Uma máscara ou duas → /27 para o departamento, /28 para cada VLAN; hosts com /28.
4. Sem roteador → não incluído; pings entre sub-redes falham por projeto e a interligação se comprova por `show interfaces trunk` e `show cdp neighbors`.
5. Desenho da interligação entre switches → cadeia ENG–COMP–TI–INFRA.
6. Modelo "2950-24" sem portas livres para interligação → 2950T-24 (plano B 2960-24TT), confirmado só no PASSO 0.
7. Gateway/DNS não definidos → vazios.

## 6. Limites declarados
Sintaxe de CLI e DHCP do Server-PT esperados, não testados; modelo do switch não confirmado dentro do PT; IPs de DHCP são previstos; nenhum `.pkt`, print ou ping foi produzido.
