---
title: "Chapter 8. ICMPv4 and ICMPv6: Internet Control Message Protocol"
order: 8
pubDatetime: 2026-05-17T00:11:00+09:00
modDatetime: 2026-05-17T00:11:00+09:00
description: "TCP/IP Illustrated 정리: Chapter 8. ICMPv4 and ICMPv6: Internet Control Message Protocol"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

`ICMP (Internet Control Message Protocol)`는 IP packet이 목적지에 도달하지 못했을 때 그 이유를 알려 주거나, 경로/주소/이웃/라우터 같은 IP 계층 운영 정보를 전달하기 위해 IP와 함께 쓰이는 control protocol이다. ICMP는 IP datagram 안에 실리지만, 순수 transport protocol도 아니고 일반 application protocol도 아니다. IP layer와 upper-layer protocol 사이에 걸쳐 error, diagnostic, configuration information을 전달한다.

중요한 점은 ICMP가 IP를 reliable하게 만들어 주지는 않는다는 것이다. packet drop의 흔한 원인인 router buffer overrun은 ICMP를 만들지 않을 수 있고, ICMP 자체도 delivery를 보장하지 않는다. 대신 ICMP는 "어떤 종류의 실패가 관찰되었다", "다른 router를 써라", "packet이 너무 크다", "이 neighbor/router를 확인하라" 같은 control signal을 제공한다.

IPv4에서 ICMPv4는 error reporting과 일부 query 기능이 중심이지만, IPv6에서 `ICMPv6`는 훨씬 더 중요하다. ICMPv6는 error reporting뿐 아니라 `Neighbor Discovery (ND)`, Router Discovery, multicast address management, Mobile IPv6 handoff 관련 기능까지 담당한다. 그래서 ICMPv6를 무조건 firewall에서 막으면 ping/traceroute만 깨지는 것이 아니라 IPv6 주소 설정과 neighbor resolution 자체가 망가질 수 있다.

## 핵심 개념

- ICMPv4: IPv4와 함께 쓰이는 ICMP. IPv4 Protocol field 값 `1`로 표시된다.
- ICMPv6: IPv6와 함께 쓰이는 ICMP. IPv6 Next Header 값 `58`로 표시된다.
- error message: IP datagram delivery 문제를 알리는 ICMP message다.
- query/informational message: 정보 조회, 진단, configuration에 쓰이는 ICMP message다.
- Type/Code: ICMP message의 종류와 세부 의미를 나타내는 8-bit field들이다.
- Checksum: ICMP message 무결성을 확인하는 16-bit checksum이다. ICMPv6는 IPv6 pseudo-header까지 포함한다.
- offending datagram: ICMP error를 유발한 원래 IP datagram의 일부 또는 전체 copy다.
- Neighbor Discovery (ND): IPv6에서 ARP, Router Discovery, address autoconfiguration 지원, reachability 확인 등을 수행하는 ICMPv6 기반 기능이다.
- PMTUD(Path MTU Discovery): packet이 너무 커 fragment가 불가능할 때 ICMP error를 이용해 path MTU를 알아내는 메커니즘이다.

## 세부 정리

### 8.1 Introduction

IP protocol만으로는 sender가 packet의 운명을 직접 알 수 없다. packet이 어느 router에서 막혔는지, destination에 protocol/port가 없는지, hop limit이 다 되었는지, path MTU가 얼마인지 같은 정보는 별도 control feedback이 필요하다. ICMP는 이 빈틈을 채운다.

ICMP message는 보통 IP layer, TCP/UDP 같은 transport layer, 또는 user application이 처리한다. 예를 들어 TCP는 일부 ICMP error를 connection 동작에 반영할 수 있고, `ping`은 Echo Request/Reply를 user에게 보여 준다. 반면 Redirect는 host routing table을 자동 갱신할 수 있고, Packet Too Big/Fragmentation Needed는 PMTUD에 사용된다.

보안상 ICMP는 양면적이다. 공격자가 host/router behavior를 유도하거나 정보를 수집하는 데 악용할 수 있어 firewall에서 제한하는 경우가 많다. 하지만 ICMP를 과도하게 막으면 `ping`, `traceroute`, PMTUD, IPv6 ND/RA 같은 정상 기능도 깨진다. 특히 IPv6에서는 ICMPv6를 IP layer 운영의 일부로 취급해야 한다.

### 8.1.1 Encapsulation in IPv4 and IPv6

ICMP message는 IP datagram payload로 encapsulation된다. IPv4에서는 IP header의 Protocol field가 `1`이면 ICMPv4이고, IPv6에서는 extension header들을 지난 뒤 Next Header field가 `58`이면 ICMPv6다.

![Figure 8-1](@/assets/images/cs-tcp-ip-illustrated-126-figure-8-1-page-393.png)
*Figure 8-1 · PDF p. 393 · IPv4 Protocol=1, IPv6 Next Header=58로 ICMP message가 encapsulation되는 구조*

ICMP message 자체는 IP datagram처럼 fragmentation될 수 있지만 흔한 일은 아니다. ICMP error message는 대개 원래 packet 일부를 payload로 담기 때문에, fragmentation이나 MTU 제한과 함께 다룰 때 주의가 필요하다.

### 8.2 ICMP Messages

ICMP message는 크게 두 종류다.

| 분류 | 의미 | 대표 예 |
|---|---|---|
| error message | IP datagram delivery 또는 processing 실패를 보고 | Destination Unreachable, Time Exceeded, Parameter Problem |
| query/informational message | 정보 조회, 진단, configuration | Echo Request/Reply, Router Solicitation/Advertisement, Neighbor Solicitation/Advertisement |

모든 ICMPv4/ICMPv6 message는 처음 4 bytes가 공통이다. `Type`이 message family를 정하고, `Code`가 그 안의 세부 이유를 정한다. `Checksum`은 ICMP message 전체를 보호한다.

![Figure 8-2](@/assets/images/cs-tcp-ip-illustrated-127-figure-8-2-page-394.png)
*Figure 8-2 · PDF p. 394 · ICMP 공통 header: Type, Code, Checksum 뒤에 message-specific content가 붙음*

ICMPv4 checksum은 ICMPv4 message 전체를 덮는다. ICMPv6 checksum은 ICMPv6 message뿐 아니라 IPv6 header에서 만든 pseudo-header, 즉 Source/Destination IPv6 Address, Length, Next Header까지 포함한다. ICMP message checksum이 틀리면 message는 조용히 discard된다. 잘못된 ICMP checksum을 알리기 위한 또 다른 ICMP error는 만들지 않는다.

### 8.2.1 ICMPv4 Messages

ICMPv4는 역사적으로 많은 Type이 정의되었지만, 실제로 자주 쓰이는 것은 일부다. query/informational message로는 `Echo Request(type 8)`, `Echo Reply(type 0)`, `Router Advertisement(type 9)`, `Router Solicitation(type 10)`이 중요하다. error message로는 `Destination Unreachable(type 3)`, `Redirect(type 5)`, `Time Exceeded(type 11)`, `Parameter Problem(type 12)`이 핵심이다.

| ICMPv4 Type | 이름 | 분류 | 핵심 용도 |
|---|---|---|---|
| 0 | Echo Reply | informational | ping reply |
| 3 | Destination Unreachable | error | host/protocol/port unreachable, fragmentation needed |
| 5 | Redirect | error | 더 나은 router 사용 지시 |
| 8 | Echo Request | informational | ping request |
| 9/10 | Router Advertisement/Solicitation | informational | router discovery |
| 11 | Time Exceeded | error | TTL exceeded, fragment reassembly timeout |
| 12 | Parameter Problem | error | malformed header 또는 parameter 문제 |

ICMPv4의 일부 message는 Code field를 적극적으로 사용한다. 예를 들어 Destination Unreachable type 3 안에서도 code 1은 Host Unreachable, code 3은 Port Unreachable, code 4는 Fragmentation Needed and DF Set을 의미한다. 이 code 차이가 transport protocol이나 PMTUD 동작을 바꾼다.

### 8.2.2 ICMPv6 Messages

ICMPv6는 설계가 더 정리되어 있다. Type 값의 high-order bit로 error와 informational을 구분한다.

| ICMPv6 Type 범위 | 분류 | 의미 |
|---|---|---|
| 0-127 | error messages | Destination Unreachable, Packet Too Big, Time Exceeded, Parameter Problem |
| 128-255 | informational messages | Echo, MLD, RS/RA, NS/NA, Redirect, Mobile IPv6, SEND 등 |

ICMPv6의 대표 error message는 `Destination Unreachable(type 1)`, `Packet Too Big(type 2)`, `Time Exceeded(type 3)`, `Parameter Problem(type 4)`이다. 대표 informational/control message는 `Echo Request/Reply(type 128/129)`, `Multicast Listener Query/Report/Done(type 130/131/132)`, `Router Solicitation/Advertisement(type 133/134)`, `Neighbor Solicitation/Advertisement(type 135/136)`, `Redirect(type 137)`이다.

ICMPv6는 ICMPv4와 달리 ND message에서 options를 사용한다. Source/Target Link-Layer Address option, Prefix Information option, MTU option, Redirected Header option, SEND 관련 CGA/RSA Signature/Timestamp/Nonce option 등이 이 장 뒤쪽에서 중요해진다.

### 8.2.3 Processing of ICMP Messages

ICMP message 처리 방식은 system마다 다르지만 일반 원칙은 있다. informational request는 OS가 자동 처리하는 경우가 많고, error message는 error를 유발한 upper-layer process나 TCP/UDP 같은 transport protocol로 전달될 수 있다. Redirect와 Fragmentation Needed/Packet Too Big은 예외적으로 host routing table 또는 PMTUD 동작에 직접 영향을 줄 수 있다.

ICMPv6 처리 규칙은 더 엄격하다.

1. unknown ICMPv6 error message는 가능하면 error를 유발한 upper-layer process로 전달한다.
2. unknown ICMPv6 informational message는 drop한다.
3. ICMPv6 error message는 전체 IPv6 datagram이 최소 IPv6 MTU `1280 bytes`를 넘지 않는 범위에서 offending datagram을 가능한 많이 포함한다.
4. error message 안의 offending packet에서 upper-layer protocol을 찾아 해당 process에 전달한다. 찾을 수 없으면 IPv6-layer 처리 후 조용히 drop한다.
5. ICMP error 생성에는 특수 제한 규칙이 있다.
6. IPv6 node는 ICMPv6 error message 생성 rate를 제한해야 한다. token bucket 같은 방식이 쓰일 수 있다.

### 8.3 ICMP Error Messages

ICMP error message는 “문제를 발견했으니 알려 준다”는 단순한 기능처럼 보이지만, 생성 조건이 매우 조심스럽게 제한된다. 이유는 broadcast storm과 error loop를 막기 위해서다. 예를 들어 error message에 다시 error message로 응답하면 네트워크 안에서 오류가 오류를 낳는 cascade가 만들어질 수 있다.

