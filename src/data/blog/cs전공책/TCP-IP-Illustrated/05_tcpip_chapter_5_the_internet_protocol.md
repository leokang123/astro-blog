---
title: "Chapter 5. The Internet Protocol"
order: 5
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: Chapter 5. The Internet Protocol"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

Internet Protocol(IP)는 TCP/IP protocol suite의 중심 데이터그램 계층이다. TCP, UDP, ICMP, IGMP 데이터는 모두 IP datagram으로 실려 이동하며, IP 자체는 `best-effort`, `connectionless` 전달 모델만 제공한다. 즉, IP는 datagram을 목적지까지 보내려고 시도하지만 성공, 순서, 중복 없음, 내용 무결성을 보장하지 않는다. 라우터 버퍼가 부족하거나 routing loop가 생기면 datagram이 버려질 수 있고, 필요한 신뢰성은 TCP 같은 상위 계층이 맡는다.

`connectionless`라는 말은 라우터가 같은 흐름의 datagram 사이에 연결 상태(connection state)를 유지하지 않는다는 뜻이다. 같은 출발지와 목적지를 가진 datagram A, B도 독립적으로 forwarding되므로 서로 다른 경로를 지나거나 B가 A보다 먼저 도착할 수 있다. 그래서 IP 계층을 이해할 때는 "패킷 하나하나가 독립적인 운반 단위"라는 감각이 중요하다.

## 핵심 개념

- IP datagram: IP 계층이 전달하는 기본 단위다. IPv4 datagram은 가변 길이 header를 가지며, IPv6 datagram은 고정 40-byte base header와 필요한 extension header chain을 사용한다.
- best-effort delivery: IP는 전달을 시도하지만 성공을 보장하지 않는다. 손실, 중복, 순서 뒤바뀜, 오류 가능성은 상위 계층이 처리한다.
- connectionless forwarding: 라우터는 datagram 사이의 연결 상태를 유지하지 않고 각 datagram을 독립적으로 처리한다.
- network byte order: TCP/IP header의 binary integer는 big endian byte ordering으로 전송된다. little endian CPU는 송수신 시 header 값을 변환해야 한다.
- dual stack: IPv4와 IPv6는 `Version` field 위치만 공유하고 header 구조가 다르므로 직접 상호운용되지 않는다. 둘 다 처리하려면 host/router가 dual stack으로 동작해야 한다.
- TTL / Hop Limit: routing loop로 datagram이 네트워크에 영원히 남지 않도록 hop마다 감소하는 수명 제한이다.
- Protocol / Next Header: payload 또는 다음 header의 종류를 알려 demultiplexing을 가능하게 한다.
- Header Checksum: IPv4 header만 보호한다. IPv6 base header에는 checksum이 없고, 필요한 무결성은 link layer 또는 TCP/UDP/ICMP 같은 상위 계층 checksum에 의존한다.

## 세부 정리

### 5.1 Introduction

IP는 "잘 전달해 보되, 실패하면 보장하지 않는" 계층이다. 이 단순함이 IP의 핵심 설계 trade-off다. 네트워크 내부 라우터가 연결 상태와 재전송 책임을 갖지 않으므로 forwarding 장비를 단순하게 만들 수 있지만, 애플리케이션이 원하는 reliable byte stream, 순서 보장, 오류 복구는 TCP 같은 상위 계층에서 별도로 만들어야 한다.

IP datagram에는 여러 일이 생길 수 있다.

- datagram loss: 라우터 버퍼 부족, 경로 문제 등으로 버려질 수 있다.
- reordering: 같은 목적지로 가는 datagram들이 서로 다른 경로를 지나 순서가 바뀔 수 있다.
- duplication: 전송 중 중복될 수 있다.
- corruption: bit error 등으로 내용이 바뀔 수 있다.

IPv4와 IPv6는 모두 이 기본 모델을 공유한다. 차이는 주소 길이, header 구조, fragmentation 처리, option 처리 방식에서 커진다.

### 5.2 IPv4 and IPv6 Headers

IPv4 header는 보통 20 bytes지만, `Options`가 붙으면 `IHL` 값에 따라 최대 60 bytes까지 늘어날 수 있다. IPv6 base header는 항상 40 bytes이고, IPv4 options에 해당하는 기능은 base header 안에 넣지 않고 `IPv6 extension headers`로 분리한다.

IPv4와 IPv6 header 구조는 아래 두 그림으로 한 번에 잡는 것이 좋다. IPv4는 길이가 변하고 fragmentation 관련 field가 base header 안에 있으며, IPv6는 고정 header와 `Next Header` 기반 chain 구조를 사용한다.

![Figure 5-1](@/assets/images/cs-tcp-ip-illustrated-056-figure-5-1-page-221.png)
*Figure 5-1 · PDF p. 221 · IPv4 datagram header 구조*

![Figure 5-2](@/assets/images/cs-tcp-ip-illustrated-057-figure-5-2-page-221.png)
*Figure 5-2 · PDF p. 221 · IPv6 fixed header와 Next Header 기반 확장 구조*

header 그림의 bit 번호는 32-bit word 기준으로 왼쪽의 most significant bit가 0, 오른쪽의 least significant bit가 31이다. TCP/IP header의 정수 값은 네트워크에서 `big endian byte ordering`, 즉 `network byte order`로 전달된다.

### 5.2.1 IP Header Fields

`Version` field는 4-bit이고 IPv4는 4, IPv6는 6을 담는다. IPv4와 IPv6는 이 field 위치만 공유할 뿐 나머지 header는 다르다. 따라서 IPv4 packet을 IPv6 packet처럼 처리하거나 그 반대로 처리할 수 없고, 양쪽을 동시에 지원하려면 dual stack이 필요하다.

`Internet Header Length(IHL)`은 IPv4 header 길이를 32-bit word 단위로 나타낸다. IHL도 4-bit라서 IPv4 header는 최대 15 words, 즉 60 bytes로 제한된다. options가 없는 일반 IPv4 header의 IHL 값은 5다. IPv6는 base header 길이가 40 bytes로 고정되어 IHL field가 없다.

초기 IPv4의 `Type of Service(ToS)` byte와 IPv6의 `Traffic Class` byte는 널리 쓰이지 못했고, 이후 같은 8-bit 영역이 `Differentiated Services Field(DS Field)` 6 bits와 `Explicit Congestion Notification(ECN)` 2 bits로 재정의되었다. 이 field들은 forwarding 중 datagram이 어떤 특별한 처리(forwarding treatment)를 받을지 표현한다.

IPv6 header의 `Flow Label`은 같은 flow에 속하는 packet을 식별해 특별한 처리를 가능하게 하려는 20-bit field다. 이 장의 중심 설명은 DS Field/ECN과 extension header에 있지만, IPv6 base header를 볼 때 Traffic Class 뒤에 Flow Label이 붙는다는 구조는 기억해 둘 만하다.

`Total Length`는 IPv4 datagram 전체 길이를 byte 단위로 나타낸다. IHL과 함께 보면 data 부분의 시작 위치와 길이를 알 수 있다. 16-bit field라 IPv4 datagram의 최대 길이는 header 포함 65,535 bytes다. 이 field가 필요한 이유는 Ethernet처럼 하위 계층이 padding을 붙여 실제 IP datagram 길이를 정확히 드러내지 않을 수 있기 때문이다. 예를 들어 Ethernet 최소 payload는 46 bytes지만 IPv4 datagram은 20 bytes일 수 있으므로, Total Length가 없으면 IP 구현이 padding과 실제 datagram을 구분하기 어렵다.

