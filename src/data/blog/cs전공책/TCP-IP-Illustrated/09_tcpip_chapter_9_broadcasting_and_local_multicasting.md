---
title: "Chapter 9. Broadcasting and Local Multicasting"
order: 9
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: Chapter 9. Broadcasting and Local Multicasting"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

이 장은 IPv4의 broadcast와 IP multicast가 local network에서 어떻게 여러 수신자에게 packet을 전달하는지 다룬다. IPv4는 unicast, anycast, multicast, broadcast를 모두 사용할 수 있지만, IPv6는 broadcast를 지원하지 않고 multicast를 기본 기능으로 사용한다. 특히 IPv6에서는 Neighbor Discovery(ND)가 multicast에 의존하므로 multicast는 선택적 부가 기능이 아니라 정상적인 IPv6 통신의 기반이다.

Broadcasting과 multicasting은 크게 두 용도로 쓰인다. 하나는 같은 정보를 여러 수신자에게 보내는 `delivery to multiple destinations`이고, 다른 하나는 client가 특정 server의 IP address를 모를 때 요청을 뿌려 server를 찾는 `solicitation/discovery`다. DHCP, ARP, ND, routing protocol 같은 system process도 이 성격을 활용한다.

Broadcast는 단순하지만 범위 안의 모든 host를 깨운다. Multicast는 관심 있는 group member만 대상으로 하므로 효율적이지만, address mapping, group membership 관리, router query/report protocol이 필요해 더 복잡하다. 이 장의 IGMP와 MLD는 바로 그 복잡도를 관리하기 위한 local multicast membership protocol이다.

## 핵심 개념

- broadcast: network 범위 안의 가능한 모든 receiver에게 message를 보내는 방식이다.
- limited broadcast: IPv4 `255.255.255.255`. local network에 한정되는 broadcast address다.
- subnet-directed broadcast: subnet prefix에 host bits를 모두 1로 채운 IPv4 broadcast address다. 예: `10.0.0.0/25`의 directed broadcast는 `10.0.0.127`.
- multicast: 특정 multicast group address에 관심을 표시한 receiver들에게 traffic을 보내는 방식이다.
- IGMP(Internet Group Management Protocol): IPv4 multicast router가 subnet의 multicast group membership을 알기 위해 쓰는 protocol이다.
- MLD(Multicast Listener Discovery): IPv6에서 IGMP에 대응하는 multicast listener 관리 기능이며 ICMPv6 message로 동작한다.
- link-layer broadcast address: Ethernet에서 `ff:ff:ff:ff:ff:ff`.
- SO_BROADCAST: 일부 OS에서 application이 broadcast datagram을 의도적으로 보내겠다고 표시하는 socket option이다.

## 세부 정리

### 9.1 Introduction

IP address의 네 가지 형태 중 IPv4는 `unicast`, `anycast`, `multicast`, `broadcast`를 모두 쓸 수 있고, IPv6는 broadcast를 제외한 나머지를 사용한다. 이 차이는 IPv6가 broadcast의 거친 “모두에게 전달” 모델 대신 multicast로 필요한 대상 집합을 더 명확히 표현하도록 설계되었음을 보여 준다.

Broadcasting과 multicasting이 application에 제공하는 가치는 두 가지다.

| 용도 | 설명 | 예 |
| --- | --- | --- |
| delivery to multiple destinations | 같은 정보를 여러 receiver에게 한 번에 전달 | conferencing, news/mail distribution, local service announcement |
| solicitation/discovery of servers | 특정 server IP address를 모르더라도 local network에 요청을 보냄 | DHCP로 초기 address/router 찾기, local service discovery |

Broadcasting은 구현과 사용이 단순하다. sender는 한 번만 보내고 link/network가 가능한 모든 node에 전달한다. 하지만 관심 없는 host까지 모두 처리 비용을 치른다. Multicasting은 관심 있는 protocol/service/group에 가입한 host만 깨우려 하므로 효율적이지만, IP multicast address, link-layer multicast address mapping, membership report, multicast router query 같은 추가 장치가 필요하다.

TCP는 connection-oriented protocol이라 broadcast/multicast address를 직접 사용하지 않는다. TCP connection은 두 host의 IP address와 양쪽 process의 port number로 식별되는 point-to-point 관계를 전제한다. Broadcast/multicast는 보통 UDP 또는 ICMPv4처럼 connectionless 방식에서 사용된다.

### 9.2 Broadcasting

Broadcasting은 network의 모든 가능한 receiver에게 message를 보내는 것이다. 원리만 보면 router가 들어온 interface를 제외한 모든 interface로 copy를 내보내면 된다. 그러나 local area network에서는 link layer 기능을 이용해 더 효율적으로 구현한다.

Ethernet frame은 source/destination MAC address를 가진다. 일반 unicast IP packet은 ARP(IPv4)나 ND(IPv6)로 목적지의 unique MAC address를 알아내고, 그 MAC address로 frame을 보낸다. switched Ethernet에서는 이런 unicast frame이 switch/bridge의 station cache를 통해 필요한 port로만 전달된다.

반면 broadcast는 같은 LAN 또는 VLAN의 모든 host가 frame을 받도록 destination MAC address를 `ff:ff:ff:ff:ff:ff`로 설정한다. ARP Request가 대표적인 예다. 이 주소는 모든 bits가 1인 Ethernet broadcast address이며, 넓게 보면 Ethernet multicast address의 특수한 형태로 볼 수 있다.

### 9.2.1 Using Broadcast Addresses

Ethernet 계열에서 multicast MAC address는 high-order byte의 low-order bit가 1인 형태다. 예를 들어 `01:00:00:00:00:00`은 multicast bit가 켜진 주소 형태를 보여 준다. Ethernet broadcast address `ff:ff:ff:ff:ff:ff`는 이 범주의 특수한 all-ones address다.

IPv4에는 두 종류의 중요한 broadcast address가 있다.

| IPv4 broadcast address | 범위/의미 | 예 |
| --- | --- | --- |
| subnet-directed broadcast | 특정 subnet 안의 모든 host 대상. subnet prefix + host bits all 1 | `10.0.0.0/25` → `10.0.0.127` |
| limited broadcast | local network에 한정. 특정 interface 선택은 OS 정책에 좌우 | `255.255.255.255` |

예를 들어 interface `eth0`가 `10.0.0.13/25`를 사용한다면 network prefix는 `10.0.0.0/25`이고 host portion은 7 bits다. 이 7 bits를 모두 1로 채우면 `0.0.0.127`이므로 subnet-directed broadcast address는 `10.0.0.127`이 된다.