ICMPv4 error message는 다음 상황에 대해 생성하지 않는다.

| ICMPv4 error를 만들지 않는 입력 | 이유 |
| --- | --- |
| 다른 ICMPv4 error message | error에 대한 error loop 방지 |
| IPv4 broadcast address 또는 IPv4 multicast address 대상 datagram | 다수 host가 동시에 반응하는 broadcast storm 방지 |
| link-layer broadcast로 전송된 datagram | 같은 이유로 대량 응답 방지 |
| 첫 fragment가 아닌 fragment | transport header/port를 식별하기 어렵고 중복 error 방지 |
| source address가 단일 host를 가리키지 않는 datagram | zero address, loopback, broadcast, multicast source에 대한 부정확한 응답 방지 |

ICMPv6도 같은 철학을 따른다. ICMPv6 error message, ICMPv6 Redirect message에 대해서는 error를 만들지 않으며, IPv6 multicast address 대상 packet, link-layer multicast/broadcast frame, 단일 node를 식별하지 않는 source address에 대해서도 원칙적으로 error를 만들지 않는다. 다만 IPv6 multicast와 link-layer multicast/broadcast 예외로 `Packet Too Big (PTB)`와 `Parameter Problem (code 2)`가 허용된다. IPv6에서는 PTB가 PMTUD의 핵심 신호이기 때문에 multicast 상황에서도 완전히 막으면 실제 전송 가능 MTU를 알 수 없게 된다.

또 하나의 핵심 규칙은 rate limiting이다. RFC4443은 ICMP message 생성을 제한하는 방법으로 token bucket을 예로 든다. bucket에는 최대 `B`개의 token이 있고, 시간당 `N`의 속도로 token이 채워지며, message를 하나 보낼 때마다 token을 소비한다. 작은/중간 규모 장치의 예로 `(B, N) = (10, 10)`이 제시된다. 구현에서는 token을 message 단위가 아니라 byte 단위로 세는 경우도 많다. 이 규칙은 “정상적인 진단은 가능하게 하되, 오류 상황에서 ICMP 자체가 트래픽 폭증 원인이 되지 않게” 하는 장치다.

ICMP error message에는 항상 offending datagram의 IP header와 payload 앞부분이 들어간다. IPv4는 전체 IP/ICMP datagram이 `576 bytes`를 넘지 않는 범위, IPv6는 최소 IPv6 MTU인 `1280 bytes`를 넘지 않는 범위에서 원래 datagram을 가능한 많이 싣는다. 이 사본이 중요한 이유는 수신 측 ICMP module이 원래 IP header의 `Protocol field` 또는 IPv6 `Next Header`를 보고 TCP/UDP 같은 상위 protocol을 찾고, 이어서 TCP/UDP header의 port number를 이용해 해당 user process에 오류를 연결할 수 있기 때문이다.

### 8.3.1 Extended ICMP and Multipart Messages

초기 ICMP 규격은 offending datagram의 처음 `8 bytes`만 포함해도 충분하다고 보았다. UDP/TCP port number를 확인하는 데는 그 정도면 충분했기 때문이다. 하지만 IP-in-IP처럼 protocol layering이 복잡해지고, 진단에 더 많은 context가 필요해지면서 RFC4884는 ICMP message 뒤에 extension data structure를 붙이는 방식을 정의했다.

![Figure 8-3](@/assets/images/cs-tcp-ip-illustrated-128-figure-8-3-page-402.png)
*Figure 8-3 · PDF p. 402 · Extended ICMP message는 기본 ICMP payload 뒤에 extension header와 object들을 붙일 수 있다.*

Extended ICMP의 구조는 기본 ICMP message, 충분히 긴 ICMP payload, extension header, 하나 이상의 extension object로 이어진다. object는 고정 크기 header와 variable-length data area를 가진다. 호환성을 위해 original datagram을 담는 primary ICMP payload area는 최소 `128 bytes` 이상이어야 한다.

여기서 `Length field`는 기존에 reserved였던 byte를 재해석한다. ICMPv4에서는 6번째 byte가 사용되고, offending datagram 부분의 길이를 `32-bit word` 단위로 나타낸다. ICMPv6에서는 5번째 byte가 사용되고 `64-bit unit` 단위다. padding은 각각 32-bit, 64-bit alignment에 맞춘다. Extension structure는 ICMPv4의 `Destination Unreachable`, `Time Exceeded`, `Parameter Problem`과 ICMPv6의 `Destination Unreachable`, `Time Exceeded` 등에 붙을 수 있다.

### 8.3.2 Destination Unreachable and Packet Too Big

`Destination Unreachable`은 datagram이 최종 목적지까지 전달되지 못했음을 알린다. 원인은 transit 중의 forwarding 문제일 수도 있고, 목적지 host에는 도착했지만 해당 port나 application이 받을 준비가 되어 있지 않은 경우일 수도 있다.

ICMPv4에서는 `Destination Unreachable`이 `Type 3`이고 여러 code를 가진다. 자주 쓰이는 code는 `Host Unreachable (code 1)`, `Port Unreachable (code 3)`, `Fragmentation Required/Don't-Fragment Specified (code 4)`, `Communication Administratively Prohibited (code 13)`이다. ICMPv6에서는 `Destination Unreachable`이 `Type 1`이며, IPv4의 fragmentation-needed 성격은 별도 message인 `Packet Too Big (PTB, Type 2, Code 0)`로 분리된다.

![Figure 8-4](@/assets/images/cs-tcp-ip-illustrated-129-figure-8-4-page-404.png)
*Figure 8-4 · PDF p. 404 · ICMPv4/ICMPv6 Destination Unreachable format과 RFC4884 Length/extension 위치.*

주요 code의 의미는 다음처럼 연결해서 이해하면 좋다.

| Message/code | 의미 | 다른 장과의 연결 |
| --- | --- | --- |
| ICMPv4 `Host Unreachable (code 1)` / ICMPv6 `Address Unreachable (code 3)` | direct delivery가 필요하지만 마지막 hop에서 host에 닿지 못함 | IPv4는 ARP 실패와 연결되고, IPv6는 ND 실패와 연결된다. |
| ICMPv6 `No Route to Destination (code 0)` | forwarding해야 하지만 next-hop route entry가 없음 | Chapter 5의 forwarding/routing table 개념과 직접 연결된다. |
| ICMPv4 `Communication Administratively Prohibited (code 13)` / ICMPv6 `Communication with Destination Administratively Prohibited (code 1)` | firewall이나 policy가 통신을 차단함 | Chapter 7의 firewall policy와 연결된다. 보안상 이 ICMP를 숨기고 silent drop할 수도 있다. |
| ICMPv4/ICMPv6 `Port Unreachable` | 목적지 port를 사용하는 process가 없음 | UDP는 connectionless라서 이 ICMP가 application 오류 전달의 사실상 유일한 단서가 될 수 있다. |

`Port Unreachable` 예시는 UDP와 ICMP의 관계를 잘 보여 준다. TFTP client가 UDP port `69`로 RRQ를 보내지만 server process가 없으면, 목적지 host의 UDP가 ICMPv4 `Port Unreachable`을 돌려보낸다. 이 ICMP에는 원래 IPv4 header, UDP header, TFTP request 일부가 포함되므로, 송신 host는 원래 오류가 어느 UDP source port와 어떤 user process에 속하는지 추적할 수 있다. 다만 일반 UDP socket은 특별히 `connect` 같은 처리를 하지 않으면 ICMP error를 application에 전달하지 않는 경우가 많다. 그래서 TFTP client는 Port Unreachable을 받고도 재전송하다가 timeout될 수 있다.

이 예시에서 Linux는 같은 종류의 ICMP를 짧은 시간에 계속 만들지 않도록 `icmp_ratelimit`를 적용한다. 책의 trace에서는 약 `60 ms` 동안 6개의 ICMP가 만들어져 대략 `100 messages/s` 제한으로 해석된다. 중요한 점은 ICMP rate limiting이 단순 성능 최적화가 아니라, 오류 조건에서 제어 메시지 자체가 네트워크를 압박하지 않도록 하는 protocol behavior라는 것이다.

#### ICMPv4 PTB and IPv6 Packet Too Big

IPv4 router가 datagram을 forwarding하려는데 outgoing interface의 MTU보다 datagram이 크면 원래는 fragmentation을 할 수 있다. 하지만 IPv4 header의 `Don't Fragment (DF)` bit가 설정되어 있으면 router는 fragment하지 않고 datagram을 drop하며 ICMPv4 `Destination Unreachable, code 4`를 보낸다. 이 message는 흔히 IPv4 `PTB`처럼 취급되며, router가 알고 있는 next-hop MTU 값을 포함할 수 있다.

IPv6에서는 router가 packet fragmentation을 하지 않는다. fragmentation은 sender만 수행하며, MTU discovery는 항상 사용되어야 한다. 그래서 IPv6는 별도의 ICMPv6 `Packet Too Big (Type 2, Code 0)` message를 사용한다. 이 message는 packet이 next-hop MTU보다 커서 전달될 수 없음을 알리고, sender가 packet size를 줄여 다시 보내도록 `next-hop MTU`를 전달한다.

![Figure 8-6](@/assets/images/cs-tcp-ip-illustrated-131-figure-8-6-page-410.png)
*Figure 8-6 · PDF p. 410 · ICMPv6 Packet Too Big은 MTU field에 next-hop MTU를 담아 PMTUD에 사용된다.*

PMTUD(Path MTU Discovery)의 관점에서 PTB는 “실패 통지”이면서 동시에 “더 작은 packet size를 선택하기 위한 feedback”이다. IPv4에서는 DF bit와 fragmentation 회피 전략이 결합되고, IPv6에서는 router fragmentation 부재 때문에 PTB가 더 구조적인 역할을 한다. route가 바뀌면 이전 PMTUD 결과가 더 이상 맞지 않을 수 있으므로, 정상 통신 중에도 PTB가 다시 나타날 수 있다.

ICMPv6 `Beyond Scope of Source Address (code 2)`는 IPv6 address scope 개념을 반영한다. 예를 들어 source address가 link-local scope인데 destination이 여러 router를 넘어야 하는 global-scope 목적지라면, source scope가 충분하지 않아 router가 packet을 drop하고 이 오류를 만들 수 있다.

ICMPv6에는 정책과 routing table을 더 세밀하게 표현하는 Destination Unreachable code도 있다. `Source Address Failed Ingress/Egress Policy (code 5)`는 source prefix가 ingress/egress filtering policy에 맞지 않을 때 사용될 수 있다. `Reject Route to Destination (code 6)`은 routing/forwarding table에 “이 prefix는 drop하고 ICMPv6 reject를 보내라”는 reject route가 있을 때 사용된다. 비슷한 `blackhole route`는 보통 drop만 하고 Destination Unreachable을 만들지 않는다.

### 8.3.3 Redirect

