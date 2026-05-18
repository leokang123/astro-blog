---
title: "Chapter 4. ARP: Address Resolution Protocol"
order: 4
pubDatetime: 2026-05-16T00:04:00+09:00
modDatetime: 2026-05-16T00:04:00+09:00
description: "TCP/IP Illustrated 정리: Chapter 4. ARP: Address Resolution Protocol"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

ARP(Address Resolution Protocol)는 IPv4 address를 link-layer hardware address, 특히 Ethernet-style 48-bit MAC address로 동적으로 변환하는 protocol이다. IP는 32-bit IPv4 address로 목적지를 표현하지만, 같은 LAN에서 실제 frame을 전달하려면 Ethernet driver가 destination MAC address를 알아야 한다. 이 간극을 메우는 것이 ARP이다.

ARP는 IPv4에서만 사용된다. IPv6에서는 같은 역할을 ICMPv6에 포함된 NDP(Neighbor Discovery Protocol)가 수행한다. 따라서 ARP를 이해하면 IPv4 direct delivery, broadcast domain, ARP cache, proxy ARP, gratuitous ARP, address conflict detection, ARP spoofing 같은 LAN 내부 동작과 공격면을 함께 이해할 수 있다.

## 핵심 개념

- address resolution: 한 종류의 address를 다른 종류의 address로 대응시키는 과정이다. 여기서는 IPv4 address에서 MAC address로의 mapping이 중심이다.
- ARP request: 대상 IPv4 address를 가진 host가 누구인지 묻는 link-layer broadcast frame이다.
- ARP reply: 대상 host가 자신의 MAC address를 알려 주는 응답이다. 보통 request sender에게 unicast로 직접 보낸다.
- direct delivery: sender와 destination이 같은 IP prefix/subnet에 있어 router 없이 link-layer frame으로 직접 전달하는 방식이다.
- broadcast domain: ARP request broadcast를 받는 link-layer 범위이다. VLAN이 다르면 보통 같은 ARP broadcast를 받지 않는다.
- ARP cache: IPv4-to-MAC mapping을 일정 시간 저장해 매 packet마다 ARP를 반복하지 않도록 하는 cache이다.

## 세부 정리

### 4.1 Introduction

IP는 다양한 물리/link technology 위에서 동작하도록 설계되었다. 하지만 실제 network interface hardware는 자기 방식의 hardware address를 사용한다. Ethernet이나 802.11 interface는 보통 48-bit MAC address를 가지고, frame은 이 MAC address를 기준으로 전달된다. IPv4 address만 알고 있으면 IP datagram의 논리적 목적지는 알 수 있지만, Ethernet frame의 destination address를 채울 수는 없다.

network-layer address와 link-layer address는 출처와 수명이 다르다.

| 구분 | IPv4 address | MAC/hardware address |
|---|---|---|
| 계층 | network layer | link layer |
| 대표 크기 | 32 bits | Ethernet-style 48 bits |
| 할당 주체 | user, administrator, DHCP 등 network 운영 측 | hardware manufacturer |
| 변경 가능성 | network attachment point가 바뀌면 변경 가능 | 보통 장치 permanent memory에 저장되어 고정 |
| 사용 범위 | routing과 subnet 판단 | 같은 link/broadcast domain의 frame delivery |

이 차이 때문에 같은 IPv4 address를 유지한 채 NIC가 교체되어 MAC address가 바뀔 수도 있고, 반대로 같은 MAC address의 host가 다른 network로 이동하면서 IPv4 address를 바꿀 수도 있다. ARP가 dynamic mapping인 이유가 여기에 있다. 관리자가 mapping table을 수동으로 계속 관리하지 않아도, host들은 ARP request/reply를 통해 현재의 IPv4-to-MAC mapping을 자동으로 배운다.

RARP(Reverse ARP)는 ARP의 반대 방향, 즉 hardware address에서 IP address를 얻으려던 오래된 protocol이다. diskless workstation 같은 환경에서 쓰였지만 오늘날에는 거의 쓰이지 않고, IPv4 address 구성은 DHCP 같은 mechanism과 더 관련이 깊다.

### 4.2 An Example