Broadcast ping 예시는 동작을 잘 보여 준다. `ping -b 10.0.0.127`처럼 directed broadcast address로 ICMPv4 Echo Request를 보내면, 같은 subnet에서 broadcast Echo Request에 응답하는 host들이 Echo Reply를 보낸다. sender는 요청을 하나만 보냈지만 여러 reply가 돌아오므로 ping은 추가 응답을 `DUP!`로 표시할 수 있다.

![Figure 9-1](@/assets/images/cs-tcp-ip-illustrated-189-figure-9-1-page-477.png)
*Figure 9-1 · PDF p. 477 · subnet-directed broadcast Echo Request는 IPv4 destination은 broadcast address, Ethernet destination은 ff:ff:ff:ff:ff:ff를 사용한다.*

이때 IPv4 implementation은 local routing table과 interface configuration을 보고 `10.0.0.127`이 subnet-directed broadcast address임을 판단한다. 그 결과 ARP로 각 host의 MAC address를 묻지 않고 link-layer broadcast address `ff:ff:ff:ff:ff:ff`로 frame을 보낸다. sender는 어떤 host가 응답할지 미리 모른다. 단지 해당 destination이 broadcast address라는 사실만 알고, 응답 host들은 자기 unicast IPv4 address를 source로 Echo Reply를 돌려보낸다.

이 구조는 discovery의 일반 원리와 연결된다. Broadcast 또는 multicast request는 “누가 있는지 모르는 상태”에서 network 안의 service/host를 찾는 데 유용하다. 하지만 그만큼 관심 없는 host까지 처리하도록 만들 수 있어 남용되면 성능과 보안 문제가 된다.

### 9.2.2 Sending Broadcast Datagrams

Application이 broadcast traffic을 보낼 때는 보통 UDP나 ICMPv4를 사용한다. API 자체는 일반 datagram 전송과 비슷하지만, 일부 OS는 `SO_BROADCAST` 같은 flag를 요구한다. 이는 실수로 broadcast traffic을 생성해 local network를 순간적으로 congest시키는 일을 막기 위한 안전장치다. Linux `ping`에서 broadcast address를 대상으로 하면서 `-b` option을 주지 않으면 “broadcast ping을 하려면 -b를 써라”는 식의 오류가 나는 것도 이 때문이다.

Broadcast traffic을 어느 interface로 보낼지는 IPv4 forwarding table, 즉 routing table을 참조한다. subnet-directed broadcast address는 보통 해당 subnet interface의 on-link route로 표현된다. 예를 들어 Windows routing table에서 `10.0.0.127/32`가 `On-link`이고 interface가 `10.0.0.57`이면, 이 directed broadcast는 그 interface로 direct delivery된다.

Directed broadcast가 local network를 넘어가도록 router가 forwarding하는 기능은 보안상 보통 비활성화된다. Source address spoofing과 결합하면 Chapter 8의 smurf attack처럼 broadcast amplification DoS가 되기 쉽기 때문이다. RFC2644는 router에서 directed broadcast forwarding을 기본적으로 막는 방향을 권한다.

`255.255.255.255` limited broadcast는 특정 attached network prefix와 직접 연결되지 않기 때문에 multihomed host에서 어느 interface로 보낼지 애매하다. RFC1122도 “모든 interface로 보내야 하는가”에 대해 명확히 정하지 않았다. 그래서 OS별 동작이 다르다.

| OS/동작 | limited broadcast 처리 경향 |
| --- | --- |
| Linux, FreeBSD | 대체로 하나의 broadcast-capable interface 선택 |
| FreeBSD | primary interface의 subnet-directed broadcast로 바꾸는 동작 가능. `IP_ONESBCAST`로 조정 가능 |
| Windows 2000 이전 | 여러 interface로 forwarding한 사례 |
| Windows XP 이후 | 기본적으로 단일 interface 선택 |

결론적으로 broadcast는 “destination address만 정하면 알아서 모두에게 간다”가 아니다. IP layer는 routing/interface configuration을 보고 어떤 link-layer broadcast frame을 어느 interface로 보낼지 결정한다. 특히 multihomed host와 limited broadcast에서는 OS 정책 차이가 실제 packet 경로를 바꿀 수 있다.

### 9.3 Multicasting

Multicasting은 broadcast overhead를 줄이기 위해, traffic에 관심 있는 receiver에게만 packet을 전달하려는 방식이다. 기본 발상은 sender가 receiver들을 명시하거나, receiver들이 스스로 관심을 표시하게 하고, network가 그 정보를 바탕으로 필요한 link에만 packet을 전달하게 하는 것이다.

TCP/IP multicast model에서는 receiver가 `multicast address`와 optional `source list`를 사용해 “어떤 group traffic을 받고 싶은지”를 표현한다. 이 정보는 host와 router 안에서 `soft state`로 유지된다. Soft state는 주기적으로 갱신되지 않으면 timeout되어 삭제되는 상태다. 상태가 사라지면 multicast delivery가 중단되거나, 상황에 따라 broadcast에 가까운 비효율적 전달로 되돌아갈 수 있다.

Broadcast와 비교한 multicast의 목표는 세 가지다.

| 목표 | 의미 |
| --- | --- |
| interested hosts only | 관심 있는 host만 packet을 처리하게 함 |
| useful links only | multicast traffic이 필요한 link에만 흐르게 함 |
| one copy per link | 같은 link에는 datagram copy를 하나만 실음 |

Multicast에는 두 service model이 있다. `Any-Source Multicast (ASM)`는 group address에 가입하면 sender가 누구든 해당 group traffic을 받을 수 있는 모델이다. 초기 IP multicast가 이 모델에 가깝다. `Source-Specific Multicast (SSM)`는 receiver가 특정 source를 include/exclude할 수 있는 모델이다. Wide area multicast에서는 단일 source 위치를 추적하는 SSM이 ASM보다 구현하기 쉬운 면이 있다. Local area에서는 ASM과 SSM을 지원하는 기본 machinery가 상당히 겹친다.

### 9.3.1 Converting IP Multicast Addresses to 802 MAC/Ethernet Addresses

Unicast IP에서는 ARP(IPv4)나 ND(IPv6)로 destination IP address에 대응하는 MAC address를 알아낸다. Broadcast에서는 `ff:ff:ff:ff:ff:ff`라는 well-known MAC address를 쓴다. Multicast에서는 매번 별도 질의로 MAC address를 찾기보다, IP multicast address를 link-layer multicast MAC address로 직접 mapping한다.

