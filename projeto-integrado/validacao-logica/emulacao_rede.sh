#!/usr/bin/env bash
# Validação lógica (camada 3) da rede da Aurora usando namespaces de rede do Linux.
#
# ATENÇÃO: isto NÃO é o Cisco Packet Tracer e NÃO executa os comandos do IOS.
# O kernel do ambiente não tem bridge nem VLAN 802.1Q; por isso cada VLAN é
# representada por um enlace direto entre o roteador (R-EDGE) e UM host
# representativo. Foram testados: endereçamento, DHCP, roteamento entre VLANs,
# NAT/PAT, DNS, HTTP e o isolamento do Wi-Fi. NÃO foram testados: switches,
# trunks 802.1Q, VLAN nativa, portas de acesso e a sintaxe dos comandos Cisco.
#
# Uso (como root):  bash emulacao_rede.sh
set -u
export http_proxy= https_proxy= HTTP_PROXY= HTTPS_PROXY=
T=/tmp/emu-aurora; mkdir -p $T/intranet $T/inet
echo "Intranet da Aurora" > $T/intranet/index.html
echo "Servidor externo de teste" > $T/inet/index.html
NS="r isp inet pcadm pccom pcatd wifi srv swm"

cleanup() {
  for f in $T/*.pid; do [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null; done
  for n in $NS; do ip netns del $n 2>/dev/null; rm -rf /etc/netns/$n; done
}
cleanup; rm -f $T/*.pid $T/*.log
trap cleanup EXIT

for n in $NS; do ip netns add $n; ip netns exec $n ip link set lo up; mkdir -p /etc/netns/$n; : > /etc/netns/$n/resolv.conf; done
link() { ip link add $2 netns $1 type veth peer name $4 netns $3; ip netns exec $1 ip link set $2 up; ip netns exec $3 ip link set $4 up; }
# R-EDGE <-> hosts (uma "VLAN" por enlace)
link r v10 pcadm eth0; link r v20 pccom eth0; link r v30 pcatd eth0
link r v40 srv eth0;   link r v50 wifi eth0;  link r v99 swm eth0
link r wan isp wan;    link isp lan inet eth0
A() { ip netns exec "$@"; }
# Endereços do roteador (equivalem às subinterfaces Gi0/0.x e Gi0/1)
for v in 10 20 30 40 50 99; do A r ip addr add 192.168.$v.1/24 dev v$v; done
A r ip addr add 198.51.100.2/30 dev wan
A isp ip addr add 198.51.100.1/30 dev wan; A isp ip addr add 203.0.113.1/24 dev lan
A inet ip addr add 203.0.113.10/24 dev eth0; A inet ip route add default via 203.0.113.1
# Hosts de endereço fixo
A srv ip addr add 192.168.40.10/24 dev eth0; A srv ip route add default via 192.168.40.1
A swm ip addr add 192.168.99.2/24 dev eth0;  A swm ip route add default via 192.168.99.1
# Roteador: encaminhamento, rota padrão e NAT (ip nat inside source list 1 ... overload)
A r sysctl -qw net.ipv4.ip_forward=1; A isp sysctl -qw net.ipv4.ip_forward=1
A r ip route add default via 198.51.100.1
A r iptables -t nat -A POSTROUTING -s 192.168.0.0/16 -o wan -j MASQUERADE
# DHCP no roteador (4 pools; .1 a .10 reservados => faixa .11 a .254)
A r dnsmasq --conf-file=/dev/null --port=0 --bind-interfaces --pid-file=$T/dhcp.pid --dhcp-leasefile=$T/leases \
  --interface=v10 --interface=v20 --interface=v30 --interface=v50 \
  --dhcp-range=set:adm,192.168.10.11,192.168.10.254,255.255.255.0,12h \
  --dhcp-range=set:com,192.168.20.11,192.168.20.254,255.255.255.0,12h \
  --dhcp-range=set:atd,192.168.30.11,192.168.30.254,255.255.255.0,12h \
  --dhcp-range=set:wif,192.168.50.11,192.168.50.254,255.255.255.0,12h \
  --dhcp-option=tag:adm,option:router,192.168.10.1 --dhcp-option=tag:adm,option:dns-server,192.168.40.10 \
  --dhcp-option=tag:com,option:router,192.168.20.1 --dhcp-option=tag:com,option:dns-server,192.168.40.10 \
  --dhcp-option=tag:atd,option:router,192.168.30.1 --dhcp-option=tag:atd,option:dns-server,192.168.40.10 \
  --dhcp-option=tag:wif,option:router,192.168.50.1 --dhcp-option=tag:wif,option:dns-server,192.168.40.10
# Servidor: DNS (intranet.aurora.local e www.exemplo.com.br) e HTTP
A srv dnsmasq --conf-file=/dev/null --no-resolv --no-hosts --bind-interfaces --listen-address=192.168.40.10 --pid-file=$T/dns.pid \
  --address=/intranet.aurora.local/192.168.40.10 --address=/www.exemplo.com.br/203.0.113.10
( cd $T/intranet && A srv python3 -m http.server 80 --bind 192.168.40.10 >$T/srv-http.log 2>&1 & echo $! > $T/http1.pid )
( cd $T/inet && A inet python3 -m http.server 80 --bind 203.0.113.10 >$T/inet-http.log 2>&1 & echo $! > $T/http2.pid )
sleep 2

PASS=0; FAIL=0
t() { # t "descrição" comando...   (esperado: sucesso)
  local d="$1"; shift
  if "$@" >/dev/null 2>&1; then echo "[OK]    $d"; PASS=$((PASS+1)); else echo "[FALHA] $d"; FAIL=$((FAIL+1)); fi
}
tf() { local d="$1"; shift
  if "$@" >/dev/null 2>&1; then echo "[FALHA] $d (deveria falhar)"; FAIL=$((FAIL+1)); else echo "[OK]    $d (falhou como esperado)"; PASS=$((PASS+1)); fi
}
echo "=== 1. DHCP ==="
for h in pcadm pccom pcatd wifi; do
  A $h udhcpc -i eth0 -n -q -f -s /etc/udhcpc/default.script >/dev/null 2>&1
  ip=$(A $h ip -4 -o addr show eth0 | awk '{print $4}'); gw=$(A $h ip route | awk '/default/{print $3}'); dns=$(awk '/nameserver/{print $2}' /etc/netns/$h/resolv.conf | head -1)
  echo "$h: ip=$ip gw=$gw dns=$dns"
done
ip_of() { A $1 ip -4 -o addr show eth0 | awk '{print $4}' | cut -d/ -f1; }
ADM=$(ip_of pcadm); COM=$(ip_of pccom); ATD=$(ip_of pcatd); WIF=$(ip_of wifi)
inrange() { local o=${1##*.}; [ "$o" -ge 11 ] && [ "$o" -le 254 ]; }
t "pcadm recebeu IP 192.168.10.11-254 ($ADM)" bash -c "[[ $ADM == 192.168.10.* ]]"; t "faixa .11-.254 (ADM)" inrange $ADM
t "pccom recebeu IP 192.168.20.x ($COM)" bash -c "[[ $COM == 192.168.20.* ]]"
t "pcatd recebeu IP 192.168.30.x ($ATD)" bash -c "[[ $ATD == 192.168.30.* ]]"
t "wifi recebeu IP 192.168.50.x ($WIF)" bash -c "[[ $WIF == 192.168.50.* ]]"
t "gateway e DNS entregues por DHCP (pcadm)" bash -c "A() { ip netns exec \"\$@\"; }; A pcadm ip route | grep -q 'default via 192.168.10.1' && grep -q 192.168.40.10 /etc/netns/pcadm/resolv.conf"
echo "=== 2. Roteamento e servidor ==="
t "pcadm -> gateway 192.168.10.1" A pcadm ping -c1 -W2 192.168.10.1
t "pcadm -> servidor 192.168.40.10" A pcadm ping -c1 -W2 192.168.40.10
t "pcadm -> pccom ($COM) entre VLANs" A pcadm ping -c1 -W2 $COM
t "pccom -> pcatd ($ATD) entre VLANs" A pccom ping -c1 -W2 $ATD
t "pcatd -> gerência 192.168.99.2" A pcatd ping -c1 -W2 192.168.99.2
echo "=== 3. DNS e HTTP ==="
t "DNS: intranet.aurora.local resolve para 192.168.40.10" bash -c "[ \"\$(ip netns exec pcadm getent hosts intranet.aurora.local | awk '{print \$1}')\" = 192.168.40.10 ]"
t "HTTP: http://intranet.aurora.local (Intranet da Aurora)" bash -c "ip netns exec pcadm curl -s --noproxy '*' -m5 http://intranet.aurora.local/ | grep -q 'Intranet da Aurora'"
echo "=== 4. Internet simulada e NAT ==="
t "pcadm -> 203.0.113.10 (internet simulada)" A pcadm ping -c1 -W2 203.0.113.10
t "DNS: www.exemplo.com.br resolve para 203.0.113.10" bash -c "[ \"\$(ip netns exec pcadm getent hosts www.exemplo.com.br | awk '{print \$1}')\" = 203.0.113.10 ]"
t "HTTP: http://www.exemplo.com.br (Servidor externo de teste)" bash -c "ip netns exec pcadm curl -s --noproxy '*' -m5 http://www.exemplo.com.br/ | grep -q 'Servidor externo de teste'"
echo "Origem vista pelo servidor externo (log HTTP): $(awk '{print $1}' $T/inet-http.log | sort -u | tr '\n' ' ')"
t "NAT: servidor externo só vê 198.51.100.2" bash -c "! awk '{print \$1}' $T/inet-http.log | grep -q '^192\.168\.' && awk '{print \$1}' $T/inet-http.log | grep -q '^198\.51\.100\.2\$'"
echo "--- conntrack (R-EDGE), amostra:"; A r conntrack -L 2>/dev/null | grep -E "203.0.113.10" | head -3
echo "=== 5. Wi-Fi sem ACL ==="
t "wifi -> pcadm ($ADM) ANTES da ACL (rede plana de política)" A wifi ping -c1 -W2 $ADM
echo "=== 6. ACL WIFI-ENTRADA (equivalente em iptables) ==="
# permit udp 192.168.50.0/24 -> host 192.168.40.10 eq 53 ; deny ip 192.168.50.0/24 -> 192.168.0.0/16 ; permit ip any any
for ch in FORWARD INPUT; do
  A r iptables -A $ch -i v50 -p udp -s 192.168.50.0/24 -d 192.168.40.10 --dport 53 -j ACCEPT
  A r iptables -A $ch -i v50 -s 192.168.50.0/24 -d 192.168.0.0/16 -j DROP
done
tf "wifi -> pcadm ($ADM) bloqueado pela ACL" A wifi ping -c1 -W2 $ADM
tf "wifi -> servidor 192.168.40.10 (ICMP) bloqueado" A wifi ping -c1 -W2 192.168.40.10
tf "wifi -> gateway 192.168.50.1 também deixa de responder" A wifi ping -c1 -W2 192.168.50.1
t "wifi -> 203.0.113.10 (internet) continua funcionando" A wifi ping -c1 -W2 203.0.113.10
t "wifi resolve nomes pelo DNS 192.168.40.10 (UDP 53 permitido)" bash -c "[ \"\$(ip netns exec wifi getent hosts www.exemplo.com.br | awk '{print \$1}')\" = 203.0.113.10 ]"
t "wifi -> HTTP externo continua funcionando" bash -c "ip netns exec wifi curl -s --noproxy '*' -m5 http://www.exemplo.com.br/ | grep -q 'Servidor externo de teste'"
t "pcadm continua acessando tudo (ACL só afeta o Wi-Fi)" A pcadm ping -c1 -W2 $COM
echo
echo "RESULTADO: $PASS verificações OK, $FAIL falhas"
[ "$FAIL" -eq 0 ]