`Redirect`는 host가 같은 link 위에서 더 나쁜 next hop을 선택했을 때 router가 “앞으로 이 destination은 저 router/host로 보내라”고 알려 주는 ICMP error/control message다. Router R2가 host로부터 datagram을 받았는데, 같은 link의 R1이 더 적절한 next hop임을 알면 R2는 두 일을 한다. 현재 datagram은 R1로 forwarding하고, host에는 Redirect를 보내 forwarding table을 고치게 한다.

![Figure 8-7](@/assets/images/cs-tcp-ip-illustrated-132-figure-8-7-page-412.png)
*Figure 8-7 · PDF p. 412 · Host가 R2로 잘못 보낸 datagram을 R2가 R1으로 forwarding하면서 ICMP Redirect로 host를 교정한다.*

Redirect는 host에게는 조잡한 routing protocol처럼 동작할 수 있지만, router가 Redirect를 받아 routing table을 갱신하는 것은 권장되지 않는다. router는 dynamic routing protocol을 통해 이미 적절한 next hop을 알아야 한다는 가정 때문이다.

ICMPv4 Redirect는 `Type 5`이고, message 안에 “앞으로 next hop으로 써야 할 IPv4 address”와 offending datagram 일부를 넣는다. 원래는 host redirect와 network redirect 구분이 있었지만 CIDR 이후 network redirect의 의미는 거의 사라졌고, host redirect는 특정 destination address 하나에 대해서만 효력을 갖는다. 잘못된 default router를 계속 쓰는 host는 외부 destination마다 Redirect로 생긴 host-specific forwarding entry가 쌓일 수 있다.

ICMPv6 Redirect는 `Type 137`이며 IPv6 Neighbor Discovery(ND)의 일부로 정의된다. `Target Address`는 더 나은 next-hop node의 link-local IPv6 address이고, `Destination Address`는 redirect를 유발한 packet의 목적지 IPv6 address다. destination이 실제로 on-link neighbor라면 Target Address와 Destination Address가 같을 수 있다. 이 경우 Redirect는 “그 destination은 router를 거칠 필요 없이 같은 link에 있다”는 정보도 전달한다.

ICMPv6 Redirect는 ND option을 포함할 수 있다. 대표적으로 `Target Link-Layer Address option`은 새 next hop의 link-layer address를 알려 주고, `Redirected Header option`은 Redirect를 유발한 IPv6 packet 일부를 담는다. 특히 NBMA(Non-Broadcast Multiple Access) network에서는 link-layer address를 다른 방식으로 알기 어려우므로 Target Link-Layer Address option이 중요해진다.

### 8.3.4 ICMP Time Exceeded

IPv4 header에는 `Time-to-Live (TTL)`, IPv6 header에는 `Hop Limit`이 있다. 이름은 다르지만 현대적 의미는 거의 같다. router가 packet을 forwarding할 때 이 값을 줄이고, 더 이상 forwarding할 수 없을 정도로 낮으면 packet을 discard한 뒤 ICMP `Time Exceeded`를 보낸다. IPv4에서는 `Type 11`, IPv6에서는 `Type 3`이며, hop count 초과는 `code 0`이다.

![Figure 8-10](@/assets/images/cs-tcp-ip-illustrated-135-figure-8-10-page-415.png)
*Figure 8-10 · PDF p. 415 · ICMP Time Exceeded format: TTL/Hop Limit 초과(code 0)와 fragment reassembly timeout(code 1)을 표현한다.*

TTL은 처음에는 datagram이 network 안에 머무를 수 있는 초 단위 시간처럼 설계되었지만, router가 최소 1씩 decrement해야 한다는 규칙과 빠른 forwarding 속도 때문에 실제로는 hop count 제한으로 굳어졌다. IPv6는 이 의미를 명확히 반영해 `Hop Limit`이라는 이름을 쓴다.

`Time Exceeded code 1`은 fragment reassembly timeout이다. destination이 fragment들을 기다렸지만 일부 fragment가 오지 않아 전체 datagram을 재조립할 수 없을 때 사용된다. IP fragmentation에서는 fragment 하나만 잃어도 전체 datagram이 사라지므로, 이 message는 “부분적으로 도착했지만 완성되지 못했다”는 신호다.

#### traceroute의 동작 원리

`traceroute`는 Time Exceeded를 의도적으로 유발해 path상의 router를 찾아낸다. 첫 probe는 TTL=1로 보내고, 첫 router가 TTL을 0으로 만든 뒤 ICMP Time Exceeded를 돌려보낸다. 다음 round에서는 TTL=2, 그 다음은 TTL=3처럼 늘려 가면, 한 hop씩 더 먼 router가 Time Exceeded의 source가 된다.

![Figure 8-12](@/assets/images/cs-tcp-ip-illustrated-137-figure-8-12-page-416.png)
*Figure 8-12 · PDF p. 416 · traceroute는 TTL을 1, 2, ...로 늘린 UDP/IPv4 datagram을 보내 각 hop의 ICMPv4 Time Exceeded를 받는다.*

책의 예시에서 traceroute는 UDP datagram을 destination port `33435`부터 순차적으로 보내며, 각 TTL 값마다 3번씩 시도한다. 출력 한 줄은 해당 TTL에서 발견된 router와 세 번의 round-trip time을 보여 준다. 첫 측정이 뒤의 측정보다 오래 걸릴 수 있는데, 첫 packet에서 ARP 같은 link-layer resolution이 추가로 필요했기 때문이다.

중요한 세부는 Time Exceeded message 안에 원래 datagram 사본이 들어간다는 점이다. traceroute process는 그 안의 UDP destination port나 식별자를 보고 “이 ICMP가 내가 보낸 몇 번째 probe에 대한 응답인지”를 맞출 수 있다. 따라서 ICMP error payload의 offending datagram 포함 규칙은 단순 진단 정보가 아니라 user-level tool 동작에도 필요하다.

### 8.3.5 Parameter Problem

`Parameter Problem`은 IP header에 처리 불가능한 문제가 있는데 다른 ICMP error가 더 정확히 설명하지 못할 때 쓰는 catchall 성격의 error다. IPv4에서는 `Type 12`, IPv6에서는 `Type 4`다. 핵심 field는 `Pointer`이며, offending IP header 시작점 기준으로 문제가 발견된 byte offset을 가리킨다.

ICMPv4 Parameter Problem의 `code 0`은 대부분의 IPv4 header field 오류에 사용된다. `code 1`은 예전에는 필수 option 누락을 나타냈지만 현재는 historic이다. `code 2`는 IPv4 `IHL` 또는 `Total Length` field가 잘못된 경우를 나타낸다. 예를 들어 Pointer가 `1`이면 IPv4 header의 DS Field/ECN field 위치에 문제가 있음을 뜻할 수 있다.

![Figure 8-15](@/assets/images/cs-tcp-ip-illustrated-140-figure-8-15-page-419.png)
*Figure 8-15 · PDF p. 419 · ICMPv6 Parameter Problem은 Pointer로 오류 offset을 표시하고 code로 header/Next Header/option 문제를 구분한다.*

ICMPv6는 Parameter Problem을 세 가지로 더 명확히 나눈다.

| ICMPv6 Parameter Problem code | 의미 | 예 |
| --- | --- | --- |
| `code 0` | erroneous header field encountered | IPv6 header 또는 extension header의 field 값이 허용 범위 밖 |
| `code 1` | unrecognized Next Header type encountered | header chain에서 구현이 모르는 Next Header 값 발견 |
| `code 2` | unrecognized IPv6 option encountered | 처리할 수 없는 IPv6 option 발견 |

Pointer는 원래 IPv6 datagram 안의 byte offset을 가리킨다. 예를 들어 Pointer가 `40`이면 기본 IPv6 header 40 bytes 뒤, 즉 첫 IPv6 extension header 시작 부분에 문제가 있음을 암시한다. 이 구조 때문에 ICMPv6 Parameter Problem은 IPv6 extension header chain을 디버깅하는 데 특히 중요하다.

### 8.4 ICMP Query/Informational Messages

ICMP query/informational message 중 오래된 일부 기능, 예를 들어 Address Mask Request/Reply, Timestamp Request/Reply, Information Request/Reply는 DHCP 같은 더 목적에 맞는 protocol로 대체되었다. 현재 실무적으로 중요한 것은 `Echo Request/Reply (ping)`, Router Discovery, IPv6의 Mobile IPv6 관련 message, MLD/MRD 같은 multicast 관리 message다.

IPv4에서는 informational ICMP가 “있으면 편한 보조 기능”에 가까운 경우가 많지만, IPv6에서는 ICMPv6 informational/control message가 주소 설정, multicast listener 관리, router/neighbor discovery에 직접 들어간다.

#### 8.4.1 Echo Request/Reply (ping)

`Echo Request`와 `Echo Reply`는 가장 널리 알려진 ICMP message pair다. ICMPv4에서는 Echo Request가 `Type 8`, Echo Reply가 `Type 0`이고, ICMPv6에서는 Echo Request가 `Type 128`, Echo Reply가 `Type 129`다. Request에 optional data가 들어 있으면 Reply는 그 data를 그대로 돌려줘야 한다.

![Figure 8-16](@/assets/images/cs-tcp-ip-illustrated-141-figure-8-16-page-420.png)
*Figure 8-16 · PDF p. 420 · Echo Request/Reply format: Identifier와 Sequence Number로 reply를 원래 request에 대응시킨다.*

`Identifier`는 ICMP에는 TCP/UDP port가 없다는 약점을 보완한다. UNIX 계열 ping은 보통 process ID를 Identifier로 넣어 같은 host에서 여러 ping instance가 실행되어도 reply를 구분할 수 있게 한다. NAT도 Chapter 7에서 보았듯 Echo Request/Reply를 매칭할 때 이 Identifier를 활용할 수 있다.

`Sequence Number`는 새 Echo Request를 보낼 때마다 증가한다. ping 출력에서 sequence가 비거나 순서가 바뀌거나 중복되면 packet loss, reordering, duplication을 관찰할 수 있다. ICMP도 IP 위의 best-effort datagram service이므로 이런 현상은 정상적으로 가능하다.

ping은 optional data에 local time을 넣고, Echo Reply가 돌아왔을 때 현재 시간과 비교해 RTT를 계산하는 경우가 많다. 이 방식은 sender 자신의 clock만 사용하므로 sender와 receiver 사이의 clock synchronization이 필요 없다. traceroute의 RTT 측정도 비슷한 사고방식을 따른다.

broadcast address로 Echo Request를 보내면 여러 host가 동시에 Echo Reply를 보낼 수 있다. Linux ping은 이런 동작을 명시적으로 `-b` option으로 요구하고 경고한다. broadcast ping은 local ARP table을 빠르게 채우는 부작용도 있다. 각 responder가 sender에게 Echo Reply를 보내기 위해 ARP를 수행하면서 sender는 responder들의 link-layer address를 배우게 된다. 하지만 broadcast Echo Reply는 optional이어서 OS마다 기본 동작이 다를 수 있다.

#### 8.4.2 Router Discovery: Router Solicitation and Advertisement