IEEE 802, 특히 Ethernet/Wi-Fi에서 IP multicast를 효율적으로 실으려면 IP multicast datagram과 link-layer multicast frame 사이의 mapping이 필요하다. IANA는 OUI `00:00:5e`를 가지고 있고, 그중 multicast MAC prefix `01:00:5e` 계열을 IPv4 multicast mapping에 사용한다.

IPv4 multicast address는 `224.0.0.0`부터 `239.255.255.255`까지이며, high-order 4 bits가 `1110`이다. 따라서 multicast group ID를 표현하는 데 28 bits가 있다. 하지만 Ethernet IPv4 multicast address mapping은 lower-order 23 bits만 MAC suffix로 복사한다.

![Figure 9-2](@/assets/images/cs-tcp-ip-illustrated-190-figure-9-2-page-482.png)
*Figure 9-2 · PDF p. 482 · IPv4 multicast address의 lower 23 bits가 01:00:5e prefix 뒤 MAC suffix로 복사된다.*

이 mapping은 nonunique하다. IPv4 multicast group은 2^28개인데 MAC suffix 공간은 2^23개뿐이므로, `2^28 / 2^23 = 32`개의 IPv4 multicast group address가 같은 Ethernet multicast MAC address로 접힌다. 예를 들어 `224.128.64.32`와 `224.0.64.32`는 둘 다 `01:00:5e:00:40:20`으로 mapping될 수 있다. 따라서 NIC가 MAC address 기준으로 filtering을 잘해도 IP layer에서 추가 filtering이 필요하다.

IPv6 multicast MAC mapping은 prefix `33:33` 뒤에 IPv6 multicast address의 low-order 32 bits를 붙인다. IPv6 multicast address는 `ff`로 시작하고, 이어지는 8 bits는 flags와 scope에 사용된다. 나머지 112 bits가 multicast group 표현 공간인데, MAC mapping에는 lower 32 bits만 쓰인다.

![Figure 9-3](@/assets/images/cs-tcp-ip-illustrated-191-figure-9-3-page-483.png)
*Figure 9-3 · PDF p. 483 · IPv6 multicast address는 low-order 32 bits만 33:33 prefix 뒤 MAC suffix로 복사된다.*

IPv6에서도 mapping은 nonunique하다. 이론적으로 `2^112 / 2^32 = 2^80`개의 IPv6 multicast group이 같은 MAC address로 mapping될 수 있다. 이 숫자는 매우 크지만, 실무적으로 기억할 점은 “multicast MAC address만으로는 IP multicast group을 완전히 식별할 수 없다”는 것이다.

### 9.3.2 Examples

Broadcast ping은 “local subnet의 broadcast Echo Request에 응답하는 host”를 찾았다. Multicast ping은 더 좁게 “특정 multicast service group에 가입한 host”를 찾을 수 있다. 예를 들어 IPv4 mDNS(Multicast DNS)는 multicast address `224.0.0.251`을 사용한다. 이 주소로 ICMPv4 Echo Request를 보내면 mDNS group에 가입한 host들만 응답한다.

Broadcast example과 mDNS multicast example의 responder 집합이 다를 수 있다. 이는 정상이다. 모든 host가 mDNS를 지원하거나 해당 group에 가입하는 것은 아니기 때문이다. Multicast discovery는 broadcast discovery보다 관심 대상이 좁다.

IPv6에서도 비슷하게 ICMPv6 Echo Request를 multicast address `ff02::fb`로 보낼 수 있다. 이 주소는 mDNS의 IPv6 link-local scope multicast address다. IPv6에서는 interface마다 여러 address가 있을 수 있으므로 `ping6 -I eth0 ff02::fb`처럼 outgoing interface를 명시하는 것이 중요하다.

![Figure 9-4](@/assets/images/cs-tcp-ip-illustrated-192-figure-9-4-page-484.png)
*Figure 9-4 · PDF p. 484 · ICMPv6 Echo Request가 eth0의 link-local source address에서 ff02::fb multicast address로 전송된다.*

Figure 9-4의 IPv6 예시에서 request destination은 `ff02::fb`이고, 이 주소는 MAC `33:33:00:00:00:fb`로 mapping된다. Echo Reply는 multicast address로 돌아오지 않고 원래 sender의 link-local unicast address로 직접 돌아온다. 또한 responder는 source address selection 규칙에 따라 같은 scope의 link-local IPv6 address를 source로 사용한다.

### 9.3.3 Sending Multicast Datagrams

Multicast datagram을 보낼 때도 sender는 source address와 outgoing interface를 선택해야 한다. IPv6에서는 interface마다 여러 address가 일반적이므로 이 문제가 더 두드러진다. Host는 forwarding/routing table을 보고 multicast destination에 사용할 interface를 고른다.

IPv4에서는 multicast address block `224.0.0.0/4`에 대한 route가 있으면 그 route가 default route보다 specific하게 matching된다. 여러 interface가 같은 multicast route를 가질 수 있고, application이 별도 지정하지 않으면 metric이 낮은 interface가 선택된다. IPv6에서는 모든 multicast address가 `ff00::/8`로 시작하므로, routing table에 `ff00::/8` on-link route가 나타난다.

Linux IPv6 routing table에서 `ff00::/8`의 next hop이 `::`이고 flag가 `U`만 있으면, 이는 gateway가 필요한 route가 아니라 on-link multicast route라는 뜻이다. 즉 multicast traffic은 router next hop으로 보내는 것이 아니라 해당 interface의 link-layer multicast로 직접 내보내는 경우가 많다.

### 9.3.4 Receiving Multicast Datagrams

Multicast 수신의 핵심은 process가 특정 interface에서 하나 이상의 multicast group에 `join`하거나 `leave`한다는 점이다. Membership은 host 전체의 정적 속성이 아니라, process와 interface의 조합에 따라 동적으로 바뀐다. 같은 process가 같은 group을 여러 interface에서 join할 수도 있고, 한 interface에서 여러 group을 join할 수도 있다.

SSM까지 고려하면 단순히 group에 join하는 것뿐 아니라, 특정 source를 include하거나 exclude하는 API도 필요하다. 이는 “이 group의 모든 sender”가 아니라 “이 group 중 이 source들만” 또는 “이 source들은 제외” 같은 관심 표현을 가능하게 한다.