예시 상황은 browser가 `http://10.0.0.1`에 접속하는 것이다. 여기서는 hostname resolution을 일부러 제외하고, 이미 32-bit IPv4 address `10.0.0.1`을 알고 있을 때 ARP가 언제 필요한지 보여 준다.

host가 가장 먼저 판단하는 것은 destination이 local인지 remote인지다. local, 즉 같은 IP subnet/prefix에 있으면 router를 거치지 않고 direct delivery를 시도한다. remote이면 destination host의 MAC address가 아니라 next-hop router의 MAC address를 알아야 한다. 이 장의 예시는 local Web server, printer, VoIP adapter 같은 embedded device의 built-in Web server에 직접 접속하는 상황과 잘 맞는다.

### 4.2.1 Direct Delivery and ARP

direct delivery는 IP datagram의 목적지가 sender와 같은 IP prefix에 있을 때, router 없이 같은 link 위에서 직접 보내는 방식이다. IPv4 direct delivery에서 ARP가 끼어드는 흐름은 다음과 같다.

1. application이 URL을 해석한다. 여기서는 hostname이 아니라 IPv4 address `10.0.0.1`이 직접 들어 있다.
2. application이 TCP에게 `10.0.0.1`로 connection을 열어 달라고 요청한다.
3. TCP는 connection request segment를 IPv4 datagram에 담아 보내려 한다.
4. IP는 `10.0.0.1`이 같은 subnet에 있다고 판단하고 router 없이 direct delivery를 선택한다.
5. Ethernet-compatible link에서는 IPv4 destination address를 48-bit MAC address로 바꿔야 한다. 이것이 ARP의 역할이다.
6. sender는 ARP request를 link-layer broadcast로 보낸다. 질문은 본질적으로 "IPv4 address `10.0.0.1`을 가진 host라면 자신의 MAC address를 알려 달라"이다.
7. 같은 broadcast domain의 모든 system이 request를 받는다. IP를 쓰지 않는 host도 frame을 받으면 적극적으로 discard해야 한다. 요청된 IPv4 address를 가진 host만 ARP reply를 보낸다.
8. ARP reply는 보통 broadcast가 아니라 requester에게 unicast로 직접 보내진다. requester는 받은 mapping으로 처음 보내려던 IP datagram을 Ethernet frame에 담아 전송한다.

![Figure 4-1](@/assets/images/cs-tcp-ip-illustrated-054-figure-4-1-page-207.png)
*Figure 4-1 · PDF p. 207 · 같은 broadcast domain에서 ARP request가 broadcast되고 대상 host만 ARP reply를 보내는 direct delivery 구조*

ARP의 중요한 제약은 일반적인 형태가 broadcast network를 가정한다는 점이다. ARP request는 "모두에게 물어보기"로 시작하므로, link layer가 한 frame을 모든 attached device에 전달할 수 있어야 한다. NBMA(Non-Broadcast Multiple Access) network에서는 더 복잡한 address mapping protocol이 필요할 수 있다.

ARP는 multi-access IPv4 link에서 쓰인다. 반대로 PPP 같은 point-to-point link는 ARP를 쓰지 않는다. PPP link는 양 끝 peer만 존재하고, link establishment 과정에서 양 끝 address 정보가 설정되므로 hardware address를 발견할 필요가 없다.

### 4.3 ARP Cache

ARP cache 또는 ARP table은 최근에 배운 network-layer address와 hardware address의 mapping을 interface별로 저장한다. ARP request/reply는 broadcast domain에 부담을 주므로, 매 IP datagram마다 ARP를 반복하면 비효율적이다. cache는 이 비용을 줄이고, 한 번 배운 mapping을 일정 시간 재사용하게 한다.

IPv4 address를 hardware address로 mapping한 ARP cache entry의 일반적인 expiration time은 RFC 1122 기준으로 생성 시점부터 20분이다. 이 timeout은 mapping이 영원히 정확하지 않다는 전제를 반영한다. NIC가 바뀌거나 host가 이동하거나 address 설정이 바뀌면, 오래된 mapping을 계속 쓰면 안 된다.