IPv4 Router Discovery(RD)는 host가 local subnetwork의 router들을 알아내고 default route 후보를 선택하기 위한 ICMPv4 informational mechanism이다. ICMPv4 `Router Solicitation (RS, Type 10)`과 `Router Advertisement (RA, Type 9)`가 사용된다.

Router는 RA를 주기적으로 `All Hosts multicast address 224.0.0.1`로 보내고, host가 요청하면 RS에 대한 응답으로도 보낸다. RS는 `All Routers multicast address 224.0.0.2`로 전송된다. TTL은 local link 범위를 의미하도록 `1`로 제한된다. IPv4에서는 DHCP 선호 때문에 RD가 널리 쓰이지 않지만, Mobile IP에서는 mobility agent 발견에 연결된다. IPv6의 대응 기능은 단순 RD가 아니라 SLAAC와 IPv6 Neighbor Discovery의 핵심이므로 8.5에서 별도로 다룬다.

ICMPv4 RA에는 default next hop으로 쓸 수 있는 router IPv4 address list가 들어간다. 각 router entry는 router address와 `Preference Level`을 가지며, preference가 높을수록 우선된다. `Lifetime`은 이 list를 유효하다고 볼 시간을 초 단위로 나타낸다. 특별한 preference 값 `0x80000000`은 해당 address를 valid default router로 쓰지 말라는 뜻이다.

Mobile IPv4는 RA 뒤에 `Mobility Agent Advertisement extension`을 붙여 home agent/foreign agent 가능 여부, registration lifetime, tunneling support 등을 광고할 수 있다. 또 `Prefix-Lengths extension`은 RA 안의 각 router address가 local subnetwork에서 몇 bit prefix를 쓰는지 알려 주며, mobile node가 network 이동 여부를 판단하는 데 도움을 준다.

#### 8.4.3 Home Agent Address Discovery Request/Reply

MIPv6는 dynamic home agent address discovery를 위해 ICMPv6 `Home Agent Address Discovery Request (Type 144)`와 `Reply (Type 145)`를 정의한다. 이동 중인 mobile node는 새 network에 있을 때 자신의 home prefix에 대한 `Home Agents anycast address`로 Request를 보낼 수 있다. 이때 source address는 보통 방문 중인 network에서 얻은 `care-of address`다.

Reply는 home agent 역할을 할 수 있는 node가 mobile node의 unicast address로 보내며, 하나 이상의 `Home Agent Address`를 포함할 수 있다. 이 기능은 mobile node가 network를 이동하는 동안 기존 home agent가 바뀌었거나 다시 찾아야 하는 상황에서 binding update를 재설정할 수 있게 한다.

#### 8.4.4 Mobile Prefix Solicitation/Advertisement

MIPv6의 `Mobile Prefix Solicitation (Type 146)`은 mobile node의 home address가 곧 invalid해질 때 home agent에게 routing prefix update를 요청하는 message다. mobile node는 IPv6 Destination Options의 `Home Address option`을 포함하고, spoofed prefix advertisement를 막기 위해 보통 IPsec으로 보호한다.

`Mobile Prefix Advertisement (Type 147)`는 home prefix가 변경되었음을 mobile node에게 알려 준다. Identifier는 solicitation의 Identifier와 매칭되고, `M (Managed Address)` flag는 stateful address configuration을 사용하라는 뜻이며, `O (Other)` flag는 주소 외 정보가 stateful configuration 방식으로 제공됨을 뜻한다. 실제 prefix 정보는 하나 이상의 `Prefix Information option`에 들어간다.

#### 8.4.5 Mobile IPv6 Fast Handover Messages

FMIPv6(Fast Handovers for Mobile IPv6)는 mobile node가 access point(AP)를 바꾸기 전에 다음 router와 addressing 정보를 예측해 IP-layer handoff latency를 줄이려는 방식이다. ICMPv6 `Type 154`가 사용되고, 대표 message는 `Proxy Router Solicitation (RtSolPr)`과 `Proxy Router Advertisement (PrRtAdv)`다.

RtSolPr는 code `0`, subtype `2`를 사용하며 mobile node가 관심 있는 새 AP에 대한 정보를 요청한다. 최소 하나의 `New Access Point Link-Layer Address option`을 포함해야 하고, source를 나타내는 Link-Layer Address option을 포함할 수도 있다. 이 option들은 IPv6 ND option format을 사용하므로 8.5의 ND option 구조와 이어진다.

#### 8.4.6 Multicast Listener Query/Report/Done

`Multicast Listener Discovery (MLD)`는 IPv6 link에서 어떤 host가 어떤 multicast address를 듣고 있는지 multicast router가 알기 위한 ICMPv6 기반 protocol이다. IPv4의 IGMP에 대응하며, 자세한 multicast 동작은 Chapter 9와 연결된다.

MLDv1은 ICMPv6 `Multicast Listener Query (Type 130)`, `Report (Type 131)`, `Done (Type 132)`를 사용한다. 이 message들은 IPv6 `Hop Limit = 1`로 보내지고, Router Alert Hop-by-Hop IPv6 option을 포함한다.

![Figure 8-24](@/assets/images/cs-tcp-ip-illustrated-149-figure-8-24-page-428.png)
*Figure 8-24 · PDF p. 428 · MLDv1 Query/Report/Done common format: Maximum Response Delay와 Multicast Address가 핵심이다.*

MLD Query에는 두 형태가 있다. `general query`는 host들이 사용 중인 multicast address를 보고하게 하고, `multicast-address-specific query`는 특정 multicast address가 아직 사용 중인지 확인한다. Router가 query를 보내면 host는 report로 응답하고, membership이 바뀌면 unsolicited report를 보낼 수도 있다.

`Maximum Response Delay`는 host가 query에 대한 report를 보내기 전 최대 얼마까지 지연할 수 있는지 ms 단위로 지정한다. 한 link에서 multicast router는 “적어도 하나의 host가 이 multicast group을 듣고 있다”는 사실만 알면 되는 경우가 많다. 그래서 host들은 random delay를 두고, 이웃 host가 먼저 report한 것을 들으면 자신의 report를 생략할 수 있다. 이 report suppression은 burst를 줄이는 핵심 장치다.

#### 8.4.7 Version 2 Multicast Listener Discovery (MLDv2)

MLDv2는 ICMPv6 `Type 143` Report와 확장된 Query를 통해 source-specific multicast(SSM)를 지원한다. 즉 host가 “이 multicast group은 듣되 특정 source들만 include하겠다” 또는 “특정 source들을 exclude하겠다”는 filter state를 표현할 수 있다. 이는 IPv4 IGMPv3를 IPv6/ICMPv6로 옮긴 성격이 강하다.

MLDv2 Query의 처음 24 bytes는 MLDv1 common format과 같다. 뒤에는 source-specific 정보를 위한 field들이 붙는다. `Maximum Response Code`는 응답 최대 지연을 나타내며, 작은 값은 ms 단위 값 그대로 쓰고 큰 값은 exponent/mantissa 형태의 floating-point encoding으로 해석한다. 이는 작은 delay와 큰 delay를 모두 표현하면서 MLDv1과의 호환성을 어느 정도 유지하기 위한 설계다.

`QRV (Querier Robustness Variable)`는 link의 packet loss 기대치에 따라 MLD update rate를 조절하는 데 쓰이고, `QQIC (Querier's Query Interval Code)`는 query interval을 encoding한다. `Number of Sources (N)`은 query에 포함된 source address 개수이며, general query와 multicast-address-specific query에서는 0이고 source-specific query에서는 0이 아니다.

![Figure 8-28](@/assets/images/cs-tcp-ip-illustrated-153-figure-8-28-page-431.png)
*Figure 8-28 · PDF p. 431 · MLDv2 Report는 여러 multicast address record를 vector 형태로 담는다.*

MLDv2 Report는 여러 `Multicast Address Record`를 담는다. 각 record는 current state, filter mode change, source list change 중 하나의 의미를 가진다.

| Record type 계열 | 예 | 의미 |
| --- | --- | --- |
| current state records | `MODE_IS_INCLUDE`, `MODE_IS_EXCLUDE` | 현재 include/exclude filter mode와 source list를 보고 |
| filter mode change records | `CHANGE_TO_INCLUDE_MODE`, `CHANGE_TO_EXCLUDE_MODE` | filter mode 자체가 바뀌었음을 보고 |
| source list change records | `ALLOW_NEW_SOURCES`, `BLOCK_OLD_SOURCES` | filter mode는 유지하고 source list만 바뀌었음을 보고 |

`LW-MLDv2`는 잘 쓰이지 않는 EXCLUDE mode를 제거해 multicast router가 유지해야 할 state를 줄인 단순화 버전이다. message format은 기존 MLDv2 format을 재사용하지만 operation에서 EXCLUDE 지시를 제거한다.

#### 8.4.8 Multicast Router Discovery (MRD)

`Multicast Router Discovery (MRD)`는 multicast packet을 forwarding할 수 있는 router의 존재와 일부 configuration parameter를 찾기 위한 방식이다. IPv4에서는 IGMP type `48/49/50`, IPv6에서는 ICMPv6 type `151/152/153`이 쓰인다. 주된 사용 배경은 `IGMP/MLD snooping`이다. Layer 2 switch 같은 장비가 multicast router와 관심 host 위치를 학습해 multicast flooding을 줄이는 데 필요하다.

![Figure 8-30](@/assets/images/cs-tcp-ip-illustrated-155-figure-8-30-page-434.png)
*Figure 8-30 · PDF p. 434 · MRD Advertisement는 광고 주기, QQI, Robustness Variable을 담아 multicast router 존재를 알린다.*

MRD message는 항상 IPv4 `TTL = 1` 또는 IPv6 `Hop Limit = 1`로 보내고 Router Alert option을 포함한다. `Advertisement (ICMPv6 Type 151)`는 multicast router가 자신이 multicast traffic을 forwarding할 의사가 있음을 주기적으로 알린다. IPv6에서는 sender의 link-local address가 router 식별에 쓰이고, destination은 `All Snoopers ff02::6a`다.

`Solicitation (Type 152)`은 multicast router에게 즉시 Advertisement를 만들도록 요청한다. IPv6 destination은 `All Routers ff02::2`다. `Termination (Type 153)`은 router가 더 이상 multicast traffic forwarding 의사가 없음을 All Snoopers address로 알린다.

### 8.5 Neighbor Discovery in IPv6

IPv6 `Neighbor Discovery (ND, NDP)`는 IPv4 세계에서 흩어져 있던 여러 기능을 ICMPv6 위로 모은다. ICMPv4의 Router Discovery와 Redirect, ARP의 address mapping, reachability 확인, Stateless Address Autoconfiguration(SLAAC) 지원, Mobile IPv6 지원이 ND 안에서 함께 다뤄진다.

