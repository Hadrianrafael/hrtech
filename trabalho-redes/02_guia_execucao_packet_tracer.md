# Guia de execução no Packet Tracer (você precisa fazer – não há PT neste ambiente)

## 1. Montagem
1. Adicione 4 switches **2950-24** (renomeie: SW-ENG, SW-COMP, SW-TI, SW-INFRA).
2. Para cada switch: 20 PC-PT, 2 Server-PT, 2 Printer-PT. Cabo **copper straight-through** nas portas conforme `tabela_enderecamento.md` (Fa0/1…Fa0/24).
3. Cabos **copper cross-over** entre switches: SW-ENG Gi0/1 – SW-COMP Gi0/1; SW-COMP Gi0/2 – SW-TI Gi0/1; SW-TI Gi0/2 – SW-INFRA Gi0/1.
4. Em cada switch: aba CLI → cole o conteúdo de `configs/SW-xxx.txt`.

## 2. IPs estáticos (Engenharia e TI Interno)
Desktop → IP Configuration → Static: IP e máscara **255.255.255.224** conforme tabela; gateway em branco. Impressoras e servidores idem (aba Config → FastEthernet0).

## 3. DHCP (Compras e Infraestrutura)
1. Servidores (Fa0/12 e Fa0/24 de cada switch): IP **estático** conforme tabela, máscara 255.255.255.224.
2. Em cada servidor: Services → DHCP → On. Pool:
   - Compras, servidor da porta 12 (.44): Start IP 192.168.10.33, mask 255.255.255.224, Max users 11.
   - Compras, servidor da porta 24 (.56): Start IP 192.168.10.45, mask 255.255.255.224, Max users 11.
   - Infra, servidor da porta 12 (.108): Start IP 192.168.10.97, Max users 11.
   - Infra, servidor da porta 24 (.120): Start IP 192.168.10.109, Max users 11.
   (Remova/ignore o pool "serverPool" padrão ou altere-o; gateway/DNS 0.0.0.0.)
3. Todos os PCs e impressoras desses dois departamentos: IP Configuration → **DHCP**.
4. Atenção ao risco 3 do checklist (conflito entre Compras e Infra em VLAN 1/2 com trunks ligados).

## 4. Verificações
- Em cada switch: `show vlan brief` (Fa0/1-12 em VLAN 1, Fa0/13-24 em VLAN 2, 10 PCs+1 impressora+1 servidor cada), `show interfaces trunk`.
- Em cada PC: `ipconfig`.

## 5. Testes de ping (registre prints/saída)
| # | Origem → Destino | Esperado |
|---|---|---|
| 1 | PC porta 1 → PC porta 2 (mesma VLAN, cada depto) | Sucesso |
| 2 | PC → impressora e → servidor da mesma VLAN | Sucesso |
| 3 | PC VLAN 1 → PC VLAN 2 (mesmo depto) | Falha (sem roteador) |
| 4 | PC de um depto → PC de outro depto | Falha (sem roteador; sub-redes diferentes) |
| 5 | Compras/Infra: `ipconfig` mostra IP dentro do pool, em sequência | Sucesso |
| 6 | Trunk: `show interfaces trunk` lista as Gi em trunking | Sucesso |
Falhas 3 e 4 são o comportamento correto para o escopo do PDF – registre-as no relatório como evidência de segmentação.
Salve o projeto como `SuperTech.pkt`.