`arp` command는 ARP cache를 확인하는 대표 도구다. Linux와 Windows 모두 `arp -a`로 cache entry를 볼 수 있다. Linux 예시에서는 entry가 host name, hardware type, hardware address, flags, interface로 표시되고, Windows는 interface address와 interface number, Internet Address, Physical Address, Type(dynamic/static)을 보여 준다.

Linux ARP flag의 의미는 다음과 같다.

| Flag | 의미 |
|---|---|
| C | ARP가 동적으로 learned한 entry |
| M | `arp -s` 등으로 수동 입력한 manual/static entry |
| P | publish entry. 들어오는 ARP request에 대해 이 host가 ARP reply를 내보낼 수 있음 |

P flag는 proxy ARP 설정과 연결된다. 즉, 어떤 host가 자기 자신이 아닌 address에 대한 ARP request에도 reply하도록 만들어, 다른 host들이 그 host를 target의 link-layer 대표처럼 보게 할 수 있다.

### 4.4 ARP Frame Format

ARP request/reply는 Ethernet frame payload 안에 들어간다. Ethernet/IPv4 mapping의 경우 Ethernet header 14 bytes 뒤에 ARP protocol field가 오며, ARP 자체의 처음 8 bytes는 address type에 일반적인 형식이고, 뒤쪽 sender/target address field는 protocol과 hardware address size에 따라 길이가 달라진다.

![Figure 4-2](@/assets/images/cs-tcp-ip-illustrated-055-figure-4-2-page-209.png)
*Figure 4-2 · PDF p. 209 · IPv4 address를 48-bit Ethernet MAC address로 mapping할 때의 ARP frame format*

Ethernet/IPv4에서 ARP frame의 주요 field는 다음처럼 해석된다.

| Field | 크기 | 의미 |
|---|---:|---|
| Ethernet DST | 6 bytes | ARP request에서는 보통 broadcast `ff:ff:ff:ff:ff:ff`, reply에서는 requester MAC |
| Ethernet SRC | 6 bytes | frame sender의 MAC address |
| Length/Type | 2 bytes | ARP EtherType `0x0806` |
| Hardware Type | 2 bytes | link-layer address type. Ethernet은 `1` |
| Protocol Type | 2 bytes | mapping하려는 protocol. IPv4는 `0x0800` |
| Hardware Size | 1 byte | hardware address 길이. Ethernet MAC은 `6` |
| Protocol Size | 1 byte | protocol address 길이. IPv4는 `4` |
| Op | 2 bytes | ARP request `1`, ARP reply `2` |
| Sender Hardware Address | 6 bytes | sender MAC address |
| Sender Protocol Address | 4 bytes | sender IPv4 address |
| Target Hardware Address | 6 bytes | target MAC address. request에서는 모르는 값이라 보통 0 |
| Target Protocol Address | 4 bytes | 찾고 싶은 target IPv4 address |
| Pad/FCS | variable/4 bytes | Ethernet minimum frame size 보정과 CRC |

ARP가 generic protocol이라고 하는 이유는 Hardware Type, Protocol Type, Hardware Size, Protocol Size가 address 종류와 길이를 명시하기 때문이다. 다만 실제 TCP/IP 환경에서는 거의 항상 IPv4 address와 Ethernet-style MAC address 사이의 mapping으로 쓰인다.

ARP request에서는 Target Hardware Address가 아직 알려지지 않았으므로 0으로 채워진다. 요청을 받은 target host는 자기 hardware address를 채우고, sender/target address 쌍을 서로 바꾸고, Op field를 ARP reply `2`로 설정해 응답한다. sender hardware address가 Ethernet header에도 있고 ARP payload에도 들어가는 중복이 있지만, ARP message 자체가 address mapping 정보를 전달해야 하므로 payload 안에도 sender address가 명시된다.

### 4.5 ARP Examples

책의 예시는 `telnet 10.0.0.3 www`로 local Web server의 TCP port 80에 연결하면서 `tcpdump -e`로 실제 Ethernet/ARP traffic을 관찰한다. 여기서 중요한 점은 ARP가 application protocol과 직접 무관하다는 것이다. Telnet을 쓰든 HTTP client를 쓰든, local IPv4 address로 첫 IP datagram을 보내려는 순간 destination MAC address가 cache에 없으면 ARP가 먼저 발생한다.