IPv4 datagram은 이론상 65,535 bytes까지 가능하지만, 많은 link layer는 그렇게 큰 datagram을 한 번에 운반하지 못해 fragmentation이 필요하다. 또한 IPv4 host는 576 bytes보다 큰 datagram 수신을 반드시 지원할 필요가 없었다. 그래서 DNS, DHCP처럼 UDP를 쓰는 애플리케이션은 IPv4의 576-byte 한계를 피하려고 512 bytes 정도의 data size를 사용하는 전통이 생겼다. 반면 IPv6 host는 적어도 attached link의 MTU만큼, 그리고 IPv6 최소 link MTU인 1280 bytes 이상은 처리할 수 있어야 한다.

IPv6에는 IPv4의 Total Length 대신 `Payload Length`가 있다. 이 값은 IPv6 base header 40 bytes를 제외한 payload 길이를 나타내며, extension headers는 payload length에 포함된다. IPv6도 일반 Payload Length field는 16-bit라 65,535 bytes가 한계지만, `jumbogram` option을 쓰면 이론적으로 훨씬 큰 payload를 표현할 수 있다.

`Identification` field는 IPv4 fragmentation에서 같은 원래 datagram의 fragment들을 서로 묶어 식별하는 데 중요하다. 송신 host는 보통 datagram을 보낼 때 내부 counter를 증가시키고 그 값을 IPv4 Identification에 넣는다. IPv6에서는 이 기능이 base header가 아니라 `Fragment extension header`로 이동한다.

`Time-to-Live(TTL)`은 datagram이 통과할 수 있는 router 수의 상한처럼 동작한다. 송신자가 초기값을 넣고, 각 router가 forwarding할 때 1씩 감소시킨다. 0이 되면 datagram은 폐기되고 ICMP message로 송신자에게 알려진다. 원래 TTL은 초 단위 lifetime 개념도 포함했지만, 실제로는 hop count처럼 쓰였고 IPv6에서는 이름도 그 의미에 맞게 `Hop Limit`이 되었다.

`Protocol` field는 IPv4 payload에 어떤 protocol이 들어 있는지 나타낸다. 예를 들어 UDP는 17, TCP는 6이다. 이 field 덕분에 IP는 payload를 TCP, UDP, ICMP 같은 상위 처리기로 demultiplexing할 수 있다. IPv6의 `Next Header` field는 이 개념을 일반화해, 다음에 오는 것이 transport header인지 IPv6 extension header인지를 나타낸다.

`Header Checksum`은 IPv4 header만 대상으로 계산된다. IP payload의 correctness는 보장하지 않으므로 TCP, UDP, ICMP, IGMP 같은 encapsulated protocol이 자기 header와 data를 대상으로 checksum을 둔다. IPv6 base header에는 checksum field가 없다. 이는 link technology와 상위 계층 checksum이 이미 오류 검출을 수행하고, IPv6 router가 hop마다 checksum을 다시 계산하는 비용을 줄이려는 설계 선택이다.

IPv4와 IPv6의 `Source IP Address`, `Destination IP Address`는 각각 32-bit, 128-bit다. 보통 하나의 host가 아니라 하나의 interface를 식별한다고 보는 편이 정확하다. 다만 multicast와 broadcast 주소는 이 규칙을 깨는 특수 주소다. IPv4의 32-bit 주소 공간은 약 45억 개로 보이지만 실제 Internet entity를 수용하기에는 부족했고, 이것이 IPv6 전환의 핵심 동기 중 하나다.

### 5.2.2 The Internet Checksum

`Internet checksum`은 수신한 message 또는 message 일부가 송신된 것과 대체로 같은지 검사하기 위한 16-bit one's complement sum이다. CRC(cyclic redundancy check)보다 보호 강도는 약하지만, IP와 여러 Internet protocol에서 오래 쓰인 간단한 오류 검출 방식이다.

IPv4 header checksum 계산 절차는 다음과 같다.

1. 송신할 datagram의 `Checksum` field를 먼저 0으로 둔다.
2. IPv4 header 전체를 16-bit word들의 나열로 보고 one's complement sum을 구한다.
3. 그 sum의 one's complement를 `Checksum` field에 넣어 전송한다.
4. 수신자는 header와 Checksum field를 포함해 다시 checksum을 계산한다.
5. 오류가 없다면 결과가 0이 된다. nonzero이면 IPv4 implementation은 datagram을 폐기하고, 별도 error message는 만들지 않는다.

![Figure 5-3](@/assets/images/cs-tcp-ip-illustrated-058-figure-5-3-page-226.png)
*Figure 5-3 · PDF p. 226 · Internet checksum 계산과 검증 예*

one's complement addition은 carry가 발생하면 그 carry를 다시 하위 bit에 더하는 `end-round-carry addition`으로 구현한다. 이 성질 때문에 송신자가 checksum을 넣은 뒤 수신자가 전체 header를 다시 더하면 정상 packet에서는 모든 bit가 1인 값의 one's complement, 즉 0이 나온다.

라우터가 IPv4 datagram을 forwarding할 때마다 TTL이 감소하므로 IPv4 header checksum도 바뀌어야 한다. 이것은 IPv6가 header checksum을 제거한 이유를 이해하는 데 중요하다. IPv4에서는 hop마다 TTL 수정과 checksum 재계산이 필요하지만, IPv6에서는 Hop Limit만 바꾸고 별도 IP header checksum은 갱신하지 않는다.

### 5.2.2.1 Mathematics of the Internet Checksum

원문은 Internet checksum의 수학적 배경을 Abelian group 관점에서 설명한다. 실무적으로 중요한 감각은 "16-bit one's complement sum에서 0000과 FFFF가 특수하게 zero처럼 행동한다"는 점이다. 검증 결과가 0이 되어야 한다는 표현은, 송신자가 넣은 checksum이 나머지 header sum의 보수라서 전체 합이 one's complement 관점의 identity가 되도록 맞춘다는 뜻이다. 이 장에서 필요한 수준은 계산 절차와 검증 결과의 의미를 이해하는 것이다.

### 5.2.3 DS Field and ECN

`Differentiated Services Field(DS Field)`와 `Explicit Congestion Notification(ECN)`은 IPv4 header의 예전 `Type of Service(ToS)` byte, IPv6 header의 예전 `Traffic Class` byte 자리를 재정의한 것이다. 둘은 같은 8-bit 영역을 공유하지만 목적은 다르다.

- DS Field: 상위 6 bits에 `Differentiated Services Code Point(DSCP)`를 넣어 router가 적용할 forwarding treatment를 표시한다.
- ECN: 하위 2 bits로 congestion을 packet drop 전에 표시할 수 있게 한다.

DiffServ는 Internet에서 모든 traffic을 동일한 best-effort로만 다루지 않고, class별로 다른 service를 제공하려는 framework다. DSCP 값은 특정 `per-hop behavior(PHB)`를 가리키며, router는 그 PHB에 따라 queueing priority, drop probability 같은 처리를 다르게 할 수 있다. 기본 DSCP 값은 보통 0이고 routine best-effort traffic에 해당한다.

![Figure 5-5](@/assets/images/cs-tcp-ip-illustrated-060-figure-5-5-page-229.png)
*Figure 5-5 · PDF p. 229 · DSCP 6 bits와 ECN 2 bits의 배치*

ECN은 congestion이 이미 지속되는 router가 packet을 그냥 버리기 전에 "이 datagram이 혼잡을 경험했다"는 표시를 남기는 메커니즘이다. 목적지에 도착한 transport protocol, 대표적으로 TCP가 이 표시를 보고 송신자에게 알려 주면, 송신자는 전송률을 줄여 congestion을 완화할 수 있다. 핵심은 congestion signal을 loss로만 표현하지 않고 header bit로도 표현한다는 점이다.

DSCP 값은 크게 standardized use, experimental/local use, eventual standardization intent를 가진 experimental/local use pool로 나뉜다. 원문의 표는 많은 code point를 나열하지만, 개념적으로는 다음 세 가지가 중요하다.