IPv4 ARP는 broadcast를 많이 사용하지만 IPv6에는 broadcast address가 없다. ND는 network layer와 link layer 양쪽에서 multicast를 적극적으로 사용한다. 이 덕분에 “모든 host에게 뿌리는” 방식보다 더 제한된 범위로 질의할 수 있지만, link-layer multicast를 지원하지 않는 NBMA link에서는 동작 방식이 달라질 수 있다.

ND의 큰 기능 축은 두 가지다.

| ND 기능 축 | 핵심 message | IPv4에서 대응되는 역할 |
| --- | --- | --- |
| Router Discovery / configuration | `Router Solicitation (RS)`, `Router Advertisement (RA)` | ICMPv4 Router Discovery, default router 학습, SLAAC 지원 |
| Neighbor address mapping / reachability | `Neighbor Solicitation (NS)`, `Neighbor Advertisement (NA)` | ARP Request/Reply, neighbor reachability 확인 |

모든 ND message는 IPv6 `Hop Limit = 255`로 전송된다. 수신자는 이 값을 검사한다. off-link sender가 packet을 보내면 router를 지나면서 Hop Limit이 감소하므로 255로 도착할 수 없다. 따라서 Hop Limit 255 검사는 local-link ICMPv6 spoofing을 줄이는 중요한 방어선이다.

#### 8.5.1 ICMPv6 Router Solicitation and Advertisement

`Router Solicitation (RS, Type 133)`은 on-link router에게 RA를 보내 달라고 요청하는 message다. RS는 `All Routers multicast address ff02::2`로 전송된다. sender가 unspecified address가 아닌 IPv6 address를 쓰는 경우에는 보통 `Source Link-Layer Address option`을 포함한다. autoconfiguration 중 source가 unspecified address인 경우에는 이 option을 넣지 않는다.

`Router Advertisement (RA, Type 134)`는 nearby router의 존재와 link configuration 정보를 알린다. Router가 주기적으로 `All Nodes multicast address ff02::1`에 보내거나, RS에 대한 응답으로 요청 host의 unicast address에 보낼 수 있다.

![Figure 8-33](@/assets/images/cs-tcp-ip-illustrated-158-figure-8-33-page-436.png)
*Figure 8-33 · PDF p. 436 · ICMPv6 Router Advertisement는 Hop Limit, M/O/H flag, preference, lifetime, reachability timer 등을 전달한다.*

RA의 주요 field는 IPv6 host configuration의 “초기 조건”을 만든다.

| RA field/flag | 의미 |
| --- | --- |
| `Current Hop Limit` | host가 IPv6 datagram을 보낼 때 기본으로 사용할 Hop Limit. 0이면 router가 특정 값을 권하지 않음 |
| `M (Managed)` | IPv6 address assignment를 stateful configuration으로 처리하라는 신호. SLAAC 대신 DHCPv6 같은 방식 사용 |
| `O (Other)` | address 외 다른 정보는 stateful configuration으로 얻으라는 신호 |
| `H (Home Agent)` | router가 Mobile IPv6 home agent 역할을 할 수 있음 |
| `Pref (Preference)` | default router로서의 선호도. high/medium/low를 표현 |
| `P (Proxy)` | experimental ND proxy 시설과 관련. IPv6의 proxy-ARP-like 기능 |
| `Router Lifetime` | sender를 default next hop으로 사용할 수 있는 시간. 0이면 default router로 쓰지 않음 |
| `Reachable Time` | NUD에서 neighbor가 reachable하다고 가정할 시간 |
| `Retransmission Timer` | successive ND message 사이의 재전송 간격 |

RA에는 보통 `Source Link-Layer Address option`, 필요하면 `MTU option`, 그리고 local link에서 쓰는 IPv6 prefix를 알려 주는 `Prefix Information option`이 들어간다. Chapter 6의 SLAAC 흐름은 결국 이 RA 정보 위에서 host가 주소를 구성하는 과정이다.

#### 8.5.2 ICMPv6 Neighbor Solicitation and Advertisement

`Neighbor Solicitation (NS, Type 135)`는 IPv4의 ARP Request에 해당하는 역할을 한다. 가장 기본적인 목적은 target IPv6 address에 대응하는 link-layer address를 알아내는 것이다. 동시에 neighbor가 reachable한지, bidirectional connectivity가 가능한지도 확인한다.

![Figure 8-34](@/assets/images/cs-tcp-ip-illustrated-159-figure-8-34-page-437.png)
*Figure 8-34 · PDF p. 437 · Neighbor Solicitation은 Target Address를 담고, multicast 또는 unicast로 neighbor mapping/reachability를 확인한다.*

address mapping을 위한 NS는 target IPv6 address에 대응하는 `Solicited-Node multicast address`로 전송된다. 이 주소는 `ff02::1:ff00:0/104` 성격의 prefix에 target IPv6 address의 low-order 24 bits를 결합해 만든다. 이미 알고 있는 neighbor의 reachability만 확인할 때는 multicast가 아니라 그 neighbor의 unicast IPv6 address로 NS를 보낸다.

NS에는 link-layer address를 쓰는 network에서 `Source Link-Layer Address option`이 포함될 수 있다. multicast solicitation에서는 이 option을 반드시 포함해야 하고, unicast solicitation에서도 포함하는 것이 권장된다. 단, Duplicate Address Detection(DAD)처럼 source address가 unspecified address인 경우에는 Source Link-Layer Address option을 포함하지 않는다.

`Neighbor Advertisement (NA, Type 136)`는 IPv4의 ARP Response에 해당하며, NUD에도 사용된다. NA는 NS에 대한 응답으로 보내거나, node의 IPv6 address/link-layer mapping이 바뀌었을 때 unsolicited로 보낼 수 있다. soliciting node가 unspecified source address를 썼다면 All Nodes multicast address로 보낼 수 있고, 보통은 요청자에게 unicast로 보낸다.

![Figure 8-35](@/assets/images/cs-tcp-ip-illustrated-160-figure-8-35-page-438.png)
*Figure 8-35 · PDF p. 438 · Neighbor Advertisement는 R/S/O flag와 Target Address, Target Link-Layer Address option으로 mapping과 reachability를 알린다.*

NA의 flag는 cache update와 reachability 판단에 직접 영향을 준다.

| NA flag | 이름 | 의미 |
| --- | --- | --- |
| `R` | Router | sender가 router임을 표시. router가 host로 바뀌는 상황도 반영 가능 |
| `S` | Solicited | 이 NA가 이전 NS에 대한 응답임을 표시. bidirectional connectivity 확인에 사용 |
| `O` | Override | 기존 cached address mapping을 이 정보로 덮어써야 함을 표시 |

Target Address는 solicited advertisement에서는 조회 대상 IPv6 address이고, unsolicited advertisement에서는 link-layer address가 바뀐 IPv6 address다. Target Link-Layer Address option은 IPv6에서 ARP-like functionality를 실제로 완성하는 핵심 option이다.

책의 ping6 예시는 ND와 Echo가 어떻게 연결되는지 보여 준다. Echo Request/Reply 자체는 Hop Limit 128 또는 64 같은 일반 값을 쓰지만, 그 전에 link-local target의 link-layer address를 알아내기 위한 NS/NA는 Hop Limit 255를 사용한다. NS는 target의 solicited-node multicast address로 가고, NA는 요청자에게 unicast로 돌아오며, NA의 S/O flag와 Target Link-Layer Address option이 neighbor cache를 갱신한다.

#### 8.5.3 ICMPv6 Inverse Neighbor Discovery

`Inverse Neighbor Discovery (IND)`는 link-layer address를 이미 알고 있을 때 거기에 대응하는 IPv6 address를 알아내기 위한 기능이다. ICMPv6 `IND Solicitation (Type 141)`과 `IND Advertisement (Type 142)`가 사용된다. 역사적으로 Frame Relay network에서 알려진 link-layer address에 대응하는 IPv6 address를 찾기 위해 필요해졌고, IPv4의 reverse ARP와 비슷한 위치에 있다.

IND Solicitation은 IPv6 layer에서는 `All Nodes multicast address`로 보내지만, link layer에서는 조회하려는 unicast link-layer address로 encapsulation된다. Source Link-Layer Address option과 Destination Link-Layer Address option을 반드시 포함해야 하며, Source/Target Address List option이나 MTU option을 포함할 수 있다.

#### 8.5.4 Neighbor Unreachability Detection

`Neighbor Unreachability Detection (NUD)`는 같은 link의 neighbor와 reachability가 끊겼는지, 또는 한쪽 방향만 되는 asymmetric 상태인지 감지한다. NUD는 각 node의 `neighbor cache`를 관리한다. neighbor cache는 IPv4의 ARP cache와 비슷하지만, 단순 mapping뿐 아니라 state를 함께 갖는다.

![Figure 8-37](@/assets/images/cs-tcp-ip-illustrated-162-figure-8-37-page-441.png)
*Figure 8-37 · PDF p. 441 · NUD는 neighbor cache entry를 INCOMPLETE, REACHABLE, STALE, DELAY, PROBE 상태로 관리한다.*

NUD state는 다음처럼 이해하면 된다.

| State | 의미 | 전형적 전이 |
| --- | --- | --- |
| `INCOMPLETE` | on-link destination으로 보낼 packet이 있지만 link-layer mapping이 아직 없음 | NS를 보내고 solicited NA를 기다림 |
| `REACHABLE` | 최근 bidirectional reachability 확인 완료 | ReachableTime 동안 직접 전송 가능 |
| `STALE` | mapping은 있지만 최근 확인되지 않음 | packet을 보내면 DELAY로 넘어갈 수 있음 |
| `DELAY` | stale mapping으로 packet을 보낸 뒤 upper-layer evidence를 잠시 기다림 | `DELAY_FIRST_PROBE_TIME` 후 evidence 없으면 PROBE |
| `PROBE` | unicast NS를 반복해 reachability를 능동 확인 | `MAX_UNICAST_SOLICIT` 실패 시 entry 삭제 |

IPv6 node가 unicast datagram을 보낼 때 destination cache를 확인하고, destination이 on-link이면 neighbor cache에서 해당 neighbor entry를 본다. entry가 `REACHABLE`이면 direct delivery를 수행한다. entry가 없으면 `INCOMPLETE`로 만들고 NS를 보낸다. solicited NA를 받으면 reachability가 확인되어 `REACHABLE`이 된다.

`STALE`은 정보가 틀렸다고 단정하는 상태가 아니라 “mapping은 있어 보이지만 아직 reachability를 확인하지 않은 상태”다. 예를 들어 예전에는 REACHABLE이었지만 시간이 지났거나, unsolicited NA/RA 같은 evidence를 받았을 때 STALE이 될 수 있다.

`DELAY`와 `PROBE`는 불필요한 NS 폭주를 막기 위한 완충 상태다. DELAY는 upper-layer protocol이 ACK 같은 추가 evidence를 줄 기회를 기다린다. 기본 `DELAY_FIRST_PROBE_TIME`은 5초다. evidence가 없으면 PROBE에서 `RetransTimer` 간격, 기본 `RETRANS_TIMER = 1000 ms`로 NS를 보내며, 기본 `MAX_UNICAST_SOLICIT = 3`번 실패하면 entry를 삭제한다.