운영체제는 현재 interface별 multicast group membership을 보여 주는 명령을 제공한다. Windows에서는 `netsh interface ipv6 show joins`, Linux에서는 `netstat -gn` 같은 명령으로 IPv4/IPv6 group membership을 확인할 수 있다. 예시에는 `ff02::1` link-local All Nodes, `ff02::1:ff...` Solicited-Node multicast address, `ff02::c` SSDP, `ff02::1:3` LLMNR 같은 address가 나타난다.

중요한 API nuance가 있다. IP multicasting에서는 process가 multicast group에 join하지 않고도 그 group으로 send할 수 있다. 다만 보통은 상호작용하는 group에 join한다. 같은 host의 같은 interface에서 같은 group에 가입한 process들끼리 multicast loopback을 어떻게 처리할지는 `IP_MULTICAST_LOOP` option이 관여한다. UNIX 계열은 이 option이 send path에 적용되는 반면, Windows는 receive path에 적용되는 식의 차이가 있다.

### 9.3.5 Host Address Filtering

Multicast가 broadcast보다 효율적이려면, 관심 없는 host가 packet을 가능한 낮은 layer에서 버릴 수 있어야 한다. 수신 filtering은 여러 layer에서 단계적으로 일어난다.

![Figure 9-5](@/assets/images/cs-tcp-ip-illustrated-193-figure-9-5-page-489.png)
*Figure 9-5 · PDF p. 489 · NIC, driver, IP, UDP 각 layer가 MAC/IP/port 기준으로 수신 packet을 filtering한다.*

Switched Ethernet에서 broadcast/multicast frame은 VLAN 안의 spanning tree를 따라 필요한 segment로 복제된다. 각 host의 NIC는 frame CRC를 확인하고, destination MAC address가 자신의 unicast MAC, broadcast MAC, 또는 관심 multicast MAC인지 판단한다. 문제는 multicast filtering이 완전하지 않다는 점이다.

NIC multicast filtering은 보통 두 방식 중 하나다.

| NIC filtering 방식 | 장점 | 한계 |
| --- | --- | --- |
| finite multicast address table | 관심 MAC address를 정확히 table에 저장해 비교 | table보다 많은 group이 필요하면 multicast-promiscuous mode로 전환될 수 있음 |
| hash-based multicast filter | 작은 memory로 많은 address를 압축 표현 | hash collision 때문에 원치 않는 frame이 false positive로 통과 가능 |

Hash filtering에서는 false positive는 있을 수 있지만 false negative는 없어야 한다. 즉 필요 없는 frame이 위로 올라오는 것은 허용되지만, 받아야 할 multicast frame을 NIC가 버리면 안 된다. 그래서 NIC/driver에서 일부 frame이 통과하더라도 IP layer가 destination IP multicast address를 다시 확인하고, UDP/TCP가 port number를 기준으로 다시 filtering한다.

UDP broadcast application을 예로 들면, 50 hosts 중 20 hosts만 application에 참여해도 broadcast를 쓰면 나머지 30 hosts도 UDP layer까지 packet을 처리한 뒤 port가 없어 discard한다. Multicast는 host가 group에 join하고, 가능하면 NIC가 해당 multicast MAC만 받도록 설정해 이 불필요한 processing을 줄인다. 대신 multicast address와 group membership을 관리하는 complexity를 부담한다.

### 9.4 The Internet Group Management Protocol (IGMP) and Multicast Listener Discovery Protocol (MLD)

`multicast routing`은 단순히 destination group address만 보고 packet을 복제하는 기능이 아니다. Router는 어떤 interface 쪽에 특정 multicast group의 receiver가 적어도 하나 있는지 알아야 하고, source에서 multicast tree를 따라 packet이 되돌아 도는 loop도 막아야 한다. 이때 널리 쓰이는 기본 검사가 `Reverse Path Forwarding (RPF) check`이다. Router는 들어온 multicast datagram의 **source address**를 일반 unicast routing table에서 조회하고, 그 source로 가는 최적 outgoing interface가 지금 datagram이 들어온 incoming interface와 맞을 때만 forwarding한다. 목적지는 multicast group이지만, loop 방지 기준은 source까지의 reverse path라는 점이 핵심이다.

`IGMP (Internet Group Management Protocol)`는 IPv4에서, `MLD (Multicast Listener Discovery)`는 IPv6에서 host와 multicast router 사이의 local subnet용 membership protocol이다. Router가 알고 싶은 것은 "이 link에 group G의 listener가 적어도 하나 있는가"이지, 일반적으로 "어떤 host가 정확히 몇 개나 있는가"가 아니다. 그래서 IGMP/MLD는 wide-area multicast routing protocol 자체가 아니라, local link에서 group membership 정보를 수집해 multicast routing protocol이 쓸 수 있게 해 주는 protocol이다.

Version evolution은 기능 확장 방향을 보여 준다. `IGMPv1`은 기본 membership reporting을 제공했고, `IGMPv2`는 leave를 더 빠르게 처리할 수 있게 했다. IPv6의 `MLDv1`은 대체로 IGMPv2와 대응된다. `IGMPv3`와 `MLDv2`는 source selection을 추가해 `Source-Specific Multicast (SSM)`을 지원한다. IPv4에서 IGMP는 IPv4 header의 Protocol 값 2를 쓰는 별도 protocol이고, IPv6에서 MLD는 `ICMPv6` message family 안에 포함된다.

![Figure 9-6](@/assets/images/cs-tcp-ip-illustrated-195-figure-9-6-page-492.png)
*Figure 9-6 · PDF p. 492 · multicast router의 query와 host의 IGMP/MLD report 흐름*

Router는 주기적으로 `Query`를 보내 receiver가 아직 존재하는지 확인한다. Host는 membership이 있으면 `Report`로 응답하고, application이 group에 join하거나 leave하는 등 local reception state가 바뀌면 unsolicited report를 보낼 수도 있다. IGMPv3 report는 `224.0.0.22`로, MLDv2 report는 `ff02::16`으로 보내진다. Multicast router 자신도 multicast group member가 될 수 있으므로, 그림에서 router와 host의 역할은 완전히 분리된 장비 종류라기보다 protocol role에 가깝다.

IGMPv1/v2와 MLDv1에는 `report suppression`이 있었다. 같은 group에 대해 다른 host의 report를 들으면 자기 report를 생략해 traffic을 줄이는 방식이다. Host들은 query를 받으면 random delay timer를 걸고, 그 사이 같은 group report가 들리면 응답을 억제한다. IGMPv3/MLDv2에서는 source filtering과 host tracking, snooping bridge 환경의 복잡성 때문에 suppression이 제거되었다. 다만 같은 LAN에 old host/router가 섞일 수 있으므로 IGMPv3/MLDv2 implementation은 older version message를 감지하면 backward compatibility mode로 동작해야 한다.