### 4.5.1 Normal Example

정상적인 ARP 흐름은 다음 순서로 관찰된다.

| 순서 | 관찰 내용 | 의미 |
|---:|---|---|
| 1 | `arp who-has 10.0.0.3 tell 10.0.0.56` | sender `10.0.0.56`이 target IPv4 address의 MAC을 broadcast로 질문 |
| 2 | `arp reply 10.0.0.3 is-at 0:0:c0:c2:9b:26` | target host가 자신의 MAC address를 requester에게 unicast reply |
| 3 | 첫 TCP SYN segment 전송 | 이제 destination MAC address를 알기 때문에 실제 IP datagram을 Ethernet frame에 담아 전송 |
| 4 | server의 TCP SYN+ACK | server도 requester의 MAC mapping을 이미 알고 있으므로 별도 ARP 없이 응답 가능 |

ARP request의 Ethernet destination은 `ff:ff:ff:ff:ff:ff`이다. 이는 같은 broadcast domain의 모든 Ethernet interface가 frame을 받는다는 뜻이다. ARP frame의 Ethernet Type은 `0x0806`이고, ARP request/reply 자체는 Ethernet header 14 bytes + ARP message 28 bytes = 42 bytes이다. 하지만 Ethernet minimum frame size 때문에 data portion은 padding되어 tcpdump에는 60 bytes로 보이고, 실제 wire에는 여기에 4-byte CRC가 더 붙는다.

예시에서 ARP request와 ARP reply 사이의 시간은 약 2.2ms, ARP reply 뒤 첫 TCP segment 전송까지는 약 0.7ms이다. 즉 cache miss가 있을 때 ARP overhead가 생기지만, local LAN에서는 보통 몇 ms 수준이다. 만약 sender의 ARP cache에 `10.0.0.3` mapping이 이미 valid했다면 첫 ARP exchange 없이 TCP SYN을 바로 보냈을 것이다.

미묘하지만 중요한 optimization이 있다. target host는 자신에게 온 ARP request를 처리하면서 requester의 Sender Protocol Address와 Sender Hardware Address를 자기 ARP cache에 저장한다. 따라서 target이 곧바로 reply traffic을 보낼 때 requester에 대해 다시 ARP request를 하지 않아도 된다. "나에게 묻는 host는 곧 나에게 data를 보낼 가능성이 높고, 나는 다시 응답할 가능성이 높다"는 실용적 가정이다.

### 4.5.2 ARP Request to a Nonexistent Host

같은 subnet에 있다고 판단한 IPv4 address가 실제로 존재하지 않으면, sender는 ARP request를 보내지만 reply를 받지 못한다. 예시에서는 `10.0.0.99`로 접속을 시도하고, `arp -a`에서 해당 entry가 `<incomplete>`로 표시된다.

tcpdump에서는 약 1초 간격으로 세 번의 ARP request가 관찰된다. 이는 RFC 1122가 권장하는 최대 빈도에 가깝다. 구현체마다 재시도 간격은 다를 수 있다. 책은 Windows에서 ICMP/UDP는 약 5초, TCP는 약 10초 간격을 보일 수 있다고 설명한다. TCP의 경우 두 번 정도 ARP request가 실패하면 connection establishment 자체를 포기할 수 있다.

이 사례는 두 가지를 보여 준다.

- local subnet으로 판단되면 routing 문제가 아니라 address resolution 실패만으로도 application에는 `No route to host`처럼 보일 수 있다.
- ARP는 "없는 host"를 확정적으로 증명하는 protocol이 아니라, 일정 시간 동안 응답이 없으면 실패로 간주하는 timeout/retry 기반 동작이다.

### 4.6 ARP Cache Timeout

ARP cache entry에는 timeout이 붙는다. 일반적인 구현에서는 completed entry는 약 20분, incomplete entry는 약 3분 timeout을 가진다. 많은 구현은 entry가 사용될 때마다 20분 timer를 다시 시작한다. RFC 1122는 사용 중이어도 timeout이 발생해야 한다고 말하지만, 실제 구현은 entry reference 시 timeout을 refresh하는 경우가 많다.