| 용어 | 의미 | 기억할 점 |
|---|---|---|
| Class Selector(CS) | 예전 IP Precedence와 호환성을 고려한 class | `CS0`은 best-effort/routine |
| Assured Forwarding(AFij) | class `i`와 drop precedence `j`를 결합 | 같은 class 안에서도 어떤 packet을 먼저 drop할지 구분 |
| Expedited Forwarding(EF) | 낮은 delay, jitter, loss를 목표로 하는 service | EF traffic의 output rate가 input rate 이상이어야 queueing 지연이 작아짐 |

DiffServ가 어려운 이유는 bit field 자체보다 policy와 economics 때문이다. 고우선순위 traffic을 누가 얼마나 보낼 수 있는지, ISP가 차등 요금을 어떻게 적용할지, fairness를 어떻게 보장할지 같은 문제가 protocol mechanism 밖에 붙는다.

### 5.2.4 IP Options

IPv4는 datagram마다 선택적으로 `IP Options`를 넣을 수 있다. 하지만 오늘날 Internet에서는 대부분의 IPv4 options가 드물거나 차단된다. 이유는 세 가지다.

- IPv4 header는 IHL 때문에 최대 60 bytes라 option 공간이 매우 작다.
- Source Route, Record Route 같은 options는 header 안에 IPv4 주소를 넣어야 하는데, 현대 Internet path의 hop 수를 담기엔 부족하다.
- options가 있으면 router/firewall이 fast path로 처리하기 어렵고, 보안 정책도 복잡해진다.

IPv4 option area는 항상 32-bit boundary에서 끝나야 하며 필요하면 value 0의 padding byte가 붙는다. option type field는 `Copy` 1 bit, `Class` 2 bits, `Number` 5 bits로 나뉜다. `Copy` bit는 datagram이 fragmentation될 때 해당 option을 fragment에 복사해야 하는지 나타낸다.

대표적 IPv4 options의 의미는 다음 정도만 잡으면 된다.

| Option | 핵심 의미 | 오늘날 위치 |
|---|---|---|
| End of List / No Op | option 끝, padding/정렬 | 구조 보조용 |
| Source Routing | 송신자가 거쳐야 할 router waypoint 지정 | 보안상 rare, often filtered |
| Record Route | packet이 지나간 경로를 header에 기록 | header 공간 부족으로 rare |
| Timestamp | source/destination의 시각 기록 | rare |
| Router Alert | router가 일반 forwarding 외 추가 처리를 해야 함을 표시 | 상대적으로 occasional |
| Quick-Start | transport protocol의 빠른 시작 실험 | rare/experimental |

IPv6는 IPv4처럼 base header 안에 options를 넣지 않는다. 대부분의 기능을 `IPv6 extension headers`로 옮겨, base header는 고정 크기로 유지하고 필요한 경우에만 추가 header chain을 붙인다. 이 설계는 일반 packet의 fast forwarding을 단순하게 만들지만, extension header가 있는 packet은 router나 middlebox에서 느리게 처리되거나 제한될 수 있다.

### 5.3 IPv6 Extension Headers

IPv6의 중요한 설계 선택은 "자주 쓰지 않는 기능을 base header에서 빼고, 필요할 때만 extension header로 붙인다"는 것이다. IPv4 options에 있던 routing, timestamp 성격의 기능, fragmentation, extra-large packet 같은 기능은 IPv6 base header가 아니라 확장 header로 표현된다.

이 선택의 효과는 두 방향이다.

- 장점: IPv6 base header가 항상 40 bytes라 router의 fast forwarding path를 단순하게 만들 수 있다.
- 비용: extension header chain이 있는 packet은 처리 순서, middlebox 호환성, 보안 정책에서 복잡성이 생긴다.

IPv6 header chain은 각 header의 `Next Header` field가 다음 header의 type을 가리키는 방식으로 이어진다. 마지막에는 TCP, UDP, ICMPv6 같은 upper-layer header가 오거나, 더 이상 header가 없음을 나타내는 value 59가 올 수 있다.

![Figure 5-6](@/assets/images/cs-tcp-ip-illustrated-061-figure-5-6-page-234.png)
*Figure 5-6 · PDF p. 234 · IPv6 Next Header field로 이어지는 header chain*

대표적인 `Next Header` 값은 다음처럼 해석하면 된다.

| Header type | 값 | 핵심 역할 |
|---|---:|---|
| Hop-by-Hop Options(HOPOPT) | 0 | 모든 경로상 router가 처리해야 하는 유일한 일반 extension header |
| Routing | 43 | 경유지 또는 mobile IPv6 관련 routing 기능 |
| Fragment | 44 | IPv6 fragmentation 정보 |
| ESP | 50 | IPsec payload protection |
| AH | 51 | IPsec authentication |
| Destination Options | 60 | 목적지 host가 처리할 option 집합 |
| Mobility(MIPv6) | 135 | Mobile IPv6 제어 기능 |
| ICMPv6 / UDP / TCP | 58 / 17 / 6 | 최종 upper-layer protocol |

extension header의 권장 순서는 있지만, `Hop-by-Hop Options`가 IPv6 header 바로 뒤에 와야 한다는 점만 강한 규칙이다. 구현은 실제 들어온 순서대로 처리할 준비가 되어 있어야 한다. `Destination Options` header만 두 번 나타날 수 있는데, 첫 번째는 현재 IPv6 header의 destination address에 대한 option이고, 두 번째는 Routing header 등을 거친 최종 목적지에 대한 option이다.

### 5.3.1 IPv6 Options

IPv6 options는 크게 두 위치에 담긴다.

- `Hop-by-Hop Options`: datagram이 지나는 모든 router가 봐야 하는 option이다.
- `Destination Options`: 수신 host, 또는 routing을 거친 최종 목적지가 봐야 하는 option이다.

두 option header 안의 option들은 공통적으로 `type-length-value(TLV)` 형식을 쓴다. TLV는 "무슨 option인지(type), option data 길이가 얼마인지(length), 실제 data(value)가 무엇인지"를 분리해, 새로운 option을 추가하더라도 기존 parser가 최소한 건너뛰거나 폐기 결정을 할 수 있게 해준다.

![Figure 5-7](@/assets/images/cs-tcp-ip-illustrated-062-figure-5-7-page-235.png)
*Figure 5-7 · PDF p. 235 · IPv6 Hop-by-Hop/Destination option의 TLV 구조*

option type 첫 byte에는 세 부분이 들어 있다.

| Subfield | 크기 | 의미 |
|---|---:|---|
| Action | 2 bits | option을 모를 때 skip할지, discard할지, ICMPv6 Parameter Problem을 보낼지 결정 |
| Chg(Change) | 1 bit | forwarding 중 option data가 바뀔 수 있는지 표시 |
| Type | 5 bits | 실제 option 종류 |

`Action` subfield는 incremental deployment를 위한 장치다. 새 option을 모르는 node가 datagram을 그대로 forwarding해도 되는지, 조용히 버려야 하는지, ICMPv6 error를 보내야 하는지를 option 자체가 지정한다. multicast destination에 대해 모르는 option을 만났을 때 다수 node가 동시에 error traffic을 만들 수 있으므로, multicast일 때는 ICMPv6를 보내지 않는 action도 있다.

### 5.3.1.1 Pad1 and PadN

IPv6 options는 8-byte offset에 맞춰 정렬된다. `Pad1`은 길이 field 없이 1 byte 0만 갖는 padding option이고, `PadN`은 TLV 형식으로 2 bytes 이상의 padding을 넣는다. 이 padding은 option parsing을 쉽게 하고 alignment 요구를 맞추기 위한 구조적 장치다.

### 5.3.1.2 IPv6 Jumbo Payload

일반 IPv6 `Payload Length`는 16-bit라 65,535 bytes를 넘는 payload를 표현하지 못한다. `Jumbo Payload` option은 supercomputer interconnect 같은 특수 환경에서 큰 data를 한 번에 옮기기 위해 32-bit payload size를 제공한다. 이때 IPv6 base header의 Payload Length는 0으로 둔다.