![Figure 9-7](@/assets/images/cs-tcp-ip-illustrated-196-figure-9-7-page-493.png)
*Figure 9-7 · PDF p. 493 · IGMP는 IPv4 datagram에, MLD는 ICMPv6/Hop-by-Hop option과 함께 encapsulation된다*

IGMP packet은 IPv4 datagram 안에 들어가며 IPv4 Protocol 값은 2이다. Local link 제어 traffic이므로 `TTL = 1`을 사용하고, router가 빠르게 확인할 수 있도록 IPv4 `Router Alert` option을 포함한다. 책의 예에서는 DS Field가 `0x30 (CS6)`로 표시된다. MLD는 ICMPv6 message이므로 IPv6 Hop Limit을 1로 두고, Hop-by-Hop extension header에 `Router Alert` option을 넣는다. 이 두 protocol 모두 local subnet control plane traffic이기 때문에 일반 end-to-end data traffic처럼 멀리 전달되면 안 된다.

### 9.4.1 IGMP and MLD Processing by Group Members

Host의 `group member part`는 application의 multicast socket 상태를 network-visible report로 바꾼다. Application은 group address뿐 아니라 source filter도 지정할 수 있다. Source filter는 크게 두 mode로 이해하면 된다.

| Mode | 의미 | 대표 사용 |
| --- | --- | --- |
| `include mode` | source list에 있는 sender의 traffic만 받는다 | SSM처럼 특정 source만 허용 |
| `exclude mode` | source list에 있는 sender만 제외하고 나머지는 받는다 | ASM join, 특정 source 차단 |

IGMPv3 report는 여러 `group record`의 vector이다. 각 group record는 multicast group address와 optional source address list를 담는다. 이 구조 덕분에 host는 "group G를 듣고 싶다"뿐 아니라 "group G에서 source S1, S2만 듣고 싶다" 또는 "group G에서 source S3만 빼고 듣고 싶다"를 표현할 수 있다.

![Figure 9-9](@/assets/images/cs-tcp-ip-illustrated-198-figure-9-9-page-495.png)
*Figure 9-9 · PDF p. 495 · IGMPv3 group record의 record type, multicast address, source address list 구조*

Group join/leave semantics도 source filter로 표현된다. 아무 source나 허용하는 일반 ASM join은 `exclude mode`와 empty source list로 나타낼 수 있다. 반대로 group을 떠나는 것은 `include mode`와 empty source list로 볼 수 있다. SSM은 이미 single source를 전제로 하므로 IGMPv3의 일부 exclude 관련 record type을 쓰지 않는다.

IGMPv3 group record type은 현재 상태를 알리는 record와 상태 변화를 알리는 record로 나뉜다.

| Type | 이름 | 의미 |
| --- | --- | --- |
| `0x01` | `MODE_IS_INCLUDE (IS_IN)` | query response에서 현재 include filter 상태를 알림 |
| `0x02` | `MODE_IS_EXCLUDE (IS_EX)` | query response에서 현재 exclude filter 상태를 알림 |
| `0x03` | `CHANGE_TO_INCLUDE_MODE (TO_IN)` | local state가 exclude에서 include로 바뀜 |
| `0x04` | `CHANGE_TO_EXCLUDE_MODE (TO_EX)` | local state가 include에서 exclude로 바뀜 |
| `0x05` | `ALLOW_NEW_SOURCES (ALLOW)` | 새 source를 허용 목록에 추가 |
| `0x06` | `BLOCK_OLD_SOURCES (BLOCK)` | 기존 source를 더 이상 허용하지 않음 |

앞의 두 type은 `current-state record`이고, 뒤의 네 type은 `state-change record`이다. Query에 대한 응답은 random bounded delay timer를 사용한다. Delay 동안 local application 상태가 또 바뀌면 여러 변화를 하나의 report로 합칠 수 있다. 단, IGMP/MLD query와 report 자체는 multicast filtering 대상이 아니다. Membership protocol message를 filtering해 버리면 router가 membership state를 잘못 판단할 수 있기 때문이다.

Source address 선택도 protocol마다 다르다. IGMP message의 IPv4 source address는 해당 interface의 primary 또는 preferred IPv4 address를 사용한다. MLD message의 IPv6 source address는 보통 link-local IPv6 address를 사용한다. 다만 IPv6 address가 아직 `Duplicate Address Detection (DAD)` 중인 초기 단계에서는 RFC 3590 규칙에 따라 unspecified address `::`를 source로 쓸 수 있다.

### 9.4.2 IGMP and MLD Processing by Multicast Routers

Multicast router의 `multicast router part`는 group, interface, source list 조합별로 "이쪽 link에 traffic을 받을 member가 하나 이상 있는가"를 판단한다. Router는 query를 보내고, host report를 받아 state를 만든다. 이 state도 `soft state`라서 refresh되지 않으면 시간이 지나 삭제된다. 따라서 multicast membership은 한 번 설정하고 영구히 믿는 database가 아니라, query/report로 계속 유지되는 local control state다.

IGMPv3 query는 group address와 optional source list를 함께 담을 수 있다.

![Figure 9-10](@/assets/images/cs-tcp-ip-illustrated-199-figure-9-10-page-497.png)
*Figure 9-10 · PDF p. 497 · IGMPv3 query format: group address, QRV, QQIC, optional source list 포함*

Query에는 세 가지 variant가 있다.

| Query 종류 | 목적 | Destination |
| --- | --- | --- |
| `general query` | 모든 multicast group에 대한 관심을 갱신 | IPv4 All Hosts `224.0.0.1`, IPv6 link-scope All Nodes `ff02::1` |
| `group-specific query` | 특정 group에 관심이 남아 있는지 확인 | 해당 multicast group address |
| `group-and-source-specific query` | 특정 group/source 조합의 관심을 확인 | 해당 multicast group address |

General query에서는 Group Address field를 `0`으로 둔다. Specific query는 state-change report를 받은 뒤, traffic을 실제로 끊거나 source filter를 적용하기 전에 확인 절차로 사용된다. 예를 들어 마지막 member가 떠났다고 보이는 순간에도 router는 곧바로 forwarding을 중지하지 않고 group-specific 또는 group-and-source-specific query를 재전송해 남은 listener가 없는지 확인한다. 이 과정이 없으면 짧은 packet loss, report loss, host timer jitter 때문에 multicast traffic이 잘못 끊길 수 있다.