ARP cache는 soft state의 좋은 예다. soft state는 timeout 전에 refresh되지 않으면 버려지는 상태 정보이다. network condition이 바뀌었을 때 자동 재구성을 가능하게 하지만, 상태를 유지하려면 refresh 비용이 든다. ARP cache는 mapping이 계속 유효하다고 영원히 가정하지 않고, 필요하면 다시 ARP request를 보내 재학습한다.

### 4.7 Proxy ARP

Proxy ARP는 어떤 system, 보통 router가 다른 host를 대신해 ARP request에 응답하는 기능이다. requester는 응답한 system이 실제 destination이라고 믿지만, 실제 destination은 그 뒤의 다른 network에 있을 수 있다. 즉 proxy ARP는 link-layer 관점에서 "나에게 보내면 내가 알아서 넘겨 줄게"라는 illusion을 만든다.

역사적으로 proxy ARP는 promiscuous ARP 또는 ARP hack이라고도 불렸다. 과거에는 subnetting을 제대로 처리하지 못하는 system이나 오래된 broadcast address convention을 사용하는 system 때문에, 두 physical network가 같은 IP prefix를 쓰는 것처럼 숨기기 위해 사용되었다. 가운데 router가 한쪽 network에서 다른쪽 host에 대한 ARP request를 대신 받아 응답하면, sender는 router를 destination MAC으로 삼아 frame을 보내고 router는 실제 host 쪽으로 넘긴다.

Proxy ARP는 편리해 보이지만 일반적으로 피하는 것이 좋다.

| 장점 | 비용/위험 |
|---|---|
| host 설정을 덜 바꾸고 network 구조를 숨길 수 있음 | 실제 L3 boundary가 흐려져 troubleshooting이 어려움 |
| subnetting을 모르는 오래된 host를 우회 지원 가능 | ARP cache와 routing 이해가 꼬이기 쉬움 |
| 일부 migration 상황에서 임시 해법 가능 | security policy와 broadcast domain 인식이 어긋날 수 있음 |

Linux의 auto-proxy ARP는 `/proc/sys/net/ipv4/conf/*/proxy_arp` 또는 `sysctl`로 켤 수 있으며, 모든 IPv4 address를 수동 publish entry로 넣지 않고 range 단위 proxy를 가능하게 한다. 하지만 구조를 숨기는 기술인 만큼 설계상 꼭 필요한지 먼저 따져야 한다.

### 4.8 Gratuitous ARP and Address Conflict Detection (ACD)

Gratuitous ARP는 host가 자기 자신의 IPv4 address를 target으로 삼아 ARP request를 보내는 동작이다. 보통 interface가 bootstrap 시점에 configured up 될 때 발생한다. 예를 들어 `10.0.0.56`을 가진 host가 `arp who-has 10.0.0.56 tell 10.0.0.56` 형태의 request를 broadcast한다. 이때 Sender Protocol Address와 Target Protocol Address가 같다.

Gratuitous ARP의 목적은 두 가지다.

| 목적 | 설명 |
|---|---|
| duplicate IPv4 address 감지 | 같은 broadcast domain에 이미 같은 IPv4 address를 쓰는 host가 있으면 reply가 올 수 있다. 그러면 Duplicate IP address 경고를 낼 수 있다. |
| ARP cache 갱신 유도 | host의 hardware address가 바뀌었을 때, request를 받은 다른 host들이 기존 ARP cache entry를 새 sender hardware address로 갱신할 수 있다. |

다만 gratuitous ARP는 conflict를 알려 줄 수는 있어도, 어떻게 반응할지까지 강제하지 않는다. 이를 더 체계화한 것이 ACD(Address Conflict Detection, RFC 5227)이다.

ACD는 ARP probe와 ARP announcement를 정의한다.

| 항목 | Sender Protocol Address | Target Protocol Address | 목적 |
|---|---|---|---|
| ARP probe | `0.0.0.0` | candidate IPv4 address | candidate address가 이미 사용 중인지 확인 |
| ARP announcement | candidate IPv4 address | candidate IPv4 address | 이제 이 address를 사용하겠다고 broadcast domain에 알림 |
| Gratuitous ARP | own IPv4 address | own IPv4 address | 중복 감지 및 cache 갱신 유도. ACD probe보다 cache pollution 가능성이 큼 |