주의할 점은 TCP checksum 계산이다. TCP는 pseudo-header 계산에 IP payload length를 사용하므로, jumbogram에서는 IPv6 base header의 0이 아니라 Jumbo Payload option의 길이 값을 사용해야 한다. 큰 payload는 효율을 높일 수 있지만, undetected error 가능성도 커질 수 있다.

### 5.3.1.3 Tunnel Encapsulation Limit

`Tunnel Encapsulation Limit`은 tunnel nesting depth에 대한 TTL/Hop Limit 같은 역할을 한다. IP-in-IP처럼 한 IP datagram을 다른 IP datagram payload에 넣는 tunneling은 overlay network를 만드는 데 유용하지만, tunnel이 재귀적으로 중첩되면 제어가 어려워진다. 이 option 값이 0이면 추가 tunnel encapsulation을 하지 않고 datagram을 버리며 ICMPv6 Parameter Problem을 보낸다. nonzero이면 새 outer IPv6 datagram에 limit을 1 줄여 넣는다.

### 5.3.1.4 Router Alert

`Router Alert`는 datagram이 일반 forwarding 외에 router의 추가 처리를 필요로 한다는 표시다. IPv4 Router Alert와 같은 목적이며, 모든 packet을 slow path로 보내지 않고 필요한 packet만 router가 들여다보게 하는 성격의 최적화다.

### 5.3.1.5 Quick-Start

`Quick-Start(QS)` option은 sender가 원하는 transmission rate를 path상의 router들과 협상하려는 실험적 기능이다. router는 요청 rate를 받아들이거나 낮출 수 있고, receiver는 QS TTL과 일반 IPv4 TTL/IPv6 Hop Limit 차이를 sender에게 알려 path상의 모든 router가 참여했는지 확인하게 한다. global Internet보다는 private network에 제한적으로 적합한 기능으로 취급된다.

### 5.3.1.6 CALIPSO

`CALIPSO(Common Architecture Label IPv6 Security Option)`는 datagram에 security-level label을 붙이기 위한 option이다. 정부, 군사, 금융처럼 multilevel secure networking이 필요한 private network에서 data의 보안 등급을 표시하는 용도다. 이 장에서는 일반 Internet forwarding 원리보다 "IPv6 option이 보안 label 같은 특수 metadata도 담을 수 있다"는 위치만 잡으면 된다.

### 5.3.1.7 Home Address

`Home Address` option은 Mobile IPv6에서 이동 중인 node가 현재 임시 주소와 별개로 자신의 원래 home address를 알릴 때 쓴다. mobile node가 home network 밖에 있을 때도 상위 계층 연결을 유지하려면 상대 node가 "이 node의 안정적인 식별 주소"를 알아야 한다. Home Address option은 뒤의 Mobile IP, 특히 route optimization 설명과 직접 연결된다.

### 5.3.2 Routing Header

IPv6 `Routing header`는 송신자가 datagram이 지나갈 경로를 일부 제어하기 위한 extension header다. 역사적으로 type 0인 `RH0`와 type 2인 `RH2`가 있었는데, RH0는 보안 문제 때문에 deprecated되었고 RH2는 Mobile IP와 연결된다.

RH0는 IPv4의 loose Source Route, strict Source Route, Record Route option을 일반화한 형태다. sender가 방문할 IPv6 node 주소 vector를 header에 넣고, datagram이 각 waypoint에 도착할 때마다 IPv6 base header의 `Destination IP Address`와 Routing header 안의 다음 주소를 바꿔 가며 forwarding한다.

![Figure 5-8](@/assets/images/cs-tcp-ip-illustrated-063-figure-5-8-page-239.png)
*Figure 5-8 · PDF p. 239 · deprecated RH0 Routing header 형식*

Routing header의 핵심 field는 다음과 같다.

| Field | 의미 |
|---|---|
| Next Header | Routing header 뒤에 오는 header type |
| Header Extension Length | Routing header 길이 |
| Routing Type | RH0는 0, RH2는 2 |
| Segments Left | 아직 처리해야 할 명시적 route segment 수 |
| Address vector | 방문해야 할 IPv6 waypoint 주소들 |

동작은 `Segments Left`가 줄어들면서 base header destination이 다음 waypoint로 바뀌는 방식이다. 아래 그림에서는 S가 R2, R3, D를 경유하도록 의도하지만, 실제 forwarding 중에는 첫 destination이 R1로 설정되고 각 waypoint에서 주소가 swap된다.

![Figure 5-9](@/assets/images/cs-tcp-ip-illustrated-064-figure-5-9-page-240.png)
*Figure 5-9 · PDF p. 240 · RH0가 waypoint를 따라 Destination IP Address를 갱신하는 흐름*

RH0가 deprecated된 이유는 DoS amplification 가능성이다. RH0는 같은 주소를 주소 vector에 여러 번 넣을 수 있었고, 이 때문에 traffic이 두 node 또는 여러 node 사이를 반복적으로 오가며 특정 path의 대역폭을 과도하게 소모할 수 있었다. 결과적으로 RH0는 제거되고, IPv6에서 의미 있게 남은 Routing header는 Mobile IP용 RH2다. RH2는 단일 주소만 담을 수 있어 RH0의 반복 경유 문제를 크게 줄인다.

### 5.3.3 Fragment Header

IPv6 `Fragment header`는 source가 destination까지의 `path MTU`보다 큰 datagram을 보내야 할 때 사용한다. IPv4에서는 host뿐 아니라 router도 next-hop MTU에 맞춰 datagram을 fragment할 수 있지만, IPv6에서는 sender만 fragmentation을 수행한다. router가 중간에서 fragment하지 않는 대신, 너무 큰 packet은 ICMPv6 Packet Too Big을 통해 sender가 path MTU를 학습하는 방향으로 설계된다.

![Figure 5-11](@/assets/images/cs-tcp-ip-illustrated-066-figure-5-11-page-242.png)
*Figure 5-11 · PDF p. 242 · IPv6 Fragment header의 Identification, Offset, M bit*

Fragment header의 핵심 field는 다음과 같다.

| Field | 의미 |
|---|---|
| Next Header | fragment 뒤에 이어질 original upper-layer header type |
| Fragment Offset | original datagram의 fragmentable part 기준 byte 위치를 8-byte 단위로 표시 |
| M(More Fragments) bit | 1이면 뒤에 fragment가 더 있음, 0이면 마지막 fragment |
| Identification | 같은 original packet에서 나온 fragments를 묶는 32-bit 식별자 |

IPv6 fragmentation은 original packet을 두 부분으로 본다.

- unfragmentable part: IPv6 header와 intermediate node가 처리해야 하는 extension headers다. 각 fragment packet에 복사된다.
- fragmentable part: Destination Options, upper-layer headers, payload data 등 나머지 부분이다. 실제로 여러 조각으로 나뉜다.

각 fragment packet은 unfragmentable part를 복사하고, 그 뒤에 Fragment header와 fragment data를 붙인다. IPv6 header의 Payload Length는 해당 fragment packet 크기에 맞게 다시 설정된다. 수신자는 같은 Identification을 가진 모든 fragments를 모아 offset 순서대로 reassembly한 뒤 상위 protocol에 넘긴다.

![Figure 5-12](@/assets/images/cs-tcp-ip-illustrated-067-figure-5-12-page-243.png)
*Figure 5-12 · PDF p. 243 · 3960-byte IPv6 payload가 세 fragment로 나뉘는 예*

Figure 5-12의 예에서는 3960-byte payload를 Ethernet MTU 1500 bytes에 맞추기 위해 세 fragment로 나눈다. Fragment header가 8 bytes 추가되므로 각 fragment data는 1448 bytes 이하가 되며, offset은 8-byte 단위로 표현된다. 두 번째 fragment의 offset 181은 실제 byte offset `181 * 8 = 1448`을 뜻하고, 마지막 fragment의 offset 362는 `362 * 8 = 2896`을 뜻한다.