`Max Resp Code`는 receiver가 report를 보내기 전 최대 지연 시간을 나타낸다. 값이 128 미만이면 100ms 단위의 선형 값이고, 128 이상이면 exponent/mantissa encoding을 사용한다.

![Figure 9-11](@/assets/images/cs-tcp-ip-illustrated-200-figure-9-11-page-497.png)
*Figure 9-11 · PDF p. 497 · Max Resp Code의 exponential encoding은 긴 응답 지연 범위를 작은 field에 담는다*

작은 Max Resp Code는 leave latency를 줄인다. 즉 마지막 listener가 사라진 뒤 router가 해당 traffic forwarding을 멈추기까지의 시간이 짧아진다. 반대로 큰 값은 host들이 더 넓은 random window 안에서 report를 보내게 하므로 IGMP/MLD report burst를 줄일 수 있다. 이것은 responsiveness와 control traffic load 사이의 trade-off다.

나머지 query field도 router 동작에 중요하다. `QRV (Querier's Robustness Variable)`는 retransmission/robustness 관련 값을 담고, `QQIC (Querier's Query Interval Code)`는 periodic query interval을 초 단위로 encoding한다. `S` flag는 특정 상황에서 router-side timer update를 억제하는 데 쓰인다. 이 값들은 Section 9.4.5의 robustness discussion과 연결된다.

### 9.4.3 Examples

Packet trace 예시는 IGMPv2, IGMPv3, MLDv1, MLDv2가 같은 subnet에서 함께 보일 수 있음을 보여 준다. MLD querier는 IPv6 link-local address `fe80::204:5aff:fe9f:9e80`을 source로 사용하고, 같은 system이 IPv4에서는 `10.0.0.1`을 source로 하는 IGMP querier로 동작한다. 이처럼 dual-stack subnet에서는 IPv4 multicast membership과 IPv6 multicast listener discovery가 별도 protocol로 동시에 진행된다.

MLD query는 `ff02::1` All Nodes로 보내지고 Hop Limit은 1이다. IPv6 destination `ff02::1`은 Ethernet multicast MAC `33:33:00:00:00:01`로 mapping된다. MLD message는 Hop-by-Hop Router Alert option, ICMPv6 header, MLD data를 포함한다. 예시의 default 값은 maximum response delay 10s, `QRV = 2`, query interval 125s다.

MLDv2 report는 SSDP group `ff02::c`에 대한 관심을 `exclude mode`와 empty source list로 표현한다. MLDv1 report는 관심 group 자체를 IPv6 destination으로 사용한다. MLDv2는 하나의 report에서 여러 multicast address record를 담을 수 있어, `ff02::16`, solicited-node address, `ff02::2` All Routers, `ff02::202` ONC RPC 같은 여러 group 관심을 한 번에 전달할 수 있다.

![Figure 9-16](@/assets/images/cs-tcp-ip-illustrated-205-figure-9-16-page-502.png)
*Figure 9-16 · PDF p. 502 · IGMPv3 general membership query는 224.0.0.1로 전송되고 Router Alert option을 포함한다*

IGMPv3 general query 예시에서는 source `10.0.0.1`, destination `224.0.0.1`, destination MAC `01:00:5e:00:00:01`이 사용된다. IPv4 TTL은 1이고, IPv4 header는 Router Alert option 때문에 기본 20 bytes보다 4 bytes 큰 24 bytes다. Group Address field가 `0.0.0.0`이므로 이는 모든 group에 대한 general query다.

Trace의 뒤쪽에는 IGMPv2 report와 IGMPv3 report가 섞여 나타난다. IGMPv2 report는 source-specific 정보를 담지 않고, referenced group address를 destination으로 삼는다. 예시에는 HP 장비 discovery group `224.0.1.60`, UPnP group `239.255.255.250`, LLMNR group `224.0.0.252`, mDNS group `224.0.0.251` 등이 나온다. 여기서 중요한 점은 "같은 LAN에서도 protocol version과 group 용도가 섞여 있고, router는 이를 모두 해석해 soft state를 유지해야 한다"는 것이다.

### 9.4.4 Lightweight IGMPv3 and MLDv2

Full IGMPv3/MLDv2는 group별 include/exclude source list를 모두 표현할 수 있다. 하지만 실제 application은 특정 source를 **block**해야 하는 경우보다, 특정 source를 **include**해야 하는 경우가 훨씬 흔하다. 특히 SSM에서는 "source S가 group G로 보내는 traffic"을 받는 것이 핵심이고, "group G에서 특정 source만 제외"하는 기능은 구현 복잡도에 비해 활용도가 낮다.

이 현실적 trade-off 때문에 `Lightweight IGMPv3 (LW-IGMPv3)`와 `Lightweight MLDv2 (LW-MLDv2)`가 정의되었다. 두 lightweight protocol은 IGMPv3/MLDv2와 message format은 호환되지만, non-null exclude source list를 지원하지 않는다. 즉 `exclude mode`는 source list가 empty일 때만 허용되며, 이는 전통적인 `(*, G)` group join과 같다.

| 표현 | 의미 |
| --- | --- |
| `(*, G)` | group G의 any source traffic에 관심 |
| `(S, G)` | source S가 group G로 보내는 traffic에 관심 |
| `TO_EX({})` | empty source list로 EXCLUDE mode 전환, 일반 group join |
| `TO_IN({})` | empty source list로 INCLUDE mode 전환, group leave |

Lightweight variant에서는 router가 "관심 있는 group"과 "관심 있는 source/group"만 추적하면 된다. 반대로 "원하지 않는 individual source" 목록은 추적하지 않는다. 원문 Table 9-2의 의미를 operation 중심으로 정리하면 다음과 같다.

| Full IGMPv3/MLDv2 | Lightweight | 언제 쓰이는가 |
| --- | --- | --- |
| `IS_EX({})` | `TO_EX({})` | `(*, G)` join에 대한 query response |
| `IS_EX(S)` | 사용 안 함 | non-null EXCLUDE source list는 lightweight에서 제외 |
| `IS_IN(S)` | `ALLOW(S)` | `INCLUDE (S, G)` join에 대한 query response |
| `ALLOW(S)` | `ALLOW(S)` | `INCLUDE (S, G)` join |
| `BLOCK(S)` | `BLOCK(S)` | `INCLUDE (S, G)` leave |
| `TO_IN(S)` | `TO_IN(S)` | `INCLUDE (S, G)` join으로 mode change |
| `TO_IN({})` | `TO_IN({})` | `(*, G)` leave |
| `TO_EX(S)` | 사용 안 함 | non-null EXCLUDE source list는 lightweight에서 제외 |
| `TO_EX({})` | `TO_EX({})` | `(*, G)` join |