ARP probe에서 Sender Protocol Address를 `0.0.0.0`으로 두는 이유는 cache pollution을 피하기 위해서다. candidate address가 이미 다른 host에 의해 사용 중일 수 있는데, probe sender가 그 address를 sender로 넣어 버리면 다른 host들의 ARP cache를 잘못 오염시킬 수 있다.

ACD 절차는 다음처럼 진행된다.

1. interface가 up 되거나 sleep에서 깨어나거나, wireless association처럼 새 link가 만들어지면 ACD를 시작한다.
2. 0-1초 사이의 random delay를 둔다. 여러 host가 동시에 켜질 때 ARP probe burst를 줄이기 위한 것이다.
3. 최대 세 개의 ARP probe를 보내며, probe 사이에는 1-2초 random delay를 둔다.
4. probe에 대한 reply가 오면 다른 host가 candidate address를 이미 사용 중이라는 뜻이다.
5. 다른 host가 같은 candidate address를 Target Protocol Address로 probe하는 request를 보내도 conflict로 본다.
6. conflict가 없으면 두 개의 ARP announcement를 2초 간격으로 보내, 기존 cache mapping을 갱신하게 한다.

ACD는 한 번만 하는 절차가 아니라 ongoing process이다. host는 address를 사용하기 시작한 뒤에도 incoming ARP request/reply를 살펴보고, 자기 address가 Sender Protocol Address에 나타나는지 확인한다. conflict가 발견되면 address 사용 중지, defensive ARP announcement 후 계속 사용, 또는 고정 address가 반드시 필요한 embedded device처럼 conflict에도 계속 사용 중 하나를 선택할 수 있다.

RFC 5227은 일부 ARP reply를 link-layer broadcast로 보내는 이점도 언급한다. 전통적으로 ARP reply는 unicast지만, broadcast reply는 conflict 상황에서 모든 station이 더 빨리 cache를 invalidate하게 할 수 있다. 대신 같은 segment의 모든 station이 더 많은 ARP traffic을 처리해야 한다.

### 4.9 The arp Command

`arp` command는 ARP cache를 보고 조작하는 도구다.

| Option | 의미 |
|---|---|
| `arp -a` | ARP cache의 모든 entry 표시 |
| `arp -d` | cache entry 삭제. 다음 통신 때 ARP exchange를 강제로 다시 일으키는 데 유용 |
| `arp -s` | IPv4 address와 Ethernet address mapping을 수동 추가 |
| `temp` | Linux에서 `arp -s`로 추가한 entry를 temporary entry로 만들어 timeout되게 함 |
| `pub` | Linux에서 해당 entry에 대해 ARP responder처럼 동작하도록 함 |

`arp -s`로 추가한 entry는 보통 semipermanent이다. cache timeout으로 사라지지는 않지만 reboot하면 사라진다. Linux에서 `pub` keyword를 쓰면 system이 해당 IPv4 address에 대한 ARP request에 응답한다. 이것은 proxy ARP와 직접 연결된다. 특히 `arp -s`로 proxy ARP를 켜면 `/proc/sys/net/ipv4/conf/*/proxy_arp` 값이 0이어도 지정된 address에 대해 응답할 수 있다.

### 4.10 Using ARP to Set an Embedded Device's IPv4 Address

keyboard나 display가 없는 embedded Ethernet device는 처음 IPv4 address를 설정하기 어렵다. 일반적으로는 DHCP를 쓰는 것이 자연스럽지만, 일부 장치는 ARP를 이용한 수동 설정 방식을 지원한다.

절차는 다음과 같다.

1. device의 MAC address를 확인한다. 보통 장치 라벨이나 serial number로 표시된다.
2. 관리 host에서 `arp -s <새 IPv4 address> <device MAC address>`로 ARP cache entry를 수동 생성한다.
3. 관리 host가 해당 IPv4 address로 IP packet을 보낸다.
4. ARP entry가 이미 있으므로 ARP request/reply 없이 device MAC address로 Ethernet frame이 바로 전송된다.
5. device는 자기 MAC address로 온 frame 안의 destination IPv4 address를 보고, 이를 initial IPv4 address로 설정한다.
6. 이후 embedded Web server 같은 일반 설정 수단으로 나머지 configuration을 진행한다.