fragmentation은 기능적으로 유용하지만 비용이 있다. 예시에서 하나의 큰 IPv6 packet을 세 개로 나누면 IPv6 header가 두 개 더 생기고, Fragment header가 각 fragment에 추가된다. link-layer frame overhead까지 합치면 실제 네트워크가 운반해야 하는 byte가 늘어난다. 또한 fragment 중 하나만 손실되어도 original datagram 전체를 reassembly할 수 없으므로, 가능하면 transport/application이 path MTU에 맞는 크기로 보내는 쪽이 유리하다.

### 5.4 IP Forwarding

`IP forwarding`은 목적지 IP address를 보고 datagram의 다음 이동 지점을 결정하는 과정이다. host 입장에서는 대체로 단순하다. 목적지가 같은 link 또는 직접 연결된 network에 있으면 목적지 host로 직접 보낸다. 그렇지 않으면 `default router`로 보내고, 이후의 전달은 router들이 맡는다.

IP에서 host와 router를 가르는 기준은 장비 이름이 아니라 동작이다.

- host: 자신이 생성했거나 자신에게 온 datagram만 처리하고, 남의 datagram을 forwarding하지 않는다.
- router: 자기 주소가 목적지가 아닌 datagram도 forwarding table에 따라 다음 hop으로 보낸다.

IP layer는 datagram을 두 경로에서 받을 수 있다. 하나는 같은 machine의 TCP, UDP 같은 상위 protocol이고, 다른 하나는 network interface다. interface에서 들어온 datagram의 destination IP가 local interface address, broadcast, multicast 등 자신이 받아야 하는 주소이면 `Protocol` 또는 `Next Header`가 가리키는 protocol module로 넘긴다. 아니라면 router로 설정된 경우 forwarding하고, router가 아니면 조용히 버린다. 상황에 따라 ICMP error가 송신자에게 돌아갈 수 있다.

### 5.4.1 Forwarding Table

IP standard는 forwarding table의 정확한 내부 자료구조를 강제하지 않는다. 하지만 개념적으로는 다음 field들이 필요하다.

| Field | 의미 |
|---|---|
| Destination | match 대상 network 또는 host destination |
| Mask | destination IP address에 bitwise AND를 적용할 prefix mask |
| Next-hop | datagram을 다음에 넘길 router 또는 host의 IP address |
| Interface | next hop으로 내보낼 local network interface |

forwarding은 `hop-by-hop`이다. 각 router가 전체 end-to-end path를 알고 있는 것이 아니라, 자기 table에서 "다음 hop"만 결정한다. 이 전제가 성립하려면 next hop이 실제로 destination에 더 가까워야 하고, next-hop 관계들이 loop를 만들지 않아야 한다. 이런 forwarding table의 correctness는 RIP, OSPF, BGP, IS-IS 같은 routing protocol이 관리한다.

### 5.4.2 IP Forwarding Actions

datagram의 destination IP address를 `D`라고 하면, forwarding lookup은 `longest prefix match`로 이해하면 된다.

| 단계 | 동작 |
|---|---|
| 1 | forwarding table의 각 entry에 대해 `D & mask` 결과가 entry의 Destination과 같은지 본다. |
| 2 | match된 entry들 중 mask의 1 bit가 가장 많은 entry를 고른다. |
| 3 | 선택된 entry의 Next-hop과 Interface로 datagram을 보낸다. |
| 4 | match가 없으면 undeliverable로 처리한다. local host가 만든 datagram이면 application에 host unreachable 성격의 오류가 돌아가고, router라면 보통 ICMP error를 보낸다. |

여러 entry가 같은 길이로 match될 수도 있다. 예를 들어 multihoming으로 default route가 둘 이상이면 운영체제 구현에 따라 첫 번째 match를 쓰거나, load balancing을 하거나, traffic을 나눌 수 있다. 표준은 이 tie-breaking을 고정하지 않는다.

### 5.4.3 Examples

IP delivery는 크게 `direct delivery`와 `indirect delivery`로 나뉜다. 둘의 차이는 IP datagram의 source/destination이 아니라 link-layer frame의 destination이 누구인지에서 드러난다.

![Figure 5-16](@/assets/images/cs-tcp-ip-illustrated-071-figure-5-16-page-250.png)
*Figure 5-16 · PDF p. 250 · direct delivery와 indirect delivery에서 IP header와 link-layer header의 차이*

### 5.4.3.1 Direct Delivery

`direct delivery`는 목적지가 같은 network prefix 또는 같은 shared network에 있어 router 없이 바로 전달하는 경우다. 송신 host의 forwarding table에는 보통 local prefix entry와 default route가 함께 있고, 목적지 D가 local prefix entry와 더 길게 match되면 local interface로 직접 보낸다.

이때 IP destination address는 최종 목적지 D의 IP address이고, link-layer destination address도 최종 목적지 D의 MAC address다. 송신자가 D의 MAC address를 모르면 IPv4에서는 ARP, IPv6에서는 Neighbor Solicitation을 사용해 lower-layer address를 알아낸다. Ethernet switch는 IP address를 보지 않고 link-layer destination address만 보고 frame을 전달한다.

### 5.4.3.2 Indirect Delivery

`indirect delivery`는 목적지가 local link 밖에 있어 router를 거치는 경우다. 송신 host는 forwarding table에서 local prefix match를 찾지 못하면 default route를 사용하고, datagram을 default router의 link-layer address로 보낸다.

여기서 가장 자주 헷갈리는 점은 header의 주소가 계층마다 다르다는 것이다.

| 구분 | Source | Destination | hop마다 바뀌는가 |
|---|---|---|---|
| IP header | 원래 송신 host IP | 최종 목적지 host IP | 일반 forwarding에서는 바뀌지 않음 |
| Link-layer header | 현재 link의 송신 interface 주소 | next-hop의 link-layer 주소 | 각 hop마다 바뀜 |

NAT, source routing 같은 특수 기능이 없으면 Internet을 지나는 동안 IP source/destination은 그대로 유지된다. 반면 Ethernet 같은 link-layer header는 매 link마다 새로 만들어진다. S에서 R1으로 보낼 때 link-layer destination은 R1의 MAC address이고, R1에서 R2로 보낼 때는 R2의 next-hop link-layer address가 된다.

IPv6 forwarding도 큰 원리는 IPv4와 같다. 차이는 next-hop lower-layer address를 ARP가 아니라 ICMPv6 Neighbor Discovery/Neighbor Solicitation으로 알아낸다는 점, 그리고 link-local address(`fe80::/10`)는 같은 link 안에서만 의미가 있어 multihomed host에서는 interface scope ID가 필요할 수 있다는 점이다.

`traceroute`는 forwarding path를 관찰하는 도구다. 전통적으로 TTL을 1부터 증가시키며 UDP datagram을 보내고, 각 hop에서 TTL이 만료될 때 돌아오는 ICMP message를 이용해 경로를 추정한다. 원문 예시에서는 MPLS label도 보이는데, 이는 Internet path 중간에 IP 위/아래에서 traffic engineering을 위해 Multiprotocol Label Switching(MPLS)이 쓰일 수 있음을 보여준다.

### 5.4.4 Discussion

IP unicast forwarding에서 특히 중요한 요점은 세 가지다.

1. 대부분의 host와 edge router는 local network를 제외한 목적지에 대해 `default route` 하나로 충분하다. default route는 mask 0, destination 0으로 모든 destination에 match된다.
2. 일반 Internet forwarding에서 IP source/destination address는 바뀌지 않는다. 예외는 source routing, NAT 같은 기능이다.
3. link-layer header는 hop마다 바뀐다. lower-layer destination address는 항상 "최종 목적지"가 아니라 "현재 link에서의 next hop"이다.