Lightweight compliant host는 current-state record인 `IS_EX`와 `IS_IN`을 사실상 state indicator로 쓰지 않는다. 하지만 lightweight multicast router는 full IGMPv3/MLDv2 host와 같은 link에 있을 수 있으므로 이런 message를 수신할 준비는 해야 한다. 다만 non-null source list를 null list처럼 취급하는 식으로 단순화할 수 있다.

### 9.4.5 IGMP and MLD Robustness

IGMP/MLD robustness의 실패 모드는 두 방향이다. 하나는 관심 없는 multicast traffic이 계속 전달되는 것이고, 다른 하나는 받아야 할 multicast traffic이 끊기는 것이다. Protocol은 multicast router failure와 protocol message loss를 주로 다룬다.

같은 link에는 여러 multicast router가 있을 수 있고, 이 중 lowest IP address를 가진 router가 `querier`로 선출된다. Router가 시작할 때는 자신이 querier라고 가정하고 general query를 보낸다. 다른 router의 query를 들으면 source IP address를 자기 주소와 비교하고, 더 작은 주소를 가진 router가 있으면 standby mode로 들어간다. Non-querier router는 `other-querier-present timer`를 유지하며, 일정 시간 query가 보이지 않으면 다시 querier가 될 수 있다.

Querier는 periodic general query를 보내 subnet의 group interest를 갱신한다. 이 주기는 `Query Interval (QI)`로 정해진다. 여러 router가 같은 link에 있을 때 non-querier들은 현재 querier의 interval과 robustness variable을 채택한다. 그래야 querier가 failover되어도 query rate와 retransmission 정책이 갑자기 달라지지 않는다.

Group 또는 source interest가 사라졌다고 판단될 때 router는 forwarding을 바로 멈추지 않고 specific query를 보낸다. 이때 쓰이는 짧은 interval이 `Last Member Query Time (LMQT)` 또는 MLD의 `Last Listener Query Time`이다. LMQT는 leave latency를 결정하는 핵심 값이다. 값이 짧으면 traffic을 빨리 끊을 수 있지만, 손실이나 지연 상황에서 실제 listener를 놓칠 위험이 커진다.

Message loss 대비는 `QRV (Querier's Robustness Variable)`로 조절된다. State-change report와 specific query는 QRV에 따라 소수 회 retransmit된다. Current-state report는 forwarding state를 새로 바꾸기보다 timer refresh 성격이 강하므로 보통 retransmission 보호 대상이 아니다. Wireless link처럼 loss가 많은 환경에서는 QRV를 키워 packet loss tolerance를 높일 수 있지만, 그만큼 control traffic도 늘어난다.

`S` bit는 multiple router 동기화에서 미묘하지만 중요하다. Querier가 specific query를 처음 보낼 때는 S bit를 clear해서 router-side timer를 LMQT로 낮추게 한다. 이후 scheduled retransmission은 S bit를 set해서, 이미 legitimate report가 들어왔을 수 있는 상황에서 non-querier가 timer를 다시 잘못 낮추지 않게 한다. 즉 S bit는 query retransmission은 유지하되 router timer side effect를 억제하는 장치다.

### 9.4.6 IGMP and MLD Counters and Variables

IGMP/MLD는 soft-state protocol이므로 timer와 counter가 사실상 protocol의 뼈대다. 원문 Table 9-3의 주요 값을 기능별로 정리하면 다음과 같다.

| Name | 기본값/식 | 의미 |
| --- | --- | --- |
| `Robustness Variable (RV)` / `QRV` | 2, 0 금지, 1 비권장 | state-change report/query 재전송 여유를 정함. 최대 `RV - 1`회 재전송 |
| `Query Interval (QI)` | 125s | current querier가 general query를 보내는 주기 |
| `Query Response Interval (QRI)` | 10s | report 생성까지 허용되는 최대 응답 시간, Max Response field로 encoding |
| `Group Membership Interval (GMI)` / `Multicast Address Listening Interval (MALI)` | `RV * QI + QRI` | report가 보이지 않을 때 group/source 관심이 없다고 선언하기까지의 시간 |
| `Other Querier Present Interval/Timeout` | `RV * QI + 0.5 * QRI` | non-querier가 active querier 부재를 판단하는 시간 |
| `Startup Query Interval` | `0.25 * QI` | querier 시작 시 빠르게 상태를 수집하는 general query 간격 |
| `Startup Query Count` | `RV` | startup general query 횟수 |
| `Last Member Query Interval (LMQI)` / `Last Listener Query Interval (LLQI)` | 1s | specific query에 대한 응답 대기 시간, leave latency에 직접 관여 |
| `Last Member Query Count` / `Last Listener Query Count` | `RV` | 응답 없이 보낼 specific query 횟수 |
| `Unsolicited Report Interval` | 1s | host initial state-change report 재전송 간격 |
| `Older Version Querier Present Timeout` | `RV * QI + QRI` | old IGMPv1/v2 querier가 안 보이면 IGMPv3로 복귀하기까지 대기 |
| `Older Host Present Interval` / `Older Version Host Present Timeout` | `RV * QI + QRI` | old IGMPv1/v2 host가 안 보이면 IGMPv3 동작으로 복귀하기까지 대기 |

여기서 `cannot be changed`로 표시되는 값들은 독립 parameter가 아니라 RV, QI, QRI 같은 다른 parameter로부터 계산되는 값이다. 그래서 tuning할 때는 derived timer를 직접 바꾸기보다 기본 parameter를 조정하는 방식이 된다.

### 9.4.7 IGMP and MLD Snooping

IGMP/MLD는 원래 IP layer의 router-host protocol이다. 하지만 layer 2 switch가 이 traffic을 전혀 이해하지 못하면 link-layer multicast frame을 spanning tree의 모든 branch로 flood할 수 있고, 이는 broadcast와 비슷한 낭비를 만든다. `IGMP snooping` 또는 `MLD snooping`은 switch가 IGMP/MLD message를 관찰해 어떤 port에 어떤 multicast flow가 필요한지 학습하는 기능이다. Cisco 문맥에서는 `IGS (IGMP snooping)`라는 표현도 쓰인다.

Snooping switch는 multicast router처럼 full routing을 하는 것은 아니지만, host report와 router query를 보고 port별 group interest를 추적한다. 그 결과 multicast frame을 모든 port에 뿌리지 않고 필요한 port로만 forwarding할 수 있다. Switched network에서 unwanted multicast traffic을 크게 줄일 수 있는 실용적 최적화다.