이 방식은 ARP의 원래 목적은 아니다. ARP는 address를 "설정"하는 protocol이 아니라 address mapping을 찾는 protocol이다. 다만 수동 ARP entry와 첫 IP packet을 결합하면, 아직 IP address를 모르는 device에게 초기 address를 알려 주는 bootstrap trick으로 사용할 수 있다.

### 4.11 Attacks Involving ARP

ARP는 같은 broadcast domain 안의 host들이 서로의 address mapping을 알려 주는 단순한 protocol이다. 기본 설계에는 강한 authentication이 없기 때문에, 공격자는 거짓 ARP response나 proxy ARP 동작을 이용해 traffic을 자기 쪽으로 유도할 수 있다.

대표 공격은 다음과 같다.

| 공격 | 원리 | 결과 |
|---|---|---|
| proxy ARP masquerading | 공격자가 다른 host를 대신해 ARP request에 응답 | victim이 없으면 쉽게 들키지 않고, attacker MAC으로 traffic 유도 |
| duplicate reply | 실제 host와 attacker가 모두 reply | 하나의 ARP request에 여러 reply가 생겨 탐지 가능성 증가 |
| ARP entry leakage | multi-homed host에서 한 interface의 ARP entry가 다른 interface table에 섞이는 bug 이용 | traffic이 잘못된 network segment로 이동 |
| static entry overwrite | static ARP entry도 unsolicited ARP reply로 덮어쓰는 구현 취약점 이용 | 보안을 위해 넣은 static mapping이 attacker mapping으로 바뀜 |

Linux의 `/proc/sys/net/ipv4/conf/*/arp_filter`는 multi-homed host에서 ARP response를 더 엄격히 제한하는 데 쓰일 수 있다. 값이 1이면 ARP request가 들어온 interface와, requestor에게 IP datagram을 되돌려 보낼 때 선택될 interface를 비교한다. 둘이 다르면 ARP response를 억제하고 request를 drop한다. 이는 "이 interface로 들어온 ARP에 정말 이 interface에서 답해야 하는가?"를 IP forwarding 관점으로 검증하는 것이다.

static ARP entry는 종종 보안책처럼 생각되지만 완전한 방어가 아니다. 많은 구현은 과거에 static entry조차 ARP reply로 갱신해 버렸다. 특히 host가 보내지 않은 ARP request에 대한 unsolicited ARP reply까지 받아들인다면, attacker는 victim의 ARP cache를 공격자 MAC address로 오염시킬 수 있다. 이것이 ARP spoofing 또는 ARP cache poisoning의 기본 감각이다.

ARP attack의 근본 문제는 "mapping 정보를 말하는 쪽이 진짜인지 검증하지 않는다"는 것이다. 따라서 중요한 traffic은 ARP 자체를 믿기보다 상위 계층에서 TLS, SSH, IPsec 같은 strong security를 사용해야 한다. ARP 수준에서는 port security, dynamic ARP inspection, static binding, VLAN 분리, monitoring 같은 switch/운영 정책이 보조 방어가 된다.

### 4.12 Summary

ARP는 IPv4 host가 같은 local subnet 안의 target 또는 next-hop router로 frame을 보내기 위해 IPv4 address를 MAC address로 바꾸는 기본 protocol이다. application이나 user는 보통 ARP를 의식하지 않지만, 첫 datagram 전송 전에 cache miss가 있으면 ARP request/reply가 먼저 일어난다.

ARP cache는 ARP의 효율을 결정한다. completed entry와 incomplete entry에는 timeout이 있으며, 이 soft state 덕분에 mapping 변화가 시간이 지나면 자동으로 반영된다. `arp` command는 cache를 확인하고, 삭제하고, 수동 entry를 추가하고, proxy ARP 동작을 설정할 수 있다.