이 구간은 Chapter 4 ARP와 Chapter 8 ICMPv6 Neighbor Discovery로 직접 이어진다. IP forwarding은 next-hop IP를 고르는 과정이고, ARP/Neighbor Discovery는 그 next-hop IP를 실제 link-layer address로 바꾸는 과정이다.

### 5.5 Mobile IP

일반 IP forwarding은 host의 IP address가 그 host가 붙어 있는 network prefix와 맞는다고 가정한다. host가 다른 network로 이동하면 IP address를 바꾸거나, 기존 address로 오는 packet이 더 이상 도착하지 않는다. 그러면 TCP connection 같은 상위 계층 연결은 끊긴다. `Mobile IP`는 host가 network attachment point를 바꾸더라도 상위 계층에는 같은 IP identity를 유지하는 것처럼 보이게 하려는 기술이다.

Mobile IP에는 IPv4용 `MIPv4`와 IPv6용 `MIPv6`가 있지만, 이 장은 Mobile IPv6 중심으로 설명한다. 핵심 아이디어는 mobile node가 `home network`의 안정적인 주소를 유지하면서, visited network에서는 임시 위치 주소를 추가로 받는 것이다.

### 5.5.1 The Basic Model: Bidirectional Tunneling

MIPv6의 주요 용어는 다음과 같다.

| 용어 | 약어 | 의미 |
|---|---|---|
| Mobile Node | MN | 이동할 수 있는 host |
| Correspondent Node | CN | MN과 통신하는 상대 host |
| Home Agent | HA | MN의 home network에서 MN을 대신해 routing을 도와주는 router |
| Home Address | HoA | MN이 home network에서 쓰는 안정적인 IP address |
| Care-of Address | CoA | MN이 visited network에서 받은 현재 위치의 IP address |
| Binding | - | MN의 HoA와 현재 CoA의 대응 관계 |

![Figure 5-17](@/assets/images/cs-tcp-ip-illustrated-072-figure-5-17-page-256.png)
*Figure 5-17 · PDF p. 256 · Mobile IP의 MN, CN, HA, HoA, CoA 관계*

기본 모델에서는 MN이 visited network에 붙으면 CoA를 받고, 자신의 HA에 `binding update`를 보낸다. HA는 `binding acknowledgment`로 응답한다. 이후 CN과 MN 사이의 traffic은 HA를 통해 양방향 IPv6 tunneling으로 전달된다. 이 방식을 `bidirectional tunneling`이라고 한다.

HA와 MN 사이의 binding update는 보안상 매우 민감하다. 공격자가 가짜 binding update를 보내 HA를 속이면 특정 MN 앞으로 가야 할 traffic을 다른 곳으로 빼돌릴 수 있다. 그래서 MN-HA signaling은 보통 IPsec ESP로 보호된다.

bidirectional tunneling의 장점은 CN이 MIPv6를 몰라도 된다는 점이다. 단점은 routing이 비효율적일 수 있다는 점이다. MN과 CN이 물리적으로 가까워도 HA가 멀리 있으면, traffic이 굳이 home network를 거쳐 우회한다.

### 5.5.2 Route Optimization (RO)

`Route Optimization(RO)`은 MN과 CN이 HA를 거치지 않고 직접 통신하도록 binding을 설정하는 절차다. RO는 두 부분으로 나뉜다.

- correspondent registration: MN이 CN에게 자신의 현재 CoA를 알려 binding을 만든다.
- optimized data exchange: binding이 성립한 뒤 MN과 CN이 직접 datagram을 주고받는다.

RO에서 어려운 점은 보안이다. CN은 "이 binding update를 보낸 node가 정말 해당 HoA의 MN인가?"를 확인해야 한다. MN-CN 사이에 언제나 IPsec을 쓸 수 있다고 가정하기 어렵기 때문에, MIPv6는 `Return Routability Procedure(RRP)`를 사용한다.

![Figure 5-18](@/assets/images/cs-tcp-ip-illustrated-073-figure-5-18-page-257.png)
*Figure 5-18 · PDF p. 257 · Return Routability Procedure에서 HoA/CoA 양쪽 reachability 확인*

RRP는 MN이 home address와 care-of address 양쪽에서 reachable함을 CN에게 보이는 절차다.

| Message | 경로 | 확인하는 것 |
|---|---|---|
| Home Test Init(HoTI) | MN -> HA -> CN | MN이 HoA 경로로 reachable한지 |
| Home Test(HoT) | CN -> HA -> MN | HoA 경로에 대한 token 전달 |
| Care-of Test Init(CoTI) | MN -> CN | MN이 CoA 경로로 reachable한지 |
| Care-of Test(CoT) | CN -> MN | CoA 경로에 대한 token 전달 |

MN은 HoT와 CoT에 들어 있는 token으로 binding update에 사용할 key를 만든다. 이 방식은 IPsec만큼 강하지는 않지만, 모든 CN과 사전 보안 관계를 맺기 어려운 현실에서 RO의 기본 보안 요구를 만족시키기 위한 절충이다.

binding이 성공하면 data는 HA를 거치지 않고 직접 흐른다. 이때 방향별로 쓰는 IPv6 header 장치가 다르다.

![Figure 5-19](@/assets/images/cs-tcp-ip-illustrated-074-figure-5-19-page-258.png)
*Figure 5-19 · PDF p. 258 · RO 이후 MN-CN 직접 통신에서 Home Address option과 RH2 사용*

- MN -> CN: IPv6 Source IP Address는 MN의 CoA로 둔다. 그래야 ingress filtering이 "source prefix가 이상하다"며 버리지 않는다. MN의 HoA는 `Home Address Destination option`에 담아 CN에게 전달한다.
- CN -> MN: IPv6 Destination IP Address는 MN의 CoA로 둔다. 동시에 `type 2 Routing header(RH2)`에 MN의 HoA를 넣어, MN의 protocol stack이 상위 계층에는 HoA로 통신하는 것처럼 보이게 한다.

결과적으로 router들은 CoA 기준으로 packet을 전달하고, end host의 transport/application 계층은 HoA 기준 연결을 유지한다고 느낀다. 이 "routing용 주소"와 "상위 계층 identity용 주소"의 분리가 Mobile IP의 핵심이다.

### 5.5.3 Discussion

Mobile IP가 해결하려는 mobility는 "link layer 연결은 유지되거나 빠르게 바뀌지만 IP attachment point가 바뀌는" 상황이다. 노트북처럼 이동 중 sleep/shutdown되는 장치보다, VoIP 같은 실시간 애플리케이션을 실행하는 smartphone 모델에서 더 잘 맞는다.

실제 배포에서는 binding update 지연을 줄이는 것이 중요하다. 원문은 fast handovers, `Hierarchical MIPv6(HMIPv6)`, `proxy MIPv6(PMIPv6)` 같은 접근을 언급한다. 이들은 세부 표준 암기보다 "이동 중 signaling latency를 줄이려는 변형들"로 이해하면 충분하다.

### 5.6 Host Processing of IP Datagrams

router는 forwarding할 때 보통 packet의 Source IP Address와 Destination IP Address를 새로 고르지 않는다. 반면 host는 송신 시 어떤 source address를 쓸지, 수신 시 어떤 interface로 들어온 packet을 local delivery로 받아들일지 결정해야 한다. 이 문제는 host가 여러 interface와 여러 address를 가진 `multihomed host`, IPv4/IPv6를 동시에 지원하는 `dual-stack host`, IPv6의 여러 scope address를 함께 쓰는 환경에서 중요해진다.

### 5.6.1 Host Models

수신 datagram의 Destination IP Address가 host의 local address 중 하나와 match된다고 해서 항상 local protocol stack에 넘겨야 하는 것은 아니다. 어떤 interface로 들어왔는지를 함께 볼지 여부가 `host model`의 차이다.