구현에는 함정이 있다. IGMPv1/v2와 MLDv1의 report suppression 때문에, switch가 report를 모든 segment에 그대로 flood하면 어떤 segment의 member가 자기 report를 억제해 switch가 그 segment의 member를 못 볼 수 있다. 그래서 old protocol version을 지원하는 snooping switch는 report를 모든 interface로 broadcast하지 않고 nearest multicast router 쪽으로만 forwarding해야 한다. Multicast router 위치는 Chapter 8의 `Multicast Router Discovery (MRD)`가 있으면 더 쉽게 찾을 수 있다.

MLD snooping은 IGMP snooping보다 parsing이 조심스럽다. IGMP는 IPv4에서 별도 protocol이지만, MLD는 ICMPv6의 일부다. 따라서 MLD-snooping switch는 ICMPv6 packet을 들여다보되, Neighbor Discovery나 error message 등 다른 ICMPv6 기능을 방해하지 않도록 MLD message만 구분해야 한다.

Layer 2 multicast 최적화에는 vendor/proprietary protocol도 있다. 예를 들어 Cisco의 `Router-port Group Management Protocol (RGMP)`는 host뿐 아니라 multicast router도 자신이 관심 있는 group/source를 알리게 해, router 사이의 layer 2 multicast forwarding까지 더 세밀하게 최적화하려는 접근이다.

### 9.5 Attacks Involving IGMP and MLD

IGMP와 MLD는 multicast traffic의 흐름을 제어하는 signaling protocol이다. 그래서 공격도 주로 두 범주로 나타난다. 첫째, multicast forwarding state나 bandwidth를 낭비시키는 resource utilization attack이다. 둘째, malformed packet으로 implementation bug를 건드려 host crash나 remote code execution을 유도하는 attack이다.

가장 단순한 DoS는 많은 high-bandwidth multicast group에 subscribe하는 IGMP/MLD report를 만들어 bandwidth exhaustion을 유발하는 것이다. Router와 switch가 이를 정상 membership으로 받아들이면, 실제로 필요 없는 multicast traffic이 link로 흘러 들어와 다른 traffic을 방해할 수 있다.

더 교묘한 공격은 querier election을 악용한다. Attacker가 낮은 IP address를 source로 query를 보내면, lowest IP address rule 때문에 link의 querier로 선출될 수 있다. 그런 다음 매우 작은 maximum response time, 이상한 robustness variable, 비정상 query interval을 광고하면 host들이 report를 지나치게 빠르게 생성하게 되어 CPU와 control-plane resource를 소모할 수 있다.

Implementation bug 공격도 있었다. Fragmented IGMP packet으로 특정 OS crash를 유도한 사례가 있고, SSM 정보를 담은 crafted IGMP/MLD packet으로 remote code execution 취약점을 건드린 사례도 있다. 다만 IGMP/MLD는 local link 범위의 protocol이므로, 공격자가 target LAN에 on-link 접근권이 없으면 영향이 제한되는 편이다.

### 9.6 Summary

Broadcasting은 network 또는 subnetwork의 모든 node로 traffic을 보내는 방식이고, TCP/IP 문맥에서는 주로 IPv4 local network의 모든 host를 대상으로 한다. Multicasting은 관심 있는 receiver subset에만 traffic을 보내려는 방식이다. IPv4는 broadcast와 multicast를 모두 지원하지만, IPv6는 broadcast를 없애고 multicast를 더 체계적으로 사용한다.

Broadcast는 discovery나 one-to-many delivery에 간단하지만, 관심 없는 host도 packet processing 비용을 치른다. Multicast는 group membership state를 유지해야 해서 더 복잡하지만, 참여하지 않는 host와 필요 없는 link의 overhead를 줄일 수 있다. 이 장의 전체 흐름은 "broadcast의 단순함과 비용"에서 "multicast의 효율과 state 관리 비용"으로 이어진다.

IPv4 broadcast address는 `limited broadcast`와 `directed broadcast`로 나뉜다. Limited broadcast는 `255.255.255.255`이고 local network 밖으로 forwarding되지 않는다. Directed broadcast는 network prefix는 유지하고 host bits를 모두 1로 채워 만든다. Limited broadcast의 outgoing interface 선택은 OS-dependent이고, directed broadcast나 multicast는 host forwarding table을 통해 interface가 결정되는 경우가 일반적이다.

IP multicast는 process가 특정 interface에서 multicast group에 subscribe하는 model이다. IPv4 multicast over Ethernet은 group address의 low-order 23 bits를 `01:00:5e` prefix 뒤에 붙여 MAC destination address를 만든다. IPv6 multicast는 low-order 32 bits를 `33:33` prefix 뒤에 붙인다. 두 mapping 모두 nonunique이므로, NIC filtering 이후에도 IP layer와 upper layer filtering이 필요하다.

IGMP와 MLD는 multicast delivery를 가능하게 하는 local membership protocol이다. Router는 query를 보내고, host는 관심 group/source를 report한다. IGMPv3/MLDv2는 source-specific interest를 표현할 수 있어 SSM을 지원한다. MLD는 ICMPv6의 일부이고, IGMP는 IPv4 위의 독립 protocol이다. Switch는 IGMP/MLD snooping으로 multicast frame flooding을 줄일 수 있다.

Robustness는 timer와 retransmission 변수로 관리된다. `QRV`, `QI`, `QRI`, `LMQI/LLQI`, `GMI/MALI` 같은 값은 loss, router failover, leave latency, control traffic load 사이의 균형을 조정한다. Loss가 많은 link에서는 QRV를 높여 안정성을 올릴 수 있지만, 그만큼 IGMP/MLD message overhead가 증가한다.

### 9.7 References

이 장에서 개념 이해와 직접 연결되는 표준은 다음 정도만 기억해도 충분하다.

| Reference | 연결되는 내용 |
| --- | --- |
| `RFC1112` | IPv4 host extensions for IP multicasting |
| `RFC1122` | IPv4 host requirements, broadcast 관련 host 동작 |
| `RFC2644` | directed broadcast forwarding default 변경, smurf-style amplification 완화 |
| `RFC3376` | IGMPv3 |
| `RFC3590` | MLD source address selection, DAD 중 `::` 사용 |
| `RFC3810` | MLDv2 |
| `RFC4541` | IGMP/MLD snooping switch considerations |
| `RFC5790` | LW-IGMPv3, LW-MLDv2 |