#### 8.5.5 Secure Neighbor Discovery (SEND)

`Secure Neighbor Discovery (SEND)`는 ND message에 대한 spoofing 공격을 줄이기 위한 확장이다. 특히 어떤 host/router가 다른 node인 척하면서 NS에 응답하거나 RA를 위조하는 상황을 막는 데 초점을 둔다. SEND는 IPsec을 직접 쓰지 않고 별도의 mechanism을 사용하며, FMIPv6 handoff 보안에도 활용될 수 있다.

SEND가 가정하는 기본 재료는 세 가지다.

| SEND 재료 | 역할 |
| --- | --- |
| router certificate / cryptographic credential | SEND-capable router가 자신의 identity를 host에게 증명 |
| trust anchor | host가 router credential을 검증할 수 있게 하는 configuration 정보 |
| public/private key pair | 각 node가 자신이 사용할 IPv6 address를 구성할 때 생성하고 address ownership 증명에 사용 |

##### Cryptographically Generated Addresses (CGA)

SEND의 핵심은 `Cryptographically Generated Address (CGA)`다. CGA는 node의 public key information을 IPv6 address와 연결한다. 따라서 해당 public key에 대응하는 private key를 가진 address owner만이 “이 CGA를 사용할 권한이 있다”고 증명할 수 있다. CGA에는 subnet prefix도 encoding되므로, 한 subnet에서 만든 CGA를 다른 subnet으로 그대로 옮기기 어렵다.

![Figure 8-38](@/assets/images/cs-tcp-ip-illustrated-163-figure-8-38-page-443.png)
*Figure 8-38 · PDF p. 443 · SEND의 CGA 생성은 CGA parameters, Hash1, Hash2, Sec 값을 조합해 subnet prefix와 interface identifier를 만든다.*

CGA는 64-bit subnet prefix와 특별히 만든 interface identifier를 OR/결합해 만든다. interface identifier는 node public key와 `CGA parameters data structure`를 입력으로 하는 secure hash function 결과를 이용한다. 이때 두 hash가 등장한다.

| Hash | 역할 |
| --- | --- |
| `Hash1` | CGA interface identifier의 low-order bits를 만드는 데 사용 |
| `Hash2` | `Sec` 값에 따라 충분히 어려운 조건, 즉 처음 $16 \cdot \text{Sec}$ bits가 0이 되도록 Modifier를 조정하는 데 사용 |

`Modifier`는 random value로 시작하고, `Collision Count`는 0에서 시작한다. `Sec`는 3-bit unsigned parameter로, 값이 커질수록 공격자가 같은 hash 조건을 만족하는 다른 입력을 찾기 어려워지지만 계산 비용도 지수적으로 증가한다. Hash2 조건을 만족할 때까지 Modifier를 증가시키며 다시 계산하므로 생성 비용은 대략 $O(2^{16 \cdot \text{Sec}})$ 성격을 가진다. 다만 이 비용은 address를 처음 만들 때 주로 발생한다.

Hash2 조건을 만족하는 Modifier를 찾으면, Hash1 값의 59 bits를 interface identifier 하위 부분으로 쓰고, 상위 3 bits에는 Sec 값을 넣는다. IPv6 address의 `u`와 `g` bit 위치는 0으로 둔다. Duplicate Address Detection(DAD)에서 충돌이 발견되면 Collision Count를 증가시키고 Hash1을 다시 계산한다. Collision Count는 2를 넘을 수 없으며, 여러 번 충돌한다면 단순 우연보다 configuration error나 attack 가능성을 의심해야 한다.

`CGA verification`은 해당 CGA가 CGA parameters와 subnet prefix에 맞게 잘 만들어졌는지 확인하는 과정이다. verifier는 collision count가 2 이하인지, CGA subnet prefix가 parameters와 일치하는지, Hash1이 interface identifier와 맞는지, Hash2가 $16 \cdot \text{Sec}$개의 initial zero bits 조건을 만족하는지 확인한다. 생성보다 검증이 훨씬 가벼운 이유는 verifier가 Modifier를 찾기 위해 반복 탐색할 필요가 없기 때문이다.

하지만 CGA가 잘 만들어졌다는 것만으로는 그 node가 address owner임이 증명되지 않는다. 그래서 `signature verification`이 필요하다. owner는 CGA parameters 안의 public key에 대응하는 private key로 typed message에 RSA signature를 붙인다. verifier는 CGA parameters에서 public key를 꺼내고, 128-bit type tag와 message를 연결한 data block에 대해 `RSA signature (RSASSA-PKCS1-v1_5)`를 검증한다. 일반적으로 CGA verification과 signature verification이 모두 성공해야 CGA와 user를 유효하다고 본다.

##### Certification Path Solicitation/Advertisement

SEND는 router advertisement의 authenticity를 검증하기 위해 ICMPv6 `Certification Path Solicitation (Type 148)`과 `Certification Path Advertisement (Type 149)`도 정의한다. host는 Solicitation을 통해 특정 certificate path component를 요청할 수 있고, Advertisement는 그 component, 즉 certificate를 전달한다.

Solicitation의 `Identifier`는 request와 response를 matching하기 위한 random value다. `Component` field는 certification path에서 요청하는 위치 index를 나타내며, `65535`는 trust anchor에 뿌리를 둔 전체 path의 certificate들을 원한다는 뜻이다. Advertisement는 대응 Solicitation의 Identifier를 복사하고, `All Components`로 전체 path component 수를 알리며, `Component` field와 `Certificate option`으로 단일 certificate component를 제공한다. fragmentation을 피하기 위해 Advertisement 하나에는 보통 component 하나만 담는 것이 권장된다.

#### 8.5.6 ICMPv6 Neighbor Discovery (ND) Options

ND message는 zero or more option을 포함할 수 있고, 일부 message에서는 특정 option이 사실상 필수다. IPv6 계열 protocol답게 option은 TLV(Type-Length-Value) 형태의 공통 구조를 가진다.

![Figure 8-41](@/assets/images/cs-tcp-ip-illustrated-166-figure-8-41-page-447.png)
*Figure 8-41 · PDF p. 447 · ND option 공통 TLV 구조: Type과 Length 뒤에 type별 contents가 붙는다.*

`Type`과 `Length`는 각각 8 bits다. `Length`는 Type/Length field까지 포함한 전체 option 길이를 `8-byte unit`으로 표현하며 최소값은 1이다. option은 8-byte boundary에 맞게 padding된다. 이 공통 규칙 때문에 다양한 ND/SEND/FMIPv6/DNS 관련 option이 같은 확장 틀 안에 들어간다.

대표 ND option은 다음처럼 묶어 기억하면 좋다.

| Type | Option name | 주 사용 message | 핵심 의미 |
| --- | --- | --- | --- |
| 1 | Source Link-Layer Address | RS, NS, RA | sender의 link-layer address |
| 2 | Target Link-Layer Address | NA, Redirect | target/next-hop의 link-layer address |
| 3 | Prefix Information | RA, Mobile Prefix Advertisement | IPv6 prefix, SLAAC, on-link determination |
| 4 | Redirected Header | Redirect | Redirect를 유발한 원래 IPv6 datagram 일부 |
| 5 | MTU | RA, IND Advertisement | local link에서 사용할 MTU |
| 7 | Advertisement Interval | RA | unsolicited RA 최대 간격 |
| 8 | Home Agent Information | RA | MIPv6 Home Agent preference/lifetime |
| 9/10 | Source/Target Address List | IND | link-layer address에 대응하는 IPv6 address list |
| 11-16 | CGA, RSA Signature, Timestamp, Nonce, Trust Anchor, Certificate | SEND | ND 보안, replay 방지, certificate path |
| 17/19/20 | IP Address/Prefix, Link-Layer Address, NAACK | FMIPv6 | care-of address, AP/NAR address, handover 응답 |
| 24 | Route Information | RA | off-link prefix에 대한 preferred router |
| 25 | Recursive DNS Server (RDNSS) | RA | recursive DNS server IPv6 address |
| 26 | RA Flags Extension (EFO) | RA | RA flag 공간 확장 |
| 27/28 | Handover Key Request/Reply | FMIPv6 with SEND | handover key 교환 |
| 31 | DNS Search List (DNSSL) | RA | DNS search domain list |

##### Source/Target Link-Layer Address Option

`Source Link-Layer Address option (Type 1)`은 RS, NS, RA에서 sender의 link-layer address를 전달한다. link-layer addressing을 지원하는 network에서는 multicast NS에 반드시 들어가야 하고, RS/RA에서도 보통 포함된다. link-layer address가 여러 개인 node라면 option이 여러 번 등장할 수 있다.

`Target Link-Layer Address option (Type 2)`은 NA와 Redirect에서 target 또는 새 next hop의 link-layer address를 전달한다. multicast solicitation에 응답하는 NA에는 반드시 들어가야 한다. Redirect에서도 보통 포함되며, NBMA network에서는 효율적인 next-hop address resolution을 위해 특히 중요하다.

##### Prefix Information Option

`Prefix Information option (PIO, Type 3)`은 RA와 Mobile Prefix Advertisement에서 local link의 IPv6 prefix 또는 경우에 따라 router의 complete IPv6 address를 전달한다. Router는 자신이 사용하는 각 prefix마다 PIO를 포함하는 것이 원칙이다.

![Figure 8-43](@/assets/images/cs-tcp-ip-illustrated-168-figure-8-43-page-449.png)
*Figure 8-43 · PDF p. 449 · Prefix Information option은 Prefix Length, L/A/R flag, Valid/Preferred Lifetime, Prefix를 담는다.*

PIO의 flag와 lifetime은 IPv6 host가 주소와 on-link 판단을 어떻게 할지 결정한다.

| PIO field/flag | 의미 |
| --- | --- |
| `Prefix Length` | Prefix field에서 유효한 leading bits 수 |
| `L (on-link)` | 이 prefix를 on-link determination에 사용할 수 있음 |
| `A (autonomous)` | 이 prefix를 SLAAC address autoconfiguration에 사용할 수 있음 |
| `R` | Prefix field가 단순 prefix가 아니라 sending router의 complete global IPv6 address임을 표시 |
| `Valid Lifetime` | prefix를 on-link determination에 사용할 수 있는 시간 |
| `Preferred Lifetime` | prefix를 automatic address autoconfiguration에 preferred 상태로 쓸 수 있는 시간 |

IPv4에서는 보통 같은 subnet mask/prefix를 공유하면 on-link라고 가정한다. IPv6에서는 그렇게 가정하지 않는다. node는 확인 정보가 없으면 off-link로 보고, PIO의 L bit, DHCPv6, manual configuration, ICMPv6 Redirect 같은 근거가 있을 때 on-link로 판단한다. 이 점은 IPv6 forwarding/direct delivery 사고방식에서 중요하다.

##### Redirected Header, MTU, Advertisement Interval, Home Agent Information