| Host model | 수신 동작 | 송신 동작 | 장단점 |
|---|---|---|---|
| Strong host model | datagram이 들어온 interface에 설정된 destination address와 match될 때만 수신 | 해당 interface의 address를 Source IP Address로 쓸 때만 그 interface로 송신 | 보안에 유리하지만 multihomed routing이 덜 유연 |
| Weak host model | destination이 local address 중 하나면 어느 interface로 들어와도 수신 | source address가 다른 interface에 속해도 송신 가능 | 유연하지만 spoofing/access control 위험 증가 |

![Figure 5-20](@/assets/images/cs-tcp-ip-illustrated-075-figure-5-20-page-260.png)
*Figure 5-20 · PDF p. 260 · multihomed host에서 host model과 address 선택이 문제가 되는 상황*

Figure 5-20처럼 Host A와 Host B가 Internet과 local network 양쪽으로 연결되어 있으면 문제가 생긴다. Host B가 local network로 Host A의 192.0.2.1 주소에 packet을 보내는 것이 빠르거나 저렴하다고 판단할 수 있다. 그런데 Host A가 strong host model이면, 192.0.2.1이 설정된 interface가 아닌 다른 interface로 들어온 packet은 버릴 수 있다.

strong host model을 쓰는 이유는 보안이다. Internet의 공격자가 spoofed source IP address를 가진 packet을 주입했을 때, weak host model은 "source가 local host처럼 보이는 packet"을 다른 interface에서 받아들여 application access control을 속일 여지를 만든다. strong host model은 address와 interface의 결합을 엄격히 지켜 이런 위험을 줄인다.

운영체제별 기본값은 다를 수 있다. 원문 기준으로 Windows Vista 이후는 IPv4/IPv6 모두 strong host behavior가 기본이고, Linux는 weak host model이 기본이며, BSD 계열과 Mac OS X는 strong host model을 사용한다고 설명한다. 중요한 것은 특정 명령 암기가 아니라, multihomed host에서 수신/송신 interface와 address의 결합 정책이 packet acceptance와 보안에 영향을 준다는 점이다.

### 5.6.2 Address Selection

host가 datagram을 보낼 때는 source address와 destination address를 골라야 한다. 예전에는 host가 외부 통신용 IP address를 하나만 갖는 경우가 많아 단순했지만, 현대 host는 다음 이유로 선택 문제가 복잡하다.

- 하나의 interface에 여러 IPv6 address가 있을 수 있다.
- IPv6 address에는 link-local, unique local, global 등 scope가 있다.
- host와 server가 모두 IPv4/IPv6를 지원하는 dual-stack일 수 있다.
- DNS name 하나가 여러 address를 반환할 수 있다.
- source/destination pair가 잘못 선택되면 asymmetric routing, filtering, packet discard가 생길 수 있다.

IPv6의 기본 address selection은 개념적으로 host 안의 policy table을 사용한다. 이 table은 forwarding table처럼 longest-matching-prefix lookup 성격을 가지며, address A에 대해 precedence `P(A)`와 label `L(A)`를 돌려준다. precedence가 높을수록 선호되고, label은 비슷한 address type끼리 source/destination pair를 맞추기 위해 사용된다.

정리하면 address selection이 선호하는 방향은 다음과 같다.

| 기준 | 의미 |
|---|---|
| matching scope | source와 destination의 scope가 맞는 pair 선호 |
| smaller scope | 가능하면 불필요하게 큰 scope를 쓰지 않음 |
| non-deprecated address | deprecated address보다 preferred address 선호 |
| matching label | policy table label이 맞는 source/destination pair 선호 |
| higher precedence | policy table에서 더 높은 precedence를 가진 destination 선호 |
| longest common prefix | 여러 후보가 있으면 prefix가 더 많이 같은 pair 선호 |
| non-temporary address | 기본 규칙에서는 temporary address보다 stable address 선호 |

### 5.6.2.1 The Source Address Selection Algorithm

source address selection은 destination `D`에 대해 가능한 source address 후보 집합 `CS(D)`를 만들고, pairwise ranking으로 가장 적합한 source를 고른다. anycast, multicast, unspecified address는 source 후보가 될 수 없다.

원문의 세부 rule은 많지만, 흐름은 다음 순서로 이해하면 된다.

1. destination과 같은 address가 source 후보라면 우선한다.
2. destination scope에 맞는 적절한 source scope를 고른다.
3. deprecated address를 피한다.
4. Mobile IP 맥락에서는 home address를 선호한다.
5. forwarding lookup이 선택한 outgoing interface에 붙은 address를 선호한다.
6. destination과 label이 맞는 source를 선호한다.
7. temporary address보다 nontemporary address를 선호한다.
8. destination과 longest matching prefix가 더 긴 source를 선호한다.

선택된 source address를 원문은 `Q(D)`로 표기한다. 만약 `Q(D)`가 없으면 해당 destination으로 보낼 수 있는 source address를 결정하지 못한 것이다.

### 5.6.2.2 The Destination Address Selection Algorithm

destination address selection은 DNS 등으로 얻은 여러 destination 후보 중 어느 주소로 연결을 시도할지 고른다. 이때 각 destination 후보에 대해 source selection 결과 `Q(D)`도 함께 고려한다. 사용할 source가 없거나 unreachable인 destination은 피한다.

destination selection의 중요한 선호 기준은 다음과 같다.

- unusable destination을 피한다.
- 선택된 source address와 destination address의 scope가 맞는 쪽을 선호한다.
- deprecated source를 쓰게 되는 destination을 피한다.
- Mobile IP에서는 home address 관련 규칙을 적용한다.
- source/destination label이 맞는 쪽을 선호한다.
- policy table precedence가 높은 destination을 선호한다.
- tunneled routing 같은 encapsulating transport보다 native transport를 선호한다.
- 더 작은 scope, 더 긴 common prefix를 선호한다.

이 algorithm은 완벽한 해답이라기보다 기본 정책이다. DNS round-robin, Unique Local IPv6 Unicast Addresses(ULAs), site-specific policy 같은 현실 문제 때문에 운영체제와 배포 환경에 따라 조정이 필요할 수 있다.

### 5.7 Attacks Involving IP

IP 관련 공격은 대체로 세 갈래에서 나온다.

| 공격 표면 | 핵심 아이디어 | 이 장과의 연결 |
|---|---|---|
| malformed header | header length, version number, option field 등을 이상하게 만들어 router/host 구현 버그를 유발 | IPv4/IPv6 header parser |
| fragmentation abuse | tiny fragment, overlapping fragment, reassembly bug 등을 이용 | Fragment header, reassembly |
| IP spoofing/source routing abuse | source IP address를 위조하거나 Routing header/source route로 경로 의미를 왜곡 | source address, Routing header, ingress filtering |

초기 Internet에서는 source IP address 기반 access control이 흔했기 때문에 `IP spoofing`이 특히 위험했다. 공격자가 source address를 local trusted host처럼 위조하면, 서비스가 source IP만 보고 허용하는 구조를 우회할 수 있었다. 여기에 source routing option을 조합하면 원격 attacker가 local host처럼 보이게 하는 공격도 가능했다.

완화책 중 하나가 `ingress filtering`이다. ISP나 edge network가 고객 traffic의 source address가 실제 할당된 prefix에서 나온 것인지 검사해, 말이 안 되는 source address를 가진 datagram을 Internet으로 내보내지 않는 방식이다. spoofing을 완전히 없애지는 못하지만 피해 범위를 줄인다.

IPv6는 extension header가 유연한 만큼 공격 표면도 생긴다. RH0 Routing header는 같은 주소를 여러 번 넣어 traffic을 특정 path 사이에서 반복시키는 DoS amplification 문제가 발견되어 deprecated되었다. 그렇다고 모든 IPv6 extension header를 무조건 차단하면 Mobile IPv6 같은 정상 기능도 동작하지 않는다. 따라서 실무적 대응은 "extension header를 모두 금지"가 아니라, Routing header 내용과 허용 policy를 packet-filtering firewall이 이해하도록 구성하는 쪽에 가깝다.

### 5.8 Summary

