# Projeto de Rede da Empresa Super Tech no Cisco Packet Tracer

**Disciplina:** Redes de Computadores — **Aluno:** [nome] — **Data:** [data]

## 1. Introdução
Uma rede de computadores é um conjunto de dispositivos interligados que trocam dados por meio de meios de transmissão e de protocolos comuns. Neste trabalho cada departamento foi montado em **topologia estrela**: todos os equipamentos se ligam a um ponto central, que aqui é um **switch**. O switch trabalha na camada de enlace, aprende os endereços MAC e encaminha os quadros apenas para a porta de destino. A vantagem da estrela é que o defeito em um cabo afeta só um equipamento; a desvantagem é a dependência do ponto central.

O endereçamento usa **IPv4**, com 32 bits divididos em parte de rede e parte de host por uma máscara. Em uma rede Classe C (máscara padrão /24) é possível criar sub-redes (**subnetting**) emprestando bits da parte de host; cada sub-rede tem 2ⁿ − 2 endereços úteis, pois o primeiro é o endereço da rede e o último é o de broadcast. As **VLANs** dividem logicamente um switch em domínios de broadcast independentes e, por boa prática, cada VLAN corresponde a uma sub-rede IP própria. O **DHCP** entrega endereços automaticamente a partir de uma faixa configurada em um servidor; como o pedido do cliente é um broadcast, ele só alcança servidores da mesma VLAN, a menos que haja um agente de relay.

A atividade simula, no **Cisco Packet Tracer**, a rede da empresa fictícia Super Tech, para praticar subnetting, VLANs e a distribuição estática e dinâmica de endereços.

## 2. Métodos
**Equipamentos.** 4 switches Cisco (modelo 2950T-24, justificado adiante) e, por departamento, 20 PCs, 2 servidores e 2 impressoras, totalizando 96 hosts.

**Cálculo das sub-redes.** Cada departamento tem 24 hosts, e cada VLAN, 12. Com 5 bits de host (/27) há 30 endereços úteis, suficientes para 24; com 4 bits (/28) há 14, suficientes para 12 mas não para 24. O enunciado fala em "rede seria de 227, host de 25"; como 227 não é uma máscara válida, a leitura adotada foi /27 e 2⁵. A partir do bloco 192.168.10.0/24 foram reservados quatro blocos /27, um por departamento, e cada um foi dividido em dois /28, um por VLAN (Tabela 1). Os hosts usam a máscara 255.255.255.240.

**VLANs.** Em cada switch, as portas Fa0/1–12 formam a primeira VLAN e as Fa0/13–24, a segunda, cada uma com 10 PCs, 1 impressora e 1 servidor. Como os switches são interligados por trunk, repetir os números 1 e 2 em todos os departamentos faria cada VLAN atravessar todos os switches, juntando os departamentos em um único domínio de broadcast e colocando dois servidores DHCP na mesma rede. Por isso as VLANs receberam números exclusivos (Engenharia 11 e 12, Compras 21 e 22, TI Interno 31 e 32, Infraestrutura 41 e 42), mantendo a divisão 1–12 e 13–24 pedida no roteiro. Esta é uma interpretação do enunciado, que não deixa claro se os números 1 e 2 são literais.

**Interligação.** Os switches foram ligados em cadeia (Engenharia – Compras – TI – Infraestrutura) por trunks 802.1Q nas portas Gigabit. As 24 portas Fast Ethernet já são ocupadas pelos hosts, e o 2950-24 comum não tem portas Gigabit; por isso foi usado o 2950T-24 (mesma família, com 2 portas Gigabit). *[Confirmar no seu Packet Tracer e ajustar este parágrafo conforme o que o programa mostrar.]* O banco de VLANs é o mesmo nos quatro switches, com VTP em modo transparente, e cada VLAN só possui portas de acesso em um switch.

**IPs.** Engenharia e TI Interno: todos os dispositivos com IP estático, seguindo a posição na VLAN. Compras e Infraestrutura: servidores com IP estático e serviço DHCP ativo, um por VLAN; PCs e impressoras em DHCP, com pools em sequência (Start IP = rede + 1, máximo de 11 endereços). Os comandos estão em `configs/` e o passo a passo, em `02_guia_execucao_packet_tracer.md`.

## 3. Resultados
**Tabela 1 – Sub-redes** (/27 = 255.255.255.224; /28 = 255.255.255.240)

| Departamento | Bloco /27 | VLAN | Rede /28 | 1º IP | Último IP | Broadcast |
|---|---|---|---|---|---|---|
| Engenharia | 192.168.10.0/27 | 11 | 192.168.10.0/28 | .1 | .14 | .15 |
| | | 12 | 192.168.10.16/28 | .17 | .30 | .31 |
| Compras | 192.168.10.32/27 | 21 | 192.168.10.32/28 | .33 | .46 | .47 |
| | | 22 | 192.168.10.48/28 | .49 | .62 | .63 |
| TI Interno | 192.168.10.64/27 | 31 | 192.168.10.64/28 | .65 | .78 | .79 |
| | | 32 | 192.168.10.80/28 | .81 | .94 | .95 |
| Infraestrutura | 192.168.10.96/27 | 41 | 192.168.10.96/28 | .97 | .110 | .111 |
| | | 42 | 192.168.10.112/28 | .113 | .126 | .127 |

O endereçamento por porta e os pools DHCP estão no Anexo A (`tabela_enderecamento.md`). A conferência matemática e lógica do projeto, feita por script, está em `03_auditoria.md`.

**Testes de conectividade:** *[PREENCHER com a saída real de `show vlan brief`, `show interfaces trunk`, `show cdp neighbors`, `ipconfig` e dos pings. Não registrar resultado que não tenha sido obtido no simulador.]*
Comportamento previsto pelo projeto: ping funciona dentro de cada VLAN; entre VLANs e entre departamentos falha, pois são sub-redes diferentes e o roteiro não prevê roteador. Se isso se confirmar, deve ser descrito como evidência da segmentação. A interligação dos switches é comprovada pelos comandos de trunk e CDP.

## 4. Conclusão
*[Ajustar conforme os testes reais.]* A atividade mostra como o subnetting dimensiona os blocos à necessidade (/27 por departamento e /28 por VLAN, com folga de endereços), como as VLANs segmentam o tráfego dentro de um mesmo switch e como o DHCP automatiza a atribuição de endereços, desde que haja um servidor em cada VLAN. Também evidencia que VLANs distintas pedem sub-redes distintas, que repetir identificadores de VLAN em switches interligados une os domínios de broadcast, e que a comunicação entre sub-redes exige um dispositivo de camada 3, o qual o roteiro não inclui.