`Redirected Header option (Type 4)`은 ICMPv6 Redirect를 유발한 원래 IPv6 datagram의 일부 또는 전체 copy를 담는다. 이 option이 Redirect가 아닌 message에 있으면 무시된다. 전체 IPv6/ICMPv6 datagram은 최소 IPv6 MTU인 `1280 bytes`를 넘지 않아야 한다.

`MTU option (Type 5)`은 RA에서 host가 local link에서 사용할 MTU를 알려 준다. 여러 link-layer technology를 bridging해 서로 다른 MTU가 섞이는 환경에서 특히 중요하다. 이 option이 없고 bridge가 ICMPv6 PTB도 만들지 않는다면 host가 같은 bridged link의 다른 host와 안정적으로 통신하지 못할 수 있다.

`Advertisement Interval option (Type 7)`은 unsolicited multicast RA 사이의 최대 간격을 ms 단위로 나타낸다. sender router는 이 값보다 덜 자주 RA를 보내면 안 된다. Mobile IPv6 node의 movement detection algorithm에서 이 정보가 쓰일 수 있다.

`Home Agent Information option (Type 8)`은 RA의 H bit가 set된, 즉 router가 Mobile IPv6 Home Agent 역할을 할 수 있음을 알리는 경우에만 포함될 수 있다. `Home Agent Preference`가 클수록 더 선호되는 home agent이고, `Home Agent Lifetime`은 해당 router를 HA로 볼 수 있는 시간을 초 단위로 나타낸다.

##### IND와 FMIPv6 Options

`Source Address List option (Type 9)`과 `Target Address List option (Type 10)`은 IND message에서 link-layer address에 대응하는 IPv6 address list를 전달한다. Source Address List는 Source Link-Layer Address option이 식별하는 node의 주소 목록이고, Target Address List는 Destination Link-Layer Address option이 식별하는 node의 주소 목록이다.

FMIPv6 관련 option들은 handoff 직전/직후에 care-of address, next access router, AP link-layer address를 교환하는 데 쓰인다. `IP Address/Prefix option (Type 17)`은 old/new care-of address, New Access Router(NAR)의 IPv6 address 또는 prefix를 담는다. `Link-Layer Address option (Type 19)`은 wildcard AP, new AP, mobile node, NAR, RtSolPr/PrRtAdv sender 등 어떤 entity의 link-layer address인지 `Option-Code`로 구분한다. `Neighbor Advertisement ACK (NAACK, Type 20)`은 proposed New Care-of Address(NCoA)가 유효한지, 다른 address를 써야 하는지, link-layer address를 인식하지 못했는지 등을 status로 알려 준다.

##### SEND Options

SEND option은 ND message의 authenticity와 replay 방지를 담당한다. `CGA option (Type 11)`은 verifier가 CGA validation/signature validation을 수행하는 데 필요한 CGA parameters를 담는다. `RSA Signature option (Type 12)`은 sender가 CGA public key에 대응하는 private key를 가지고 있음을 증명한다.

![Figure 8-50](@/assets/images/cs-tcp-ip-illustrated-175-figure-8-50-page-454.png)
*Figure 8-50 · PDF p. 454 · SEND RSA Signature option은 Key Hash와 Digital Signature를 담아 CGA owner 검증에 사용된다.*

RSA Signature option의 `Key Hash`는 signature 생성에 쓰인 public key의 SHA-1 hash 상위 128 bits다. `Digital Signature`는 SEND CGA Message Type tag, source/destination IP address, ICMPv6 header 첫 32 bits, ND message header와 options를 대상으로 만든다. RSA Signature option 자신은 signature 대상에서 제외된다.

`Timestamp option (Type 13)`과 `Nonce option (Type 14)`은 replay attack을 줄인다. Timestamp는 1970년 1월 1일 00:00 UTC 이후 시간을 fixed-point 형태로 담고, Nonce는 최소 6 bytes의 random number를 담아 SEND message pair를 신선하게 만든다. `Trust Anchor option (Type 15)`은 certificate chain의 root name을 나타내며, name type은 DER X.502 name 또는 FQDN일 수 있다. `Certificate option (Type 16)`은 certification path의 단일 certificate를 담고, 현재 대표 cert type은 X.509v3 certificate다.

##### Route and DNS Configuration Options

`Route Information option (Type 24)`은 RA에서 특정 off-link prefix가 어떤 router를 통해 reachable한지, 그리고 그 router를 어느 정도 선호해야 하는지 알려 준다. 여러 default router가 있고 destination prefix별 성능/경로가 다를 때 유용하다. `Route Lifetime`은 해당 route prefix 정보를 유효하게 볼 시간을 초 단위로 나타내며 all-1s는 infinity다.

`Recursive DNS Server option (RDNSS, Type 25)`은 RA에 recursive DNS server IPv6 address list를 넣어 SLAAC 환경에서도 DNS server 정보를 얻을 수 있게 한다.

![Figure 8-59](@/assets/images/cs-tcp-ip-illustrated-184-figure-8-59-page-460.png)
*Figure 8-59 · PDF p. 460 · RDNSS option은 recursive DNS server IPv6 address list와 Lifetime을 RA에 실어 보낸다.*

`RA Flags Extension option (EFO, Type 26)`은 RA flags 공간을 확장하기 위한 option이다. `DNS Search List option (DNSSL, Type 31)`은 host가 DNS query를 만들 때 partial name 뒤에 붙일 domain search suffix list를 제공한다. domain name encoding은 DNS name format을 사용하며 compression은 쓰지 않는다.

`Handover Key Request option (Type 27)`과 `Handover Key Reply option (Type 28)`은 SEND로 보호되는 FMIPv6 signaling에서 handover key를 교환한다. Request는 handover key encryption public key를 제공하고, Reply는 mobile node의 public key로 암호화된 symmetric handover key와 key lifetime을 제공한다.

`Experimental values (Types 253, 254)`는 RFC3692 스타일 실험용으로 예약된 ND option type이다.

### 8.6 Translating ICMPv4 and ICMPv6

IPv4/IPv6 translator는 IP header만 바꾸지 않는다. ICMP를 변환할 때는 outer IP header, ICMP header, 그리고 ICMP error message 안에 들어 있는 internal offending packet header/data까지 변환해야 한다. 단순 Type/Code mapping 외에도 fragmentation, MTU, checksum이 걸린다.

가장 중요한 checksum 차이는 다음이다.

| 항목 | ICMPv4 | ICMPv6 |
| --- | --- | --- |
| checksum 범위 | ICMPv4 message 정보 | ICMPv6 message + IPv6 pseudo-header |
| pseudo-header | 사용하지 않음 | Source/Destination IPv6 Address, Length, Next Header 등 포함 |
| translation 영향 | 주소 변환이 checksum-neutral이 아니면 재계산 필요 | IPv6 pseudo-header checksum을 새로 계산해야 함 |

ICMP error message는 offending datagram 일부를 품고 있으므로, translator는 내부 header도 IPv4/IPv6 translation 규칙에 맞춰 바꾼다. 단, inner translation은 한 단계만 지원된다. 내부에 추가로 더 깊은 header가 나오면 packet은 discard된다.

#### 8.6.1 Translating ICMPv4 to ICMPv6

ICMPv4 informational message 중 ICMPv6로 변환되는 것은 `Echo Request (Type 8)`와 `Echo Reply (Type 0)`뿐이다. 각각 ICMPv6 `Echo Request (Type 128)`, `Echo Reply (Type 129)`로 바뀌고, 이후 ICMPv6 pseudo-header checksum을 계산한다. 다른 informational message는 변환하지 않고 drop한다.

ICMPv4 error message 중 변환 대상은 `Destination Unreachable (Type 3)`, `Time Exceeded (Type 11)`, `Parameter Problem (Type 12)`이다.

| ICMPv4 입력 | ICMPv6 출력 | 의미 |
| --- | --- | --- |
| `3/0 Network Unreachable`, `3/1 Host Unreachable` | `1/0 No Route` | IPv6 쪽에서는 no route로 통합 |
| `3/2 Protocol Unreachable` | `4/1 Parameter Problem - Unrecognized Next Header` | IPv4 Protocol field 문제를 IPv6 Next Header 문제로 매핑 |
| `3/3 Port Unreachable` | `1/4 Port Unreachable` | port unreachable 의미 유지 |
| `3/4 Fragmentation Required (PTB)` | `2/0 Packet Too Big` | MTU field는 IPv6 header 크기 차이를 반영해 조정 |
| `3/9`, `3/10`, `3/13`, `3/15` administrative 계열 | `1/1 Communication with Destination Administratively Prohibited` | policy 차단 의미 유지 |
| `11/0`, `11/1 Time Exceeded` | `3/0`, `3/1 Time Exceeded` | TTL/Hop Limit 또는 fragment reassembly code 유지 |
| `12/0`, `12/2 Parameter Problem` | `4/0 Erroneous Header Field` | Pointer 값을 IPv6 header offset으로 변환 |
| 변환 표에 없는 type/code | drop | 의미가 맞지 않으면 만들지 않음 |

`Parameter Problem`은 Pointer field가 header 안의 byte offset을 가리키므로 추가 변환이 필요하다. 예를 들어 IPv4 `Protocol` field의 pointer 9는 IPv6 `Next Header` field의 pointer 6으로 매핑된다. IPv4 `TTL` pointer 8은 IPv6 `Hop Limit` pointer 7로 매핑된다. IPv4 source/destination address pointer 범위는 IPv6 source/destination address field 시작 offset인 8, 24로 매핑된다. IPv4 `Identification`, `Flags/Fragment Offset`, `Header Checksum`처럼 IPv6 base header에 대응 field가 없는 경우는 Pointer mapping이 불가능하다.

IPv4에서 IPv6로 변환할 때 DF bit가 set되지 않은 IPv4 packet은 IPv6 Fragment header를 가진 하나 이상의 IPv6 packet으로 바뀔 수 있다. 이유는 IPv4 router는 fragmentation을 할 수 있지만 IPv6 router는 하지 않기 때문이다. ICMPv4 PTB가 ICMPv6 PTB로 바뀔 때는 MTU가 IPv6 minimum link MTU `1280 bytes`보다 작게 나타날 수도 있는데, 정상 IPv6 stack은 이후 같은 destination으로 보낼 datagram에 Fragment header를 붙여 처리할 수 있어야 한다.

#### 8.6.2 Translating ICMPv6 to ICMPv4

ICMPv6 informational message도 `Echo Request (Type 128)`와 `Echo Reply (Type 129)`만 ICMPv4 `Type 8`, `Type 0`으로 변환된다. ICMPv4 checksum은 pseudo-header를 쓰지 않으므로, type 변경과 address translation 결과를 반영해 checksum을 다시 맞춘다.

ICMPv6 error message의 대표 mapping은 다음과 같다.