이 장의 핵심은 IP가 제공하는 것과 제공하지 않는 것을 분명히 나누는 것이다. IP는 best-effort, connectionless datagram delivery를 제공하지만, reliability, ordering, end-to-end data integrity는 상위 계층에 맡긴다. IPv4와 IPv6는 둘 다 이 모델을 공유하지만 header 구조는 크게 다르다. IPv4는 가변 header, options, header checksum, base header 안의 fragmentation field를 갖고, IPv6는 고정 40-byte base header, extension header chain, Hop Limit, Next Header, source-only fragmentation을 사용한다.

IPv6는 주소 길이를 32-bit에서 128-bit로 네 배 늘렸지만, base header 크기는 IPv4 최소 header 20 bytes의 두 배인 40 bytes로 유지했다. 이를 위해 비핵심 field를 제거하거나 extension header로 밀어냈다. IPv4와 IPv6는 `Version` field만 공통이므로 직접 호환되지 않고, interconnection에는 translation 또는 dual-stack 운용이 필요하다.

IP forwarding은 hop-by-hop으로 이뤄진다. forwarding table과 longest prefix match가 next hop을 결정하고, 일반 forwarding에서는 IP source/destination address가 바뀌지 않는다. 바뀌는 것은 각 link마다 새로 붙는 link-layer header와 next-hop link-layer address다.

Mobile IP는 host의 IP identity와 현재 attachment point를 분리한다. HoA는 상위 계층이 보는 안정적 주소이고, CoA는 현재 위치로 routing하기 위한 주소다. 기본 bidirectional tunneling은 HA를 거쳐 동작하므로 단순하지만 비효율적이고, Route Optimization은 RRP와 binding update로 CN과 MN 사이 직접 통신을 가능하게 한다.

host processing에서는 strong host model과 weak host model이 multihomed host의 수신/송신 정책을 바꾼다. strong model은 address-interface 결합을 엄격히 지켜 보안에 유리하고, weak model은 유연하지만 spoofed traffic에 취약할 수 있다. address selection algorithm은 source/destination address 후보 중 scope, label, precedence, deprecated 여부, temporary 여부, longest common prefix 등을 기준으로 실제 통신에 사용할 pair를 고른다.

### 5.9 References

참고문헌 구간은 본문 개념의 근거 RFC와 배경 자료 목록이다. 최종 정리에서 암기할 대상은 개별 reference 전체가 아니라, 개념과 직접 연결되는 RFC 위치다. 예를 들어 IPv4는 `RFC0791`, IPv6 base/extension header는 `RFC2460`, DiffServ/DS Field는 `RFC2474`/`RFC2475`, ECN은 `RFC3168`, RH0 deprecation은 `RFC5095`, Mobile IPv6는 `RFC6275`, ingress filtering은 `RFC2827`/`RFC3704`와 연결된다.

## 연결 관계

- Chapter 2 Internet Address Architecture: IPv4/IPv6 address length, prefix, scope, link-local/global address가 이 장의 forwarding과 address selection 전제가 된다.
- Chapter 3 Link Layer: IP datagram은 link-layer frame에 encapsulation되며, hop마다 link-layer header가 바뀐다.
- Chapter 4 ARP: IPv4 forwarding에서 next-hop IP address를 link-layer address로 바꾸는 과정이 ARP다.
- Chapter 6 DHCP and Autoconfiguration: host가 여러 address를 갖게 되는 이유와 address lifecycle, deprecated/preferred address 개념이 source address selection과 연결된다.
- Chapter 7 Firewalls and NAT: NAT는 일반 forwarding에서 IP source/destination address가 유지된다는 원칙의 대표적 예외다. IP options/extension header filtering도 firewall 정책과 연결된다.
- Chapter 8 ICMPv4/ICMPv6: TTL/Hop Limit 만료, unreachable, Packet Too Big, Neighbor Discovery, traceroute의 ICMP response가 이 장의 forwarding과 직접 연결된다.
- Chapter 10 UDP and IP Fragmentation: IPv4 fragmentation, UDP payload size 선택, reassembly 문제가 더 자세히 이어진다.
- Chapter 13-17 TCP: path MTU, checksum pseudo-header, ECN feedback, Mobile IP가 유지하려는 transport connection의 의미가 TCP와 연결된다.
- Chapter 18 Security: IPsec ESP/AH는 Mobile IP binding update 보호와 IPv6 extension header 중 ESP/AH 이해에 필요하다.

## 오해하기 쉬운 내용

- IP의 `best-effort`는 "아무렇게나 버린다"가 아니라, 전달을 시도하지만 성공을 보장하지 않는다는 뜻이다.
- `connectionless`는 host 사이에 통신 관계가 없다는 뜻이 아니라, router가 datagram flow별 connection state를 유지하지 않는다는 뜻이다.
- IPv4 `Header Checksum`은 payload를 보호하지 않는다. TCP/UDP/ICMP가 별도 checksum을 갖는 이유다.
- IPv6에 checksum이 없다고 오류 검출이 없는 것은 아니다. link layer와 upper-layer checksum에 역할을 맡긴 것이다.
- `Protocol`과 `Next Header`는 단순히 transport protocol만 가리키지 않는다. IPv6에서는 다음 extension header를 가리킬 수도 있다.
- IP forwarding에서 최종 IP destination은 일반적으로 hop마다 바뀌지 않는다. 매 hop마다 바뀌는 것은 link-layer destination address다.
- default route는 "아무 데나 보내기"가 아니라, 더 구체적인 prefix match가 없을 때 선택되는 lowest-specificity route다.
- IPv6 fragmentation은 router가 아니라 sender가 수행한다. router는 path MTU 문제를 ICMPv6로 알리는 쪽에 가깝다.
- Routing header와 source routing은 편리해 보이지만 security/DoS risk가 커서 제한적으로만 다뤄진다.
- strong host model은 불편할 수 있지만 multihomed host의 spoofing 위험을 줄이는 보안적 의미가 있다.
- address selection은 단순히 IPv6를 먼저 쓰거나 IPv4를 먼저 쓰는 문제가 아니라, source/destination pair 전체의 scope, policy, reachability를 함께 고르는 문제다.

## 면접 질문

1. IP가 `best-effort`와 `connectionless`라는 말은 각각 무엇을 의미하며, TCP는 왜 필요한가?
2. IPv4 header와 IPv6 base header의 구조적 차이를 `IHL`, `Header Checksum`, `Next Header`, `extension header` 관점에서 설명하라.
3. IPv4 `Total Length`와 IPv6 `Payload Length`의 차이는 무엇인가?
4. Internet checksum의 송신/수신 검증 절차를 설명하고, IPv6에서 IP header checksum이 제거된 이유를 말하라.
5. DS Field, DSCP, ECN, PHB의 관계를 설명하라.
6. IPv4 options가 현대 Internet에서 잘 쓰이지 않는 이유는 무엇인가?
7. IPv6 extension header chain에서 `Next Header` field는 어떻게 사용되는가?
8. RH0 Routing header가 deprecated된 이유와 RH2가 Mobile IP에서 쓰이는 방식을 비교하라.
9. IPv6 fragmentation이 IPv4 fragmentation과 다른 점을 sender/router 역할 중심으로 설명하라.
10. forwarding table에서 `longest prefix match`는 어떻게 동작하며, default route는 어떤 entry인가?
11. direct delivery와 indirect delivery에서 IP header와 link-layer header의 source/destination이 어떻게 다른가?
12. Mobile IP에서 HoA, CoA, HA, binding, bidirectional tunneling을 설명하라.
13. Route Optimization에서 Return Routability Procedure가 필요한 이유는 무엇인가?
14. strong host model과 weak host model의 차이를 multihomed host 예시로 설명하라.
15. source/destination address selection이 IPv6 dual-stack host에서 왜 필요한가?
16. IP spoofing을 ingress filtering이 어떻게 완화하는가?
