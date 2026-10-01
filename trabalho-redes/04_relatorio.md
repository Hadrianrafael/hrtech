# Projeto de Rede da Empresa Super Tech no Cisco Packet Tracer

**Disciplina:** Redes de Computadores — **Aluno:** [nome] — **Data:** [data]

## 1. Introdução
Uma rede de computadores é um conjunto de dispositivos interligados que trocam dados por meio de meios de transmissão e protocolos. Neste trabalho a rede foi organizada em **topologia estrela**, em que cada dispositivo se liga a um ponto central; aqui o ponto central de cada departamento é um **switch**, equipamento que encaminha quadros pelo endereço MAC e mantém os domínios de colisão separados por porta. A vantagem da estrela é que a falha de um cabo afeta apenas um equipamento; a desvantagem é a dependência do switch central.

O endereçamento usa **IPv4**, formado por 32 bits e dividido em parte de rede e parte de host por uma máscara. Em uma rede Classe C (máscara padrão /24) é possível dividir o bloco em sub-redes (**subnetting**), emprestando bits da parte de host. Já as **VLANs** dividem logicamente um switch em domínios de broadcast distintos, de modo que dispositivos em VLANs diferentes não se enxergam na camada 2. Por fim, o **DHCP** distribui endereços automaticamente a partir de uma faixa configurada em um servidor, evitando a configuração manual de cada host.

A atividade simula no **Cisco Packet Tracer** a rede da empresa fictícia Super Tech, com quatro departamentos, para praticar subnetting, VLANs e atribuição estática e dinâmica de IPs.

## 2. Métodos
**Equipamentos:** 4 switches Cisco 2950-24; por departamento, 20 PCs, 2 servidores e 2 impressoras (24 hosts), totalizando 96 hosts.

**Sub-redes.** Cada departamento precisa de 24 endereços de host. Com n bits de host há 2^n − 2 endereços úteis: 4 bits dão 14 (insuficiente) e 5 bits dão 30. Logo a máscara é /27 (255.255.255.224). O enunciado cita "rede seria de 227, host de 25"; interpretou-se como /27 e 2^5, já que 227 não é valor válido de máscara. A partir de 192.168.10.0/24 foram usadas as quatro primeiras sub-redes /27 (Tabela 1).

**VLANs e portas.** Em cada switch, as portas Fa0/1–12 ficaram na VLAN 1 e Fa0/13–24 na VLAN 2 (criada com `vlan 2`). Cada VLAN recebeu 10 PCs, 1 impressora e 1 servidor (portas 1–10/11/12 e 13–22/23/24).

**Interligação.** Os switches foram conectados em cadeia pelas portas Gigabit, configuradas em modo trunk, para não ocupar portas de hosts.

**IPs.** Em Engenharia e TI Interno todos os dispositivos receberam IP estático, seguindo a numeração da porta. Em Compras e Infraestrutura, os servidores têm IP estático e executam o serviço DHCP, um por VLAN (pois o broadcast não atravessa VLANs); PCs e impressoras usam DHCP, com pools que seguem a mesma sequência. Os comandos estão em `configs/` e o passo a passo em `02_guia_execucao_packet_tracer.md`.

## 3. Resultados
**Tabela 1 – Sub-redes**

| Departamento | Rede | Máscara | CIDR | 1º IP | Último IP | Broadcast |
|---|---|---|---|---|---|---|
| Engenharia | 192.168.10.0 | 255.255.255.224 | /27 | .1 | .30 | .31 |
| Compras | 192.168.10.32 | 255.255.255.224 | /27 | .33 | .62 | .63 |
| TI Interno | 192.168.10.64 | 255.255.255.224 | /27 | .65 | .94 | .95 |
| Infraestrutura | 192.168.10.96 | 255.255.255.224 | /27 | .97 | .126 | .127 |

A tabela completa de endereçamento por porta está em `tabela_enderecamento.md` (Anexo A). VLANs: 1 (portas 1–12) e 2 (portas 13–24) em cada switch.

**Testes de conectividade:** *[PREENCHER após executar o guia, com a saída real de `show vlan brief`, `show interfaces trunk`, `ipconfig` e dos pings. Não inclua resultados que não tenham sido obtidos no simulador.]*
Comportamento previsto pelo projeto: pings dentro da mesma VLAN funcionam; entre VLANs e entre departamentos não, pois o roteiro não prevê roteador. Se isso se confirmar no teste, deve ser descrito como evidência da segmentação.

## 4. Conclusão
*[Ajustar conforme os testes reais.]* A atividade mostra como o subnetting permite dimensionar blocos de endereços à necessidade (aqui, /27 para 24 hosts, com 6 endereços de folga), como as VLANs segmentam o tráfego mesmo dentro de um único switch e como o DHCP automatiza a atribuição de endereços, com a limitação de que, sem roteador, os segmentos permanecem isolados. Também evidenciou que switches atuam na camada 2 e que a comunicação entre sub-redes exige um dispositivo de camada 3.