| ICMPv6 입력 | ICMPv4 출력 | 의미 |
| --- | --- | --- |
| `1/0 No Route` | `3/1 Host Unreachable` | IPv4 쪽에서는 host unreachable로 표현 |
| `1/1 Administratively Prohibited` | `3/10 Host Administratively Prohibited` | destination host administratively prohibited |
| `1/2 Beyond Scope of Source Address` | `3/1 Host Unreachable` | IPv4에는 scope 개념이 없어 host unreachable로 축소 |
| `1/3 Address Unreachable` | `3/1 Host Unreachable` | host unreachable로 변환 |
| `1/4 Port Unreachable` | `3/3 Port Unreachable` | port unreachable 유지 |
| `2/0 Packet Too Big` | `3/4 Fragmentation Required (PTB)` | MTU field는 IPv6 header 크기 차이를 반영 |
| `3/0`, `3/1 Time Exceeded` | `11/0`, `11/1 Time Exceeded` | code 유지 |
| `4/0 Parameter Problem` | `12/0 Parameter Problem` | Pointer를 IPv4 offset으로 변환 |
| `4/1 Unrecognized Next Header` | `3/2 Protocol Unreachable` | IPv6 Next Header 문제를 IPv4 Protocol 문제로 변환 |
| `4/2 Unrecognized IPv6 Option` | drop | IPv4에 적절한 대응 없음 |

ICMPv6 Parameter Problem의 Pointer도 IPv4 header offset으로 바꿔야 한다. IPv6 `Next Header` pointer 6은 IPv4 `Protocol` pointer 9로, IPv6 `Hop Limit` pointer 7은 IPv4 `Time to Live` pointer 8로, IPv6 Source/Destination IP Address pointer 범위는 IPv4 source/destination address field 시작 offset 12와 16으로 매핑된다. IPv6 `Flow Label`이나 일부 `Payload Length` 위치처럼 IPv4에 정확한 대응이 없는 field는 변환이 불가능하다.

IPv6에는 “Don't Fragment” 표시가 따로 없다. IPv6에서는 router fragmentation이 원칙적으로 없으므로 “항상 don't fragment”처럼 생각해야 한다. 따라서 translator에 도착한 IPv6 packet이 IPv4 next-hop interface MTU에 맞지 않으면 translator는 packet을 discard하고, IPv6 source에게 적절한 ICMPv6 PTB를 돌려보낸다.

### 8.7 Attacks Involving ICMP

ICMP 관련 공격은 크게 `floods`, `bombs`, `information disclosure`로 나눌 수 있다. Flood는 대량 traffic을 만들어 DoS를 유발하고, bomb/nuke 계열은 특수하게 만든 message로 IP/ICMP processing crash나 hang을 노린다. Information disclosure는 직접 피해가 작아 보여도 topology, host behavior, 시간 정보 같은 단서를 제공해 다른 공격을 더 정확하게 만든다.

| 공격/위험 | 악용되는 ICMP 성격 | 핵심 영향 |
| --- | --- | --- |
| `smurf attack` | ICMPv4 Echo Request를 directed broadcast로 보내 다수 host가 reply | victim source spoofing과 결합해 대량 Echo Reply로 DoS |
| `ping of death` | fragment 재조립 후 64KB를 넘는 비정상 IPv4 datagram | 취약 구현 crash |
| `teardrop attack` | IPv4 Fragment Offset 조작 | fragment reassembly 오류 유발 |
| `land attack` | source IP와 destination IP가 victim으로 같은 ICMP message | 일부 구현의 비정상 처리 유발 |
| Redirect attack | ICMP Redirect로 잘못된 next hop 주입 | man-in-the-middle, traffic capture/modify, routing loop |
| rogue RA/RS | Router Advertisement/Solicitation 악용 | default route를 공격자 장비로 바꾸거나 local topology 학습 |
| TFN(Tribe Flood Network) | ICMP를 covert coordination channel로 사용 | 침해된 host들 사이의 공격 제어 |
| Destination Unreachable abuse | Host/Port/Protocol Unreachable을 spoofing | TCP connection 등 transport-layer connection 종료 유도 |
| Timestamp Request/Reply | host time disclosure | pseudo-random seed 추정 등 cryptographic attack 단서 |
| PTB modification | recommended MTU 값 조작 | TCP가 매우 작은 packet으로 동작해 성능 저하 |

ICMP Redirect와 rogue RA는 ARP poisoning과 비슷한 결과를 만들 수 있다. 즉 host의 next-hop 판단을 공격자가 원하는 방향으로 바꾸고, traffic을 중간에서 보거나 수정하게 만든다. ICMP Redirect는 current default router에서 온 것인지 검사하는 등 여러 check가 있지만, 암호학적 authenticity를 보장하지 않으면 spoofing 가능성이 남는다.

PTB 공격은 단순 drop보다 더 교묘하다. PMTUD는 PTB 안의 MTU 값을 믿고 packet size를 조절하므로, 공격자가 이 값을 작게 만들면 TCP 같은 transport protocol이 지나치게 작은 segment를 보내 성능이 급격히 나빠질 수 있다. 반대로 ICMP PTB를 firewall에서 무조건 막으면 PMTUD가 깨져 path black hole 문제가 생길 수 있다.

결론은 “ICMP를 전부 허용하라”도 아니고 “ICMP를 전부 막아라”도 아니다. ICMPv4는 ping/traceroute/PMTUD/diagnostic에 필요하고, ICMPv6는 ND, RA, MLD 같은 기본 동작에 필요하다. 따라서 firewall filtering은 message type/code, direction, link-local 범위, rate limiting, SEND 같은 authentication 여부를 고려해 설계해야 한다.

### 8.8 Summary

ICMPv4와 ICMPv6는 IP implementation의 필수 구성요소다. ICMP message는 IP datagram에 실리며, error message와 informational message로 크게 나뉜다. Error message는 다시 error에 대한 error를 만들지 않는 등 생성 제한을 갖고, rate limiting을 통해 traffic cascade를 막는다.

ICMP error message의 가장 중요한 구조적 특징은 offending datagram의 IP header와 payload 앞부분을 포함한다는 점이다. 이 정보가 있어야 수신 측이 원래 문제가 TCP인지 UDP인지, 어떤 port/process와 관련 있는지 찾아낼 수 있다. RFC4884의 Extended ICMP는 더 복잡한 protocol layering과 진단 정보를 위해 multipart extension object를 붙일 수 있게 한다.

ICMPv4에서 특히 중요한 message는 `Destination Unreachable`, `Redirect`, `Time Exceeded`, `Parameter Problem`, `Echo Request/Reply`다. `Port Unreachable`은 UDP application 오류 전달과 연결되고, `Fragmentation Required/PTB`는 PMTUD와 연결된다. `Time Exceeded`는 traceroute의 작동 기반이다.

ICMPv6는 ICMPv4보다 훨씬 더 핵심적이다. ICMPv6는 ICMPv4의 유용한 error/informational 기능을 포함할 뿐 아니라, IPv6의 Neighbor Discovery(ND), Router Discovery, SLAAC 지원, on-link/default router discovery, MLD multicast membership 관리, Mobile IPv6 discovery, SEND 보안 확장까지 담당한다. IPv6에서 ICMPv6를 과도하게 막으면 “진단 도구가 안 됨” 수준이 아니라 IPv6 자체의 정상 동작이 깨질 수 있다.

## 연결 관계

| 연결 대상 | 이 장과의 관계 |
| --- | --- |
| Chapter 2 Internet Address Architecture | IPv6 scope, link-local/global address, CGA, solicited-node multicast address 이해에 필요 |
| Chapter 4 ARP | IPv6 ND의 NS/NA가 IPv4 ARP Request/Reply를 대체하는 구조 비교 |
| Chapter 5 IP | TTL/Hop Limit, fragmentation, PMTUD, direct delivery, forwarding table, Redirect 이해에 필요 |
| Chapter 6 DHCP and Autoconfiguration | RA의 M/O flag, PIO의 A flag, SLAAC와 DHCPv6 역할 분담 |
| Chapter 7 Firewall and NAT | ICMP filtering, NAT의 Echo Identifier 처리, IPv4/IPv6 translation, PTB 차단 문제 |
| Chapter 9 Broadcast and Multicast | MLD, MLDv2, MRD, solicited-node multicast, link-layer multicast |
| Chapter 10 UDP | Port Unreachable, TFTP 예시, UDP socket이 ICMP error를 application에 전달하는 방식 |
| Chapter 13/14 TCP | ICMP error에 대한 TCP 반응, PMTUD, PTB 조작 공격 |
| Chapter 18 Security | SEND, CGA, RSA Signature, trust anchor, certificate path, replay 방지 |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
| --- | --- |
| ICMP는 ping만 위한 protocol이다. | ping은 일부일 뿐이다. ICMP는 error reporting, PMTUD, Redirect, IPv6 ND/RA/MLD까지 담당한다. |
| ICMP error는 모든 문제에 대해 항상 생성된다. | error loop와 broadcast storm을 막기 위해 ICMP error 생성은 강하게 제한된다. |
| ICMPv6도 ICMPv4처럼 보조 진단 protocol이다. | ICMPv6는 IPv6 기본 운영 protocol에 가깝다. ND와 RA가 막히면 IPv6 주소 설정/neighbor resolution이 망가진다. |
| IPv6에서 router가 packet을 fragment한다. | IPv6 router는 fragmentation하지 않는다. PTB로 sender에게 size 조정을 요구한다. |
| 같은 IPv6 prefix면 당연히 on-link다. | IPv6에서는 on-link 여부를 확인 정보 없이 가정하지 않는다. PIO L bit, Redirect, DHCPv6, manual config 등이 근거다. |
| SEND는 IPsec을 쓰는 ND 보안이다. | SEND는 IPsec이 아니라 CGA, RSA Signature, certificate/trust anchor option 등 자체 mechanism을 쓴다. |

## 면접 질문

1. ICMP error message가 offending datagram의 IP header와 payload 앞부분을 포함하는 이유는 무엇인가?
2. ICMPv4 `Destination Unreachable code 4`와 ICMPv6 `Packet Too Big`은 PMTUD에서 어떤 역할을 하는가?
3. traceroute가 TTL/Hop Limit과 ICMP Time Exceeded를 이용해 hop별 router를 찾는 과정을 설명하라.
4. IPv6 Neighbor Discovery가 IPv4 ARP와 다른 점을 multicast, Hop Limit 255, NS/NA 관점에서 설명하라.
5. RA의 `M`, `O`, `Prefix Information option`의 `L`, `A` flag는 각각 어떤 설정 결정을 유도하는가?
6. NUD의 `INCOMPLETE`, `REACHABLE`, `STALE`, `DELAY`, `PROBE` 상태는 neighbor cache에서 어떤 의미를 갖는가?
7. SEND의 CGA verification과 signature verification은 각각 무엇을 증명하는가?
8. IPv4/IPv6 translator가 ICMP error message를 변환할 때 inner offending datagram까지 변환해야 하는 이유는 무엇인가?
9. ICMP를 firewall에서 무조건 차단하면 IPv4와 IPv6에서 각각 어떤 문제가 생길 수 있는가?