normal ARP는 broadcast request와 unicast reply를 기본으로 한다. nonexistent host에 대해서는 retry 후 incomplete entry가 남고, proxy ARP는 router가 다른 host를 대신해 응답하도록 한다. gratuitous ARP는 자기 address를 대상으로 request를 보내 중복 address 감지와 cache 갱신을 돕고, ACD는 ARP probe와 ARP announcement로 IPv4 address conflict를 더 체계적으로 탐지한다.

ARP는 단순하고 널리 쓰이지만 보안적으로 약하다. 인증 없는 mapping update, proxy ARP, static entry overwrite 문제는 higher-layer security와 L2 운영 정책이 왜 필요한지를 보여 준다.

## 연결 관계

- Chapter 2 IPv4 address/subnet: direct delivery 여부는 sender와 destination이 같은 IPv4 prefix에 있는지 판단하는 데서 시작한다.
- Chapter 3 Link Layer: ARP request는 Ethernet broadcast frame이고, VLAN/broadcast domain 경계는 ARP가 도달하는 범위를 결정한다.
- Chapter 5 IP forwarding: remote destination으로 보낼 때는 최종 destination MAC이 아니라 next-hop router의 MAC address를 ARP로 찾는다.
- Chapter 6 DHCP: IPv4 address를 얻는 과정과 ACD/ARP probe가 연결된다. DHCP로 받은 address가 충돌하는지 확인할 수 있다.
- Chapter 8 ICMPv6/NDP: IPv6는 ARP 대신 ICMPv6 Neighbor Discovery Protocol을 사용한다.
- Chapter 18 Security: ARP spoofing/cache poisoning은 상위 계층 authentication/encryption의 필요성을 보여 준다.

## 오해하기 쉬운 내용

- ARP는 IP address를 "할당"하는 protocol이 아니다. embedded device 설정 사례는 ARP를 이용한 bootstrap trick에 가깝다.
- ARP는 같은 broadcast domain 안에서만 정상적으로 동작한다. router 너머의 final destination MAC address를 직접 찾는 protocol이 아니다.
- ARP reply는 보통 unicast이지만, gratuitous ARP/ACD와 일부 broadcast reply 논의처럼 예외적 변형이 있다.
- static ARP entry가 항상 안전한 것은 아니다. 구현에 따라 ARP reply가 static entry를 덮어쓸 수 있었다.
- Gratuitous ARP와 ACD는 비슷하지만 다르다. ACD probe는 Sender Protocol Address를 `0.0.0.0`으로 두어 cache pollution을 피한다.
- Proxy ARP는 routing을 없애는 것이 아니라, routing boundary를 link-layer illusion으로 숨기는 방식이다.

## 면접 질문

1. ARP가 필요한 이유를 IPv4 address와 MAC address의 차이로 설명하라.
2. direct delivery와 ARP의 관계를 `10.0.0.56 -> 10.0.0.3` 예시로 설명하라.
3. ARP request와 ARP reply의 Ethernet destination address는 일반적으로 어떻게 다른가?
4. ARP frame에서 Hardware Type, Protocol Type, Hardware Size, Protocol Size가 필요한 이유는 무엇인가?
5. ARP cache가 없으면 어떤 비효율이 생기며, timeout이 필요한 이유는 무엇인가?
6. nonexistent host에 대한 ARP request는 어떤 흔적을 남기고, application에는 어떻게 보일 수 있는가?
7. ARP cache가 soft state라는 말의 의미를 설명하라.
8. Proxy ARP가 어떻게 sender를 속이며, 왜 일반적으로 피하는 것이 좋은가?
9. Gratuitous ARP의 두 목적을 설명하라.
10. ACD의 ARP probe에서 Sender Protocol Address를 `0.0.0.0`으로 두는 이유는 무엇인가?
11. `arp -a`, `arp -d`, `arp -s`, `pub`의 역할을 설명하라.
12. ARP로 embedded device의 초기 IPv4 address를 설정하는 원리를 설명하라.
13. ARP spoofing 또는 ARP cache poisoning이 가능한 근본 이유는 무엇인가?
14. ARP attack을 막기 위해 link layer와 higher layer에서 각각 어떤 방어가 가능한가?
