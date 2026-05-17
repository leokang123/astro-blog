---
title: "Transport Protocols"
order: 20
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Transport Protocols"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 20은 transport layer가 upper-layer protocol에게 `end-to-end data transfer service`를 제공하는 방식을 다룬다. Network/internetwork layer는 host-to-host packet delivery를 제공하지만, application이 실제로 원하는 것은 process-to-process communication, reliability, flow control, connection management, congestion 대응이다. 이 장의 핵심 흐름은 `connection-oriented transport protocol mechanisms → TCP → TCP congestion control → UDP`다.

Transport protocol은 크게 `connection-oriented`와 `connectionless(datagram)`로 나뉜다. TCP는 connection-oriented transport protocol이고, UDP는 connectionless transport protocol이다. IP처럼 unreliable한 internetwork service 위에서 reliable connection-oriented transport를 제공하려면, 긴 왕복 지연, variable delay, loss, duplicate, obsolete segment, congestion을 모두 다뤄야 하므로 protocol이 복잡해진다.

## 핵심 개념

| 세부 주제 | 핵심 질문 | 검색용 용어 |
|---|---|---|
| Connection-Oriented Transport Protocol Mechanisms | 신뢰성 있는 end-to-end connection을 위해 어떤 mechanism이 필요한가? | addressing, multiplexing, flow control, credit scheme, connection establishment |
| TCP | TCP가 application에게 어떤 service를 제공하고 header field로 어떻게 구현하는가? | TCP service primitives, TCP header, port, socket, SYN, FIN, ACK |
| TCP Congestion Control | TCP가 RTT/RTO와 window 조절로 congestion을 어떻게 감지하고 완화하는가? | SRTT, RTO, Jacobson, slow start, congestion avoidance, cwnd |
| UDP | UDP가 IP 위에 추가하는 최소 기능은 무엇이고 언제 쓰는가? | User Datagram Protocol, UDP header, checksum, port |

## 세부 정리

### 20.1 Connection-Oriented Transport Protocol Mechanisms

Transport protocol은 application과 network layer 사이에 놓인다. TS user, 예를 들어 `FTP`, `SMTP`, `TELNET` 같은 upper-layer protocol은 transport service를 사용하고, local transport entity는 remote transport entity와 통신한다. Transport layer의 역할은 underlying communication system의 세부를 숨기고 end-to-end data transfer abstraction을 제공하는 것이다.

Transport service는 두 종류다.

| Transport service | 의미 | 대표 |
|---|---|---|
| `Connection-oriented service` | TS users 사이에 logical connection을 establishment, maintenance, termination한다. 보통 reliable service를 암시한다. | TCP |
| `Connectionless/datagram service` | connection setup 없이 datagram 단위로 보낸다. delivery, order, duplicate protection은 보장하지 않는다. | UDP |

원문은 먼저 이상적인 `reliable sequencing network service`를 가정한다. 이 network service는 arbitrary length message를 거의 100% reliability로, 순서대로 destination에 전달한다고 본다. 예로 X.25 interface의 reliable packet-switching network, LAPF를 쓰는 frame relay network, connection-oriented LLC service를 쓰는 IEEE 802.3 LAN이 언급된다. 이런 환경에서는 transport protocol이 single network 안의 end-to-end protocol처럼 동작하므로 상대적으로 단순하다.

Reliable sequencing network service 위에서도 connection-oriented transport는 최소 네 가지 문제를 풀어야 한다.

| Mechanism | 필요성 |
|---|---|
| `Addressing` | 어떤 host의 어떤 TS user/process와 통신할지 지정해야 한다. |
| `Multiplexing` | 여러 TS user가 같은 transport protocol 또는 같은 lower-layer connection을 공유한다. |
| `Flow control` | receiver/user/buffer가 감당할 수 있는 속도 이상으로 sender가 보내지 못하게 한다. |
| `Connection establishment/termination` | logical connection의 시작과 끝에서 state, parameter, resource를 맞춘다. |

#### Addressing: Host, Port, Socket

Transport addressing의 질문은 단순하다. "어느 host의 어느 user/process에게 보낼 것인가?" 이를 위해 target user는 보통 다음 정보로 특정된다.

| Addressing element | 의미 |
|---|---|
| `User identification` | 대상 TS user 또는 process |
| `Transport entity identification` | host 안에 여러 transport entity가 있을 때 어느 transport protocol/entity인지 |
| `Host address` | network 또는 internet에서 대상 host를 식별 |
| `Network number` | 여러 network가 연결된 환경에서 host가 속한 network 식별 |

실제 TCP/IP에서는 보통 `(Host, Port)` 형태로 충분하다. `Host`는 IP address이고, `Port`는 해당 host 안의 특정 TS user/application endpoint를 나타낸다. TCP에서는 `host + port` 조합을 `socket`이라고 부른다. Transport layer는 routing을 직접 하지 않으므로 Host 부분은 network service에 넘기고, Port는 transport header에 넣어 destination transport entity가 demultiplexing에 사용한다.

Initiating TS user가 destination address를 아는 방식은 네 가지다.

| 방식 | 설명 | 예 |
|---|---|---|
| Preconfigured address | TS user가 미리 address를 알고 있다. | 제한된 management process에 주기적으로 접속 |
| `Well-known address` | 표준 service가 고정 port/address를 갖는다. | FTP server, SMTP server |
| Name server | generic/global name을 name server에 질의해 address를 얻는다. | 위치가 바뀔 수 있는 service lookup |
| Request-time spawning | well-known privileged process가 새 process를 생성하고 address를 돌려준다. | remote job-management process가 simulation process 생성 |

#### Multiplexing

Transport layer의 multiplexing은 두 방향에서 나타난다. 위쪽으로는 여러 application/TS user가 같은 transport protocol을 공유한다. 이때 port number 또는 `SAP(Service Access Point)`가 demultiplexing key가 된다. 아래쪽으로는 transport entity가 사용하는 network service와의 관계에서 multiplexing을 수행할 수 있다.

| 형태 | 의미 | 왜 쓰는가 |
|---|---|---|
| `Upward multiplexing` | 여러 transport connections를 하나의 lower-level connection 위에 올린다. | lower-level connection 비용이나 resource 사용을 줄인다. X.25 virtual circuit connect time 비용 예 |
| `Downward multiplexing` | 하나의 transport connection을 여러 lower-level connections로 나눈다. | throughput을 높이거나 sequence number space 제약을 완화한다. |

Downward multiplexing은 무한히 성능을 늘려주지 않는다. 모든 virtual circuit이 결국 하나의 host-node link 위에서 multiplexing된다면, transport connection throughput은 그 link data rate를 넘을 수 없다.

#### Flow Control: 왜 Transport Layer에서는 더 어려운가

Link layer flow control보다 transport layer flow control이 어려운 이유는 두 가지다.

| 이유 | 영향 |
|---|---|
| Long transmission delay | flow control 정보가 sender에게 도착하기까지 시간이 길다. |
| Highly variable delay | timeout 기반 retransmission과 receiver 상태 추정이 어려워진다. |

Receiver가 sender rate를 제한해야 하는 직접 이유도 두 가지다.

| 병목 | 설명 |
|---|---|
| Receiving TS user | application/user process가 data를 소비하는 속도가 느리다. |
| Receiving transport entity | transport entity 자체가 segment processing을 따라가지 못한다. |

둘 중 어느 쪽이든 receiving buffer가 차오른다. Transport entity는 buffer overflow를 막기 위해 sender를 늦춰야 하지만, sender와 receiver 사이에는 propagation delay가 있으므로 "지금 멈춰"라는 signal이 도착했을 때 이미 많은 segment가 flight 중일 수 있다.

원문은 reliable network service 위의 flow control 대안 네 가지를 비교한다.

| 대안 | 동작 | 한계 |
|---|---|---|
| Do nothing | overflow segment를 discard하고 sender retransmission에 맡긴다. | reliable network의 장점을 버리고 retransmission으로 load를 악화한다. |
| Refuse further segments | receiving transport entity가 network service에서 더 받지 않아 backpressure를 걸게 한다. | coarse-grained이고, 여러 transport connection이 하나의 virtual circuit을 공유하면 aggregate 단위로만 제어된다. |
| Fixed sliding window | sequence number, fixed-size window, ACK로 window를 전진시킨다. | reliable network에서는 가능하지만, unreliable network에서는 ACK 지연이 loss인지 flow control인지 구분하기 어렵다. |
| `Credit scheme` | ACK와 새 전송 허가량(window credit)을 분리한다. | receiver가 더 세밀히 제어할 수 있고 TCP 방식과 연결된다. |

#### TCP Credit Scheme

TCP식 credit scheme의 핵심은 `acknowledgment`와 `flow control permission`을 분리하는 것이다. X.25나 HDLC의 fixed sliding-window에서는 ACK가 곧 window advancement지만, credit scheme에서는 data를 ACK하면서 새 credit을 주지 않을 수도 있고, 반대로 이미 ACK된 위치 기준으로 새 credit만 갱신할 수도 있다.

Credit scheme에서는 data octet마다 sequence number가 붙는다. Segment header에는 flow control과 관련해 세 값이 있다.

| Field | 의미 |
|---|---|
| `SN(Sequence Number)` | 이 segment data field의 첫 octet sequence number |
| `AN(Acknowledgment Number)` | 다음에 기대하는 octet number. `AN = i`이면 `SN = i - 1`까지 ACK |
| `W(Window)` | `AN`부터 허용하는 추가 data octets 수. `W = j`이면 `i`부터 `i + j - 1`까지 전송 허가 |

```text
Receiver sends: AN = i, W = j

Meaning:
  acknowledged octets: ... through i - 1
  next expected octet: i
  permitted send range: i ... i + j - 1
```

![Figure 20.1](@/assets/images/data-communication-265-figure-20-1-page-680.png)
*Figure 20.1 · PDF p. 680 · TCP credit allocation에서 ACK와 window credit이 함께 조정되는 예*

Figure 20.1은 A가 B에게 200-octet segment를 보내고, B가 cumulative ACK와 credit을 갱신하는 과정을 보여준다. 처음 A는 1001부터 2400까지 1400 octets의 credit을 받는다. A가 세 segment, 즉 600 octets를 보내면 자기 transmit window의 trailing edge가 전진한다. 이후 B가 `AN = 1601, W = 1000`을 보내면 1600까지 받았고 1601-2600까지 허용한다는 뜻이다. 하지만 이 message가 A에 도착하기 전에 A가 이미 일부 segment를 보냈을 수 있으므로, 도착 시점의 remaining credit은 새 window 전체가 아니라 이미 사용한 credit을 뺀 값이 된다.

![Figure 20.2](@/assets/images/data-communication-266-figure-20-2-page-681.png)
*Figure 20.2 · PDF p. 681 · sender와 receiver 관점의 send/receive sequence space와 window 이동*

Figure 20.2는 같은 credit scheme을 sender/receiver의 sequence space 관점으로 분해한다. Sender는 segment를 보낼 때 trailing edge를 줄이고, receiver credit을 받을 때 leading edge를 확장한다. Receiver는 segment를 받을 때 receive window의 trailing edge가 줄고, credit을 보낼 때 leading edge가 확장된다. 양방향 data exchange에서는 양쪽 TCP entity가 동시에 sender view와 receiver view를 모두 가진다.

Receiver는 credit을 얼마나 줄지 정책을 정해야 한다. 보수적 정책은 실제 available buffer space만큼만 credit을 준다. 이 정책은 안전하지만 long-delay connection에서는 throughput을 제한할 수 있다. 낙관적 정책은 round-trip propagation time 안에 buffer가 비워질 것을 기대하고 미리 credit을 준다. Receiver가 실제로 따라갈 수 있으면 throughput이 좋아지지만, sender가 더 빠르면 segment discard와 retransmission이 필요해 protocol을 복잡하게 만든다.

#### Connection Establishment의 목적

Reliable network service 위에서도 connection establishment와 termination은 필요하다. Establishment의 목적은 세 가지다.

| 목적 | 설명 |
|---|---|
| Peer existence 확인 | 상대 transport entity 또는 TS user가 존재하는지 확인한다. |
| Optional parameter negotiation | maximum segment size, maximum window size, QoS 같은 parameter를 교환/협상한다. |
| Resource allocation | buffer space, connection table entry 같은 transport entity resource를 할당한다. |

![Figure 20.3](@/assets/images/data-communication-267-figure-20-3-page-682.png)
*Figure 20.3 · PDF p. 682 · 단순 connection-oriented transport의 CLOSED, LISTEN, SYN SENT, ESTAB, FIN WAIT 상태 흐름*

Figure 20.3은 가장 단순한 connection state diagram이다. TS user는 connection이 없을 때 `CLOSED`에 있고, passive open을 하면 `LISTEN`, active open으로 SYN을 보내면 `SYN SENT`가 된다. SYN 교환 후 `ESTAB` 상태에서 data transfer가 가능하고, close/FIN 흐름을 거쳐 다시 `CLOSED`로 돌아온다. 이 단순 모델은 이후 unreliable network service와 obsolete segment 문제를 다룰 때 TCP state diagram으로 확장된다.

#### Reliable Service 위의 Establishment/Termination

단순 connection establishment에서는 server 쪽 TS user가 `Passive Open`으로 기다리고, client 쪽 TS user가 `Active Open`으로 SYN을 보낸다. Destination transport entity가 해당 port에서 `LISTEN` 상태이면, 다음 동작으로 connection이 열린다.

1. local TS user에게 connection open을 알린다.
2. remote transport entity에게 confirmation으로 SYN을 보낸다.
3. connection object를 `ESTAB` 상태로 둔다.

![Figure 20.4](@/assets/images/data-communication-268-figure-20-4-page-683.png)
*Figure 20.4 · PDF p. 683 · active/passive open과 active/active open에서 SYN이 connection request와 acknowledgment를 겸하는 모습*

Figure 20.4의 중요한 점은 SYN이 connection request이면서 동시에 connection acknowledgment로도 동작한다는 것이다. 그래서 한쪽이 passive open, 다른 쪽이 active open인 일반 경우뿐 아니라 양쪽이 거의 동시에 active open을 하는 경우도 혼동 없이 establishment가 가능하다.

만약 SYN이 왔는데 destination TS user가 idle이고 listen하지 않는다면 transport entity는 세 가지 중 하나를 선택할 수 있다.

| 선택 | 설명 |
|---|---|
| `RST(reset)` 전송 | 요청을 거부한다고 즉시 알린다. |
| Queue request | local TS user가 matching open을 할 때까지 보류한다. |
| Signal local user | local TS user에게 pending request를 interrupt 또는 notification으로 알린다. |

Connection termination도 mutual agreement가 필요하다. Abrupt termination은 transit 중인 data를 잃을 수 있고, graceful termination은 양쪽이 outstanding data를 모두 전달받은 뒤 닫도록 한다. FIN을 먼저 보낸 쪽은 `FIN WAIT` 상태에서도 상대가 보내는 data를 계속 받아야 하고, FIN을 받은 쪽은 `CLOSE WAIT` 상태에서 local user가 남은 data를 보내고 close할 때까지 전송을 계속할 수 있어야 한다.

#### Unreliable Network Service에서 생기는 문제

IP 같은 unreliable network service 위에서는 문제가 더 복잡해진다. Segment가 lost될 뿐 아니라 variable transit delay 때문에 out of order로 도착할 수 있다. 원문은 이 지점에서 "각 문제의 solution이 새로운 문제를 만든다"는 패턴을 강조한다. TCP 같은 reliable connection-oriented transport protocol이 특히 어려운 이유다.

Unreliable network service 위에서 transport protocol은 다음 이슈를 다뤄야 한다.

| Issue | 핵심 |
|---|---|
| `Ordered delivery` | segment가 순서와 다르게 도착할 수 있으므로 sequence numbering이 필요하다. |
| `Retransmission strategy` | damaged/lost segment를 sender가 timeout으로 감지하고 다시 보낸다. |
| `Duplicate detection` | lost ACK 때문에 retransmitted duplicate가 생길 수 있다. |
| `Flow control` | ACK/CREDIT loss나 window close deadlock을 피해야 한다. |
| `Connection establishment` | lost/delayed SYN, duplicate SYN, obsolete SYN을 처리해야 한다. |
| `Connection termination` | FIN misordering/loss/obsolete segment를 처리해야 한다. |
| `Failure recovery` | transport entity crash/restart로 half-open connection이 생긴다. |

TCP는 segment 단위가 아니라 data octet 단위로 sequence number를 붙인다. 예를 들어 첫 segment가 `SN = 1`이고 200 octets를 담으면, 다음 segment는 `SN = 201`이다. 이 방식은 variable-length segment에서도 byte stream 순서를 정확히 표현할 수 있다.

#### Retransmission Strategy와 Timer

Segment가 손상되어 checksum error로 discard되거나, 아예 도착하지 않으면 sender는 실패를 직접 알 수 없다. 그래서 TCP 계열 transport는 `positive acknowledgment`와 `retransmission timer`를 사용한다. Receiver는 성공적으로 받은 segment를 ACK하고, sender는 timer가 만료될 때까지 ACK를 받지 못하면 retransmit한다. 효율을 위해 ACK는 segment마다 하나씩 보낼 필요 없이 cumulative ACK를 쓸 수 있다. 예를 들어 `AN = 601`은 `SN = 401` segment와 그 이전 data를 모두 받았다는 뜻이다.

문제는 retransmission timer 값을 정하는 것이다.

| Timer strategy | 문제 |
|---|---|
| Fixed timer | 너무 작으면 unnecessary retransmission으로 capacity를 낭비하고, 너무 크면 loss 대응이 느리다. |
| Adaptive timer | delay sample 평균을 쓰려 해도 delayed ACK, retransmission ambiguity, sudden network change 때문에 완전한 답이 없다. |

Transport protocol은 retransmission timer 외에도 여러 timer를 쓴다.

| Timer | 역할 |
|---|---|
| `Retransmission timer` | ACK되지 않은 segment를 retransmit한다. |
| `2MSL(maximum segment lifetime) timer` | 같은 destination address로 새 connection을 열기 전 obsolete segment가 사라질 시간을 둔다. |
| `Persist timer` | ACK/CREDIT segment 사이 최대 시간을 제한해 zero-window deadlock을 깬다. |
| `Retransmit-SYN timer` | connection open 시도 사이 시간을 정한다. |
| `Keepalive timer` | 오랫동안 segment가 없으면 connection failure를 의심하고 abort한다. |

#### Duplicate Detection과 Sequence Space

Duplicate detection의 첫 경우는 connection이 닫히기 전에 duplicate가 도착하는 상황이다. ACK가 lost되면 sender는 timeout 후 segment를 retransmit한다. Receiver 입장에서는 어떤 copy가 원본이고 어떤 copy가 duplicate인지 항상 명확하지 않다. Retransmitted segment가 original보다 먼저 도착할 수도 있기 때문이다.

따라서 두 가지 전술이 필요하다.

| 전술 | 이유 |
|---|---|
| Duplicate도 ACK | sender가 ACK lost를 의심해 재전송했을 수 있으므로 duplicate를 받으면 다시 ACK해야 한다. Sender는 같은 segment에 대한 multiple ACK를 혼동하면 안 된다. |
| 충분히 큰 sequence number space | sequence number가 maximum segment lifetime 안에 wrap around되면 old segment가 new segment처럼 보일 수 있다. |

![Figure 20.5](@/assets/images/data-communication-269-figure-20-5-page-688.png)
*Figure 20.5 · PDF p. 688 · sequence number wraparound가 old duplicate segment를 새 data로 오인하게 만드는 예*

Figure 20.5는 sequence space가 너무 작으면 어떤 일이 생기는지 보여준다. A가 `SN = 1`을 보냈는데 오래 지연되고, 재전송본이 먼저 처리된다. 이후 sequence number가 wrap around되어 새 connection/data 흐름에서 다시 `SN = 1`이 쓰일 때, 아주 늦게 도착한 old `SN = 1`이 새 segment처럼 받아들여지고 진짜 새 `SN = 1`은 duplicate로 버려질 수 있다. Sequence number field에 bit를 하나 추가하면 sequence space가 두 배가 되므로, maximum segment lifetime과 전송 속도를 고려해 wraparound가 충분히 늦게 발생하도록 해야 한다.

Credit flow control 자체는 unreliable network에서도 비교적 robust하다. `AN = i, W = j`는 `i - 1`까지 ACK하고 `i`부터 `j` octets를 새로 허용한다. Receiver는 추가 data 없이 credit만 늘릴 수도 있고, data를 ACK하면서 새 credit은 주지 않을 수도 있다.

하지만 zero window 상황에서는 deadlock이 가능하다. B가 `AN = i, W = 0`으로 window를 닫은 뒤, 다시 `AN = i, W = j`를 보냈는데 그 segment가 lost되면 A는 보낼 수 없다고 생각하고, B는 이미 허용했다고 생각한다. `Persist timer`는 이 상황을 깨기 위해 존재한다. Timer가 만료되면 entity는 이전 segment와 중복되더라도 segment를 보내 상대에게 자신이 살아 있고 최신 `AN/W`를 다시 알려준다.

#### Two-Way Handshake의 한계

Reliable network에서는 SYN 교환, 즉 two-way handshake로 충분해 보인다. 하지만 unreliable network에서는 lost SYN, lost SYN response, delayed duplicate SYN 때문에 duplicate SYN이 생긴다. Established connection에서는 duplicate SYN을 무시하면 되지만, 더 큰 문제는 old data/SYN이 새 connection lifetime에 끼어드는 경우다.

![Figure 20.6](@/assets/images/data-communication-270-figure-20-6-page-689.png)
*Figure 20.6 · PDF p. 689 · two-way handshake에서 old data segment가 새 connection의 valid data처럼 받아들여지는 문제*

Figure 20.6은 각 new connection이 sequence number를 1부터 다시 시작한다고 가정할 때 생기는 문제다. 이전 connection의 duplicate `SN = 401`이 새 connection 중간에 도착하면 receiver는 이를 새 data로 받아들이고, 나중에 도착한 진짜 새 `SN = 401`을 duplicate로 버릴 수 있다. 한 완화책은 connection마다 initial sequence number를 다르게, 이전 sequence와 충분히 떨어뜨려 시작하는 것이다.

그러나 SYN 자체가 오래 살아남는 경우도 문제가 된다.

![Figure 20.7](@/assets/images/data-communication-271-figure-20-7-page-690.png)
*Figure 20.7 · PDF p. 690 · obsolete SYN 때문에 양쪽이 서로 다른 sequence context로 connection이 성립했다고 착각하는 문제*

Figure 20.7에서는 old `SYN i`가 connection 종료 뒤 B에 도착한다. B는 새 요청으로 오해해 `SYN j`로 응답한다. 그 사이 A는 진짜 새 `SYN k`를 보내지만, B는 중복으로 버린다. 양쪽은 SYN을 주고받았으니 connection이 있다고 생각하지만, data sequence context가 달라 B는 A의 `SN = k + 1` data를 out of sequence로 거부한다.

#### Three-Way Handshake와 TCP State Diagram

이 문제의 해법은 양쪽이 상대의 SYN과 sequence number를 명시적으로 ACK하는 `three-way handshake`다.

```text
1. A -> B: SYN i
2. B -> A: SYN j, AN = i + 1
3. A -> B: ACK, AN = j + 1  (보통 첫 data segment와 함께 가능)
```

![Figure 20.8](@/assets/images/data-communication-272-figure-20-8-page-691.png)
*Figure 20.8 · PDF p. 691 · TCP entity의 SYN RECEIVED, ESTAB, FIN WAIT, TIME WAIT 등을 포함한 상태 전이*

Figure 20.8은 TCP가 단순 state diagram에 `SYN RECEIVED`를 추가하는 이유를 보여준다. 이 상태에서 transport entity는 양쪽 SYN이 모두 ACK되었는지 확인하기 전까지 connection을 established로 선언하지 않는다. 또한 invalid ACK가 connection open 전에 도착하면 `RST(reset)`를 보내 잘못된 connection attempt를 정리한다.

![Figure 20.9](@/assets/images/data-communication-273-figure-20-9-page-692.png)
*Figure 20.9 · PDF p. 692 · 정상 three-way handshake, delayed SYN, delayed SYN/ACK 처리 예*

Figure 20.9의 세 경우를 압축하면 다음과 같다.

| 경우 | 동작 | 의미 |
|---|---|---|
| Normal operation | A가 `SYN i`, B가 `SYN j, AN = i + 1`, A가 `AN = j + 1`로 응답 | 양쪽 initial sequence number가 확인된다. |
| Delayed SYN | old `SYN i`에 B가 응답하지만 A는 요청한 적이 없음을 알고 `RST, AN = j` 전송 | old SYN이 connection을 열지 못한다. |
| Delayed SYN/ACK | old SYN/ACK가 새 establishment 중간에 도착해도 ACK sequence number로 무효임을 판별 | sequence-numbered ACK가 obsolete control segment를 걸러낸다. |

#### Connection Termination과 Failure Recovery

Unreliable network에서는 termination도 단순 FIN 교환으로 부족하다. FIN이 마지막 data보다 먼저 도착하면 receiver가 connection을 닫아 late data를 잃을 수 있다. 그래서 FIN에도 sequence number를 부여한다. FIN은 마지막 data octet 다음 sequence number를 사용하고, receiver는 FIN을 받아도 필요한 late data가 도착할 때까지 기다릴 수 있다.

Graceful close에서 transport entity는 다음 조건을 만족해야 한다.

| 조건 | 의미 |
|---|---|
| Send `FIN i` and receive `AN = i + 1` | 내가 보낸 FIN이 상대에게 ACK되었다. |
| Receive `FIN j` and send `AN = j + 1` | 상대 FIN을 내가 ACK했다. |
| Wait `2MSL` | maximum segment lifetime의 두 배 동안 obsolete segment가 사라지기를 기다린다. |

System failure 후 restart되면 active connection state가 사라져 `half-open connection`이 생긴다. 살아 있는 쪽은 `keepalive timer`가 만료되면 상대 또는 network failure로 보고 abnormal close를 알린다. 실패한 쪽이 빠르게 재시작하면, 자신이 모르는 segment를 받을 때 `RST i`를 보내 half-open 상태를 더 빨리 정리할 수 있다. 단 RST도 old segment에 대한 응답일 수 있으므로 sequence number validity를 확인해야 한다.

Transport-level cleanup이 끝나도 application-level 문제는 남는다. Failure 당시 outstanding segment가 양방향에 있었을 수 있으므로, TS user 수준에서는 data가 loss되었는지 duplicate되었는지 다시 동기화해야 한다.

### 20.2 TCP

`TCP(Transmission Control Protocol)`는 다양한 reliable/unreliable network와 internetwork 위에서 process pair, 즉 TCP users 사이의 reliable communication을 제공하도록 설계된 transport protocol이다. 원문은 TCP를 두 층으로 설명한다. 첫째, TCP user에게 보이는 service interface다. 둘째, 그 service를 구현하기 위한 TCP segment header와 internal protocol mechanisms다.

#### TCP Services: Push와 Urgent

TCP는 byte stream을 제공하지만, application이 stream 안의 특정 의미 지점을 transport에게 알려야 할 때가 있다. 이를 위해 두 가지 labeling facility가 있다.

| Facility | 의미 | 사용 맥락 |
|---|---|---|
| `Data stream push` / `PUSH` | TCP가 충분한 data가 쌓일 때까지 기다리지 말고, push flag가 붙은 지점까지 outstanding data를 segment로 보내고 receiver도 user에게 전달하도록 요구한다. | logical break, interactive response, block boundary |
| `Urgent data signaling` / `URGENT` | 곧 도착할 stream 안에 significant 또는 urgent data가 있음을 destination TCP user에게 알린다. | receiver application이 urgent 상태를 해석해 적절히 처리 |

PUSH는 TCP stream을 record-oriented protocol로 바꾸는 기능이 아니다. TCP는 여전히 octet stream이고, PUSH는 "여기까지의 data를 지체하지 말고 밀어내라"는 전달 힌트다. URGENT도 별도 out-of-band channel로 data를 빼내는 것이 아니라, ordinary data stream 안에서 urgent data의 끝을 urgent pointer로 알려준다.

TCP service는 primitive와 parameter로 정의된다. 주요 request primitive는 다음과 같다.

| Request primitive | 의미 |
|---|---|
| `Unspecified Passive Open` | 어떤 remote destination에서 오든 지정 source port로 connection attempt를 기다린다. |
| `Fully Specified Passive Open` | 특정 destination address/port에서 오는 connection attempt를 기다린다. |
| `Active Open` | 특정 destination에 connection을 요청한다. |
| `Active Open with Data` | connection 요청과 함께 data를 전송한다. |
| `Send` | named connection을 통해 data를 보낸다. PUSH/URGENT flag를 함께 지정할 수 있다. |
| `Allocate` | receive data에 대해 incremental allocation, 즉 receive credit을 제공한다. |
| `Close` | graceful close를 요청한다. |
| `Abort` | abrupt close를 요청한다. |
| `Status` | connection 상태를 조회한다. |

Response primitive는 TCP가 local TCP user에게 알려주는 event다. 예를 들어 `Open Success`, `Open Failure`, `Deliver`, `Closing`, `Terminate`, `Status Response`, `Error`가 있다. TCP는 IP보다 richer service를 제공하기 때문에 primitive와 parameter도 더 복잡하다.

중요한 TCP service parameter는 다음과 같이 묶어 이해하면 된다.

| Parameter group | 예 | 의미 |
|---|---|---|
| Addressing | source port, destination port, destination address, source address | local/remote TCP user와 host를 식별 |
| Data transfer | data, data length, PUSH flag, URGENT flag | byte stream data와 delivery hint |
| Connection control | local connection name, connection state, timeout, timeout-action | connection 식별, 상태 조회, timeout 처리 |
| Flow control | receive window, send window, amount awaiting ACK, amount awaiting receipt | sender/receiver buffer와 outstanding data 상태 |
| Policy/security | precedence, security, security-range | IP precedence/security parameter와 연결 |

`Local Connection Name`은 TCP가 user에게 제공하는 connection identifier이며, 실제 connection은 `(local socket, remote socket)` pair로 정의된다. 여기서 socket은 `(host, port)` 조합이다.

#### TCP Header Format

TCP는 하나의 PDU type, 즉 `TCP segment`만 사용한다. 하나의 header가 connection establishment, data transfer, flow control, error control, termination, urgent/push 기능을 모두 담당하므로 header가 크다. 최소 header length는 20 octets다.

![Figure 20.10](@/assets/images/data-communication-274-figure-20-10-page-697.png)
*Figure 20.10 · PDF p. 697 · TCP segment header의 port, sequence/acknowledgment number, flags, window, checksum 구조*

TCP header field를 기능별로 보면 다음과 같다.

| Field | 크기 | 역할 |
|---|---:|---|
| `Source Port` | 16 bits | source TCP user |
| `Destination Port` | 16 bits | destination TCP user |
| `Sequence Number` | 32 bits | 이 segment data field의 첫 data octet sequence number. SYN이 set이면 ISN |
| `Acknowledgment Number` | 32 bits | receiver가 다음에 기대하는 data octet sequence number |
| `Data Offset` | 4 bits | TCP header 길이, 32-bit words 단위 |
| `Reserved` | 4 bits | future use |
| `Flags` | 6 bits 원문 기준 | CWR, ECE, URG, ACK, PSH, RST, SYN, FIN 기능 표시 |
| `Window` | 16 bits | acknowledgment field가 가리키는 sequence부터 receiver가 받을 수 있는 octets 수 |
| `Checksum` | 16 bits | TCP segment + pseudoheader에 대한 ones-complement checksum |
| `Urgent Pointer` | 16 bits | segment sequence number에 더해 urgent data의 마지막 octet 위치를 표시 |
| `Options + Padding` | variable | maximum segment size 등 optional 기능 |

TCP의 `Sequence Number`와 `Acknowledgment Number`는 segment가 아니라 octet에 묶인다. 예를 들어 `Sequence Number = 1001`인 segment가 600 octets를 담으면, 다음 logical segment는 `Sequence Number = 1601`이다. 이 때문에 TCP는 논리적으로 `stream oriented`다. TCP user가 제공한 octet stream을 TCP가 적절한 segment로 묶고, 각 octet을 numbering한다.

Checksum은 TCP segment뿐 아니라 IP pseudoheader까지 포함한다. Pseudoheader에는 IP header의 source address, destination address, protocol, segment length가 들어간다. 이 설계는 IP가 packet을 잘못된 host로 전달하는 misdelivery까지 TCP가 감지할 수 있게 한다. TCP/IP에서 최소 overhead는 IP header 20 octets + TCP header 20 octets, 즉 data unit마다 최소 40 octets다.

TCP user interface에는 있지만 TCP header에 직접 없는 parameter도 있다. 예를 들어 precedence는 IP header의 `DS(Differentiated Services)` field로 mapping될 수 있고, security parameter는 IP optional security field로 내려갈 수 있다. TCP가 IP와 결합되어 동작한다는 뜻이다.

#### TCP Mechanisms

TCP mechanism은 크게 `connection establishment`, `data transfer`, `connection termination`으로 나눌 수 있다.

Connection establishment는 항상 three-way handshake를 사용한다.

```text
A -> B: SYN, SN = X
B -> A: SYN + ACK, SN = Y, AN = X + 1
A -> B: ACK, AN = Y + 1
```

SYN은 sequence number 하나를 차지한다. 그래서 receiver가 `AN = X + 1`을 보내는 것은 `SN = X`의 SYN을 acknowledge하고, 첫 data octet `X + 1`을 기대한다는 뜻이다. 양쪽이 동시에 SYN을 보내도 서로 SYN/ACK로 응답하면 된다.

TCP connection은 source socket과 destination socket의 pair로 유일하게 결정된다. 따라서 같은 두 port pair 사이에는 동시에 하나의 TCP connection만 존재할 수 있다. 하지만 하나의 local port는 서로 다른 remote socket들과 여러 connection을 가질 수 있다.

Data transfer는 segment 단위로 실제 전송되지만, 논리적으로는 octet stream이다. TCP entity는 transmit buffer와 receive buffer를 가지고, 언제 segment를 만들지와 언제 received data를 user에게 전달할지를 자체 정책으로 정한다. `PUSH`는 지금까지 쌓인 data를 sender가 segment로 내보내고 receiver가 user에게 전달하도록 밀어붙이는 기능이다. `URG`와 urgent pointer는 urgent data block의 끝을 알려 receiver user가 urgent 상황을 인지하게 한다.

Connection termination은 정상적으로 `graceful close`를 사용한다. 각 TCP user가 `CLOSE` primitive를 내고, TCP entity는 마지막 segment에 `FIN` bit를 설정한다. 반대로 `ABORT` primitive는 abrupt termination이다. 이 경우 TCP entity는 send/receive buffer data를 버리고, 상대에게 `RST` segment를 보낸다.

#### TCP Implementation Policy Options

TCP standard는 TCP entity 사이 protocol을 정확히 정의하지만, 구현 정책은 여러 선택지를 허용한다. 선택이 달라도 interoperability는 유지되지만 performance는 달라질 수 있다.

| Policy | 선택지 | Trade-off |
|---|---|---|
| `Send policy` | user data batch마다 segment 생성 또는 충분히 쌓일 때까지 대기 | 작은 segment는 응답성 좋지만 overhead 증가, 큰 segment는 overhead 낮지만 delay 증가 |
| `Deliver policy` | in-order segment마다 즉시 user에게 전달 또는 여러 segment를 buffer 후 전달 | 즉시 전달은 prompt하지만 interrupt/processing overhead 증가 |
| `Accept policy` | `in-order` 또는 `in-window` | in-order는 단순하지만 out-of-order segment를 버려 retransmission 증가, in-window는 buffer tracking이 복잡하지만 retransmission 감소 |
| `Retransmit policy` | `first-only`, `batch`, `individual` | first-only는 traffic 적지만 delay 가능, batch는 delay 줄이나 불필요 retransmission 가능, individual은 정확하지만 구현 복잡 |
| `Acknowledge policy` | `immediate` 또는 `cumulative` | immediate는 sender 정보가 빠르지만 empty ACK overhead 증가, cumulative는 overhead 낮지만 RTT estimation과 receiver processing이 복잡 |

Accept policy와 retransmit policy는 서로 맞물린다. Receiver가 `in-order`만 받아들이면 lost segment 뒤의 out-of-order segment가 버려지므로 batch retransmission이 잘 맞는다. Receiver가 `in-window` segment를 buffer할 수 있으면 first-only나 individual retransmission이 더 효율적이다.

Cumulative ACK는 보통 piggybacking으로 ACK overhead를 줄인다. 하지만 ACK를 너무 오래 지연하면 sender의 retransmission timer와 RTT estimation에 영향을 준다. 그래서 cumulative policy도 무기한 기다리지 않고 timer 만료 시 empty ACK를 보낸다.

### 20.3 TCP Congestion Control

TCP의 credit-based flow control은 원래 destination buffer overflow를 막기 위한 end-to-end flow control mechanism이었다. 하지만 Internet에서는 같은 mechanism이 congestion control에도 사용된다. Congestion이 시작되면 transit time이 증가하고, 심해지면 router나 internet node가 packet을 drop한다. TCP sender는 increased delay와 dropped segments를 관찰해 congestion onset을 추정하고, data flow를 줄인다. 많은 TCP entity가 이런 restraint를 수행하면 전체 internet congestion이 완화된다.

TCP congestion control 기법은 TCP header나 wire protocol을 바꾸는 것이 아니라 TCP specification 안에서 가능한 implementation policy다. 원문은 대표 기법을 크게 두 묶음으로 본다.

| 범주 | 대표 기법 |
|---|---|
| `Retransmission timer management` | RTT variance estimation, exponential RTO backoff, Karn's algorithm |
| `Window management` | slow start, dynamic window sizing on congestion, fast retransmit, fast recovery |

#### Retransmission Timer Management

Static retransmission timer는 network 상태가 바뀌면 너무 길거나 너무 짧아진다. 그래서 TCP 구현은 최근 segment의 delay pattern을 관찰해 current round-trip time을 추정하고, 그보다 약간 큰 값으로 retransmission timeout을 설정한다.

가장 단순한 방식은 observed `RTT(Round-Trip Time)`의 평균을 내는 것이다.

```text
ARTT(K + 1) = (1 / (K + 1)) * Σ RTT(i), i = 1..K+1
```

이 식은 전체 합을 매번 다시 계산하지 않도록 다음 형태로 갱신할 수 있다.

```text
ARTT(K + 1) = (K / (K + 1)) * ARTT(K) + (1 / (K + 1)) * RTT(K + 1)
```

단순 평균의 문제는 모든 past observation이 같은 weight를 받는다는 점이다. Network는 상태가 변하므로 최근 observation이 미래 RTT를 더 잘 예측하는 경우가 많다.

#### Exponential Average와 SRTT

RFC 793은 `exponential averaging`을 사용해 `SRTT(Smoothed Round-Trip Time)`를 계산한다.

```text
SRTT(K + 1) = a * SRTT(K) + (1 - a) * RTT(K + 1)
```

여기서 `0 < a < 1`이다. 이 식을 전개하면 최근 RTT가 `(1 - a)`, 이전 RTT가 `a(1 - a)`, 그 이전 RTT가 `a^2(1 - a)`처럼 점점 작아지는 weight를 받는다. 즉 오래된 observation은 완전히 버리지는 않지만 영향력이 빠르게 줄어든다.

`a` 값의 trade-off는 명확하다.

| a 값 | 반응성 | 안정성 |
|---|---|---|
| 작음, 예: `a = 0.5` | 최근 RTT 변화에 빠르게 반응 | 짧은 surge에도 평균이 흔들려 jerky해질 수 있음 |
| 큼, 예: `a = 0.875` | 변화 반영이 느림 | 더 smooth하고 순간 변동에 덜 민감 |

![Figure 20.11](@/assets/images/data-communication-275-figure-20-11-page-704.png)
*Figure 20.11 · PDF p. 704 · 단순 평균과 exponential averaging이 RTT 증가/감소를 추적하는 차이*

Figure 20.11은 exponential averaging이 simple average보다 RTT 변화를 빠르게 따라가며, `a`가 작을수록 더 빠르게 반응한다는 점을 보여준다. Congestion control 관점에서 이는 중요하다. RTO가 실제 RTT보다 지나치게 작으면 불필요한 retransmission을 만들고, 지나치게 크면 real loss 대응이 느려진다.

RFC 793은 RTO를 SRTT에 비례하게 설정한다.

```text
RTO(K + 1) = MIN(UBOUND, MAX(LBOUND, b * SRTT(K + 1)))
```

`UBOUND`와 `LBOUND`는 timer의 upper/lower bound이고, `b`는 SRTT에 곱하는 상수다. 원문은 example value로 `a = 0.8..0.9`, `b = 1.3..2.0`을 언급한다. 하지만 단순히 SRTT에 상수를 곱하는 방식은 RTT variance가 큰 환경에서 잘 맞지 않는다. 안정적인 환경에서는 RTO가 불필요하게 크고, 불안정한 환경에서는 `b = 2`조차 unnecessary retransmission을 막기에 부족할 수 있다.

#### Jacobson's Algorithm: RTT Variance Estimation

RTT variance가 큰 이유는 여러 가지다.

| 원인 | 설명 |
|---|---|
| Low data rate connection | transmission delay가 propagation time에 비해 커지고, IP datagram size 차이가 RTT variation을 크게 만든다. |
| Abrupt traffic/load changes | 다른 traffic source 때문에 Internet condition이 갑자기 변한다. |
| Delayed/cumulative ACK | peer TCP가 processing delay나 cumulative ACK 정책 때문에 즉시 ACK하지 않는다. |

Jacobson's algorithm은 RTT 평균뿐 아니라 RTT variability, 즉 mean deviation까지 추정해 RTO에 반영한다. 원문은 다음 형태로 제시한다.

```text
SRTT(K + 1) = (1 - g) * SRTT(K) + g * RTT(K + 1)
SERR(K + 1) = RTT(K + 1) - SRTT(K)
SDEV(K + 1) = (1 - h) * SDEV(K) + h * |SERR(K + 1)|
RTO(K + 1)  = SRTT(K + 1) + f * SDEV(K + 1)
```

처음 RFC 793 방식은 `b * SRTT`처럼 평균에 상수를 곱했다. Jacobson 방식은 평균에다가 estimated mean deviation의 배수를 더한다. 즉 "평균 RTT가 얼마인가"뿐 아니라 "RTT가 얼마나 흔들리는가"를 반영한다.

원문이 제시한 constant는 다음과 같다.

| Constant | 값 | 의미 |
|---|---:|---|
| `g` | `1/8 = 0.125` | SRTT에 새 RTT sample을 반영하는 비율 |
| `h` | `1/4 = 0.25` | SDEV에 새 error magnitude를 반영하는 비율 |
| `f` | 원 논문 `2`, 이후 구현 `4` | RTT variation에 대한 safety margin |

![Figure 20.12](@/assets/images/data-communication-276-figure-20-12-page-707.png)
*Figure 20.12 · PDF p. 707 · Jacobson 방식에서 SDEV와 RTO가 RTT 변화 구간에서는 보수적으로 커지고 안정화되면 수렴하는 모습*

Figure 20.12는 RTT가 변하는 동안 RTO가 보수적으로 유지되고, RTT가 안정되면 SDEV가 줄면서 RTO가 실제 RTT에 가까워지는 모습을 보여준다. 이 방식은 TCP performance를 크게 개선하지만, 단독으로 충분하지 않다. Retransmitted segment의 RTO를 어떻게 처리할지에는 `exponential RTO backoff`가 필요하고, 어떤 RTT sample을 estimator에 넣을지에는 `Karn's algorithm`이 필요하다.

#### Exponential RTO Backoff

Timeout은 보통 packet drop 또는 long delay, 즉 congestion의 신호일 가능성이 크다. 그런데 여러 TCP connection이 같은 congested region을 지나면서 동시에 timeout되고, 같은 RTO로 동시에 retransmit하면 congestion이 유지되거나 더 심해질 수 있다.

그래서 TCP sender는 segment를 retransmit할 때마다 RTO를 증가시키는 `backoff process`를 사용한다.

```text
RTO = q * RTO
```

가장 흔한 값은 `q = 2`이며, 이를 `binary exponential backoff`라고 한다. 첫 retransmission 뒤 더 오래 기다리고, 두 번째 retransmission이 필요하면 더 길게 기다리므로 Internet이 congestion을 해소할 시간을 얻는다. 이 기법은 Ethernet CSMA/CD의 backoff와 같은 사고방식이다.

#### Karn's Algorithm의 문제 배경

Retransmission이 없으면 RTT sample은 단순하다. 어떤 segment를 보낸 시각과 그 ACK를 받은 시각의 차이를 RTT로 쓰면 된다. 그러나 segment가 timeout되어 retransmit된 뒤 ACK가 오면 sender는 그 ACK가 original transmission에 대한 것인지 retransmission에 대한 것인지 구분할 수 없다.

| 해석 | 잘못 측정하면 생기는 문제 |
|---|---|
| ACK가 original transmission에 대한 것 | retransmission 이후부터 재면 RTT가 너무 작게 측정된다. SRTT/RTO가 낮아져 추가 timeout을 유발할 수 있다. |
| ACK가 retransmission에 대한 것 | original transmission부터 재면 RTT가 `actual RTT + RTO`처럼 너무 크게 측정된다. SRTT/RTO가 불필요하게 커진다. |

이 ambiguity 때문에 retransmitted segment의 ACK를 RTT estimator에 그대로 넣으면 SRTT와 RTO가 오염된다. 다음 구간의 Karn's algorithm은 이 ambiguity를 어떤 sample exclusion rule로 피하는지 설명한다.

#### Karn's Algorithm

`Karn's algorithm`은 retransmitted segment의 ACK가 만드는 RTT ambiguity를 다음 규칙으로 피한다.

1. Retransmitted segment에 대해 측정한 RTT는 `SRTT`와 `SDEV` update에 사용하지 않는다.
2. Retransmission이 발생하면 Equation (20.6)의 backoff RTO를 계산한다.
3. Retransmit되지 않은 segment의 ACK가 도착할 때까지, succeeding segments에도 backoff RTO 값을 사용한다.

즉 Karn's algorithm은 "애매한 sample은 estimator에 넣지 말고, congestion 가능성이 있으니 backoff된 RTO로 보수적으로 운전하라"는 정책이다. Retransmission이 없는 segment에 대한 ACK가 도착하면 Jacobson's algorithm을 다시 활성화해 future RTO를 계산한다.

#### Window Management

Retransmission timer가 "언제 다시 보낼 것인가"를 다룬다면, window management는 "얼마나 많이 밀어 넣을 것인가"를 다룬다. TCP send window가 너무 크면 sender는 ACK를 기다리기 전에 많은 segment를 Internet에 쏟아 넣고 congestion을 유발할 수 있다. 원문은 현대 TCP 구현 대부분에 들어간 두 기법으로 `slow start`와 `dynamic window sizing on congestion`을 설명한다.

TCP가 실제로 보낼 수 있는 allowed window는 receiver가 준 credit과 sender의 congestion window 중 작은 값이다.

```text
awnd = MIN[credit, cwnd]
```

| 변수 | 의미 |
|---|---|
| `awnd(allowed window)` | 추가 ACK 없이 현재 보낼 수 있는 segment 수 |
| `credit` | peer TCP가 최근 ACK의 Window field로 허용한 unused receive credit |
| `cwnd(congestion window)` | TCP가 startup 또는 congestion recovery 중 flow를 제한하기 위해 쓰는 sender-side window |

`credit`은 receiver buffer protection을 위한 값이고, `cwnd`는 network congestion protection을 위한 값이다. 둘 중 어느 하나라도 작으면 sender는 그 작은 값에 묶인다. 이 구분이 TCP가 end-to-end flow control과 congestion control을 같은 window mechanism으로 엮는 핵심이다.

#### Slow Start

Connection이 막 열렸을 때 sender가 receiver credit 전체를 한 번에 사용하면, Internet 상태를 모르는 채로 많은 segment를 밀어 넣을 수 있다. `Slow start`는 이 위험을 피하기 위해 처음에는 작게 시작하고, ACK가 돌아오는 것을 보며 window를 키운다.

새 connection에서 TCP는 보통 `cwnd = 1`로 시작한다. 즉 첫 segment 하나를 보내고 ACK를 기다린다. 새 data에 대한 ACK가 도착할 때마다 `cwnd`를 1씩 늘린다. 이름은 slow start지만, 실제 증가는 exponential이다.

```text
Round-trip 0: cwnd = 1  -> send 1 segment
Round-trip 1: cwnd = 2  -> send 2 segments
Round-trip 2: cwnd = 4  -> send 4 segments
Round-trip 3: cwnd = 8  -> send 8 segments
...
```

Slow start는 Internet을 probe한다. ACK가 꾸준히 돌아오면 path가 어느 정도 수용 가능하다고 보고 window를 열고, ACK가 돌아오지 않으면 congestion/loss 신호로 본다.

#### Dynamic Window Sizing on Congestion

Timeout은 congestion이 발생했다는 신호다. 단순히 `cwnd = 1`로 리셋하고 다시 slow start를 수행하는 것만으로는 충분히 보수적이지 않을 수 있다. 한번 congestion이 생기면 network가 회복하는 데 시간이 걸리므로, slow start의 exponential growth가 다시 congestion을 악화할 수 있다.

Jacobson 방식은 timeout 후 다음 규칙을 사용한다.

1. `ssthresh = cwnd / 2`로 설정한다.
2. `cwnd = 1`로 낮추고, `cwnd = ssthresh`가 될 때까지 slow start를 수행한다. 이 구간에서는 ACK마다 `cwnd`가 1씩 증가한다.
3. `cwnd >= ssthresh`부터는 round-trip time당 `cwnd`를 1씩만 증가시킨다. 이것이 `congestion avoidance`의 linear growth다.

![Figure 20.13](@/assets/images/data-communication-277-figure-20-13-page-711.png)
*Figure 20.13 · PDF p. 711 · timeout 이후 slow start와 congestion avoidance가 cwnd를 지수 증가에서 선형 증가로 전환하는 모습*

Figure 20.13은 처음에는 `cwnd`가 1, 2, 4, 8, 16처럼 빠르게 증가하다가 timeout이 발생하면 threshold를 잡고, 다시 1부터 시작해 threshold 이후에는 선형 증가로 바뀌는 모습을 보여준다. 원문은 처음 4 RTT에 도달했던 cwnd 수준을 회복하는 데 timeout 후에는 11 RTT가 걸린다는 점을 강조한다. 이는 congestion 후에는 Internet이 회복할 시간을 주기 위해 더 조심스럽게 증가해야 한다는 뜻이다.

#### Fast Retransmit의 문제의식

RTO는 실제 RTT보다 어느 정도 크게 잡힌다. RTT prediction error, destination delay fluctuation, cumulative ACK 정책 때문에 safety margin이 필요하기 때문이다. 하지만 이 margin은 loss detection을 느리게 만든다. 첫 segment가 lost되고 뒤 segment들이 receiver에 도착하면, receiver는 missing segment가 오기 전까지 out-of-order segment를 buffer해야 한다. RTO 만료가 너무 늦으면 receive buffer가 차서 뒤 segment를 discard하게 될 수 있다.

`Fast retransmit`은 이 문제를 줄이기 위해 TCP의 규칙을 이용한다. Receiver가 out-of-order segment를 받으면 마지막 in-order segment에 대한 ACK를 즉시 반복한다. Sender는 같은 ACK가 반복되는 duplicate ACK pattern을 보고 timeout을 기다리지 않고 loss를 추정할 수 있다. 이 부분은 다음 구간의 `UDP` 직전 본문에서 fast retransmit/fast recovery와 함께 마무리된다.

#### Fast Retransmit and Fast Recovery

Duplicate ACK 하나만으로는 loss라고 단정할 수 없다. Segment가 단순히 지연되어 out of order로 도착했을 수도 있기 때문이다. Jacobson은 같은 segment에 대한 `three duplicate ACKs`, 즉 총 네 번의 같은 ACK를 받을 때 loss 가능성이 높다고 보고, timeout을 기다리지 않고 missing segment를 즉시 retransmit하는 `fast retransmit`을 제안한다.

Fast retransmit이 작동했다는 것은 segment 하나는 lost되었지만, 그 뒤의 data segment들은 receiver까지 계속 도착하고 있다는 뜻이기도 하다. 즉 network가 완전히 막힌 상태는 아닐 가능성이 크다. 그래서 timeout 때처럼 `cwnd = 1`로 떨어뜨리고 exponential slow start를 처음부터 다시 하는 것은 지나치게 보수적일 수 있다.

`Fast recovery`는 이 관찰을 이용한다.

| 단계 | 의미 |
|---|---|
| Lost segment retransmit | duplicate ACK pattern으로 추정한 missing segment를 즉시 다시 보낸다. |
| Cut `cwnd` in half | congestion 신호를 반영해 sending rate를 낮춘다. |
| Linear increase | slow start의 exponential phase를 건너뛰고 congestion avoidance처럼 선형 증가로 복구한다. |

`NewReno`의 modified fast recovery는 한 window 안에서 두 segment가 lost되는 경우를 더 잘 처리하기 위해 개선된 방식이다. Fast retransmit 이후 ACK가 fast retransmit 전에 보낸 모든 segment를 cover하지 못하면, sender는 같은 window 안에서 추가 segment loss를 추정하고 더 retransmit할 수 있다. 원문은 세부 algorithm은 RFC 2581/2582로 넘기며, 여기서는 "timeout 기반 재전송보다 빠르게 loss를 추정하고, congestion window를 완전히 초기화하지 않고 회복한다"는 설계 이유가 핵심이다.

### 20.4 UDP

`UDP(User Datagram Protocol)`는 TCP/IP protocol suite에서 TCP와 함께 널리 쓰이는 transport-level protocol이다. UDP는 `connectionless service`를 application-level procedures에게 제공한다. 따라서 기본적으로 unreliable하다. Delivery, duplicate protection, ordered delivery를 보장하지 않는다. 대신 overhead가 작고, connection establishment/termination이 없다.

TCP와 UDP의 차이는 "좋고 나쁨"이 아니라 service model 차이다.

| Protocol | 제공하는 것 | 제공하지 않는 것 | 맞는 상황 |
|---|---|---|---|
| `TCP` | reliable byte stream, flow control, error control, sequenced delivery, connection management | 낮은 overhead, application-controlled timing | file transfer, web, mail처럼 정확성과 순서가 중요한 경우 |
| `UDP` | port addressing, datagram delivery, optional checksum | reliability, ordering, duplicate protection, congestion/window control | monitoring, simple request-response, real-time voice/telemetry처럼 지연과 단순성이 중요한 경우 |

UDP가 유용한 대표 상황은 다음과 같다.

| 상황 | UDP가 맞는 이유 |
|---|---|
| `Inward data collection` | sensor sampling, self-test report처럼 주기적으로 data가 오면 occasional loss가 치명적이지 않다. |
| `Outward data dissemination` | broadcast announcement, node/service address change, real-time clock distribution처럼 connection setup이 부담스럽다. |
| `Request-response` | 단일 request-response transaction이 일반적인 application에서는 connection establishment/termination이 과하다. |
| `Real-time applications` | voice, telemetry처럼 retransmission이 늦게 도착한 data보다 더 해로울 수 있다. |

UDP는 IP 위에 올라가며, 본질적으로 IP에 `port addressing`을 추가한다. IP만으로는 host까지는 갈 수 있지만, host 내부의 어느 application procedure에 전달할지 알기 어렵다. UDP source/destination port는 이 demultiplexing을 가능하게 한다.

![Figure 20.14](@/assets/images/data-communication-278-figure-20-14-page-713.png)
*Figure 20.14 · PDF p. 713 · source/destination port, length, checksum만 갖는 8-octet UDP header*

UDP header는 8 octets로 매우 작다.

| Field | 크기 | 의미 |
|---|---:|---|
| `Source Port` | 16 bits | sender application procedure |
| `Destination Port` | 16 bits | receiver application procedure |
| `Length` | 16 bits | UDP header + data를 포함한 전체 UDP segment length |
| `Checksum` | 16 bits | UDP segment + pseudoheader에 대한 checksum |

UDP checksum은 TCP와 같은 algorithm을 사용하며, TCP와 같은 pseudoheader를 prefix해 계산한다. Error가 검출되면 UDP segment는 discard되고, 추가 recovery action은 없다. UDP checksum은 optional이며 사용하지 않으면 field를 zero로 둔다. 단 IP checksum은 IP header만 보호하고 IP payload, 즉 UDP header와 user data를 보호하지 않는다. 따라서 UDP checksum을 사용하지 않으면 transport layer와 internet layer 어느 곳에서도 user data bit error를 검사하지 않는다는 점이 중요하다.

## 연결 관계

Chapter 20은 Chapter 18-19의 IP internetwork 위에 application-friendly communication service를 얹는 장이다. IP는 host-to-host datagram delivery를 제공하지만, TCP와 UDP는 process-to-process transport abstraction을 제공한다.

| 연결 | 설명 |
|---|---|
| Chapter 18 IP와 연결 | TCP/UDP segment는 IP datagram payload로 실린다. TCP checksum pseudoheader는 IP source/destination/protocol/length를 포함해 misdelivery를 감지한다. |
| Chapter 19 QoS/congestion과 연결 | TCP congestion control은 packet drop과 delay 증가를 congestion signal로 보고 sender-side window를 줄인다. |
| Chapter 21 이후 application과 연결 | FTP/SMTP/TELNET/HTTP 같은 application은 TCP service를, SNMP/DNS/RTP/SIP 일부는 UDP service를 활용한다. |

TCP의 핵심은 "unreliable datagram network 위에서 reliable stream을 보이게 만드는 것"이다. 이를 위해 byte sequence number, cumulative ACK, credit window, timer, three-way handshake, 2MSL, congestion window가 서로 맞물린다. UDP의 핵심은 반대로 "application이 reliability를 원하지 않거나 직접 처리할 때 최소 transport 기능만 제공하는 것"이다.

## 오해하기 쉬운 내용

| 오해 | 정리 |
|---|---|
| TCP flow control과 congestion control은 같은 것이다. | Flow control은 receiver buffer 보호, congestion control은 network congestion 완화다. TCP에서는 window mechanism으로 둘 다 표현되지만 목적이 다르다. |
| TCP ACK는 segment number를 ACK한다. | TCP ACK는 다음에 기대하는 data octet sequence number를 나타낸다. TCP는 byte stream protocol이다. |
| PUSH는 message boundary를 보장한다. | PUSH는 accumulated data를 지체하지 말고 전달하라는 hint이지, TCP stream을 record protocol로 바꾸지 않는다. |
| URGENT data는 별도 channel로 간다. | Urgent data도 ordinary stream 안에 있고, urgent pointer가 urgent data의 끝을 알려준다. |
| Two-way handshake면 connection을 열기에 충분하다. | Unreliable network에서는 obsolete SYN/data 때문에 three-way handshake가 필요하다. |
| RTO가 작을수록 좋다. | 너무 작은 RTO는 unnecessary retransmission으로 congestion을 악화한다. RTT 평균과 variance를 함께 반영해야 한다. |
| Slow start는 천천히 증가한다. | 이름과 달리 slow start의 cwnd는 ACK마다 증가해 RTT 단위로 exponential growth를 한다. |
| UDP는 IP와 완전히 같다. | UDP는 IP에 port addressing과 length/checksum field를 추가해 process-to-process delivery를 가능하게 한다. |
| UDP checksum을 꺼도 IP checksum이 data를 보호한다. | IP checksum은 IP header만 보호한다. UDP checksum이 없으면 user data 검사가 없다. |

## 면접 질문

1. Transport layer가 network layer 위에서 제공하는 `end-to-end data transfer service`의 의미를 설명하라.
2. `(Host, Port)`와 `socket`의 관계를 설명하고, TCP connection이 어떤 pair로 식별되는지 말하라.
3. Transport multiplexing에서 `upward multiplexing`과 `downward multiplexing`의 차이를 설명하라.
4. TCP credit scheme에서 `AN = i, W = j`가 정확히 무엇을 의미하는지 설명하라.
5. Fixed sliding window와 TCP credit scheme의 핵심 차이를 설명하라.
6. Two-way handshake가 obsolete SYN/data segment에 취약한 이유와 three-way handshake의 해결 방식을 설명하라.
7. TCP state에서 `SYN RECEIVED`, `TIME WAIT`, `2MSL`이 필요한 이유를 설명하라.
8. TCP header의 `Sequence Number`, `Acknowledgment Number`, `Window`, `Checksum`, `Urgent Pointer` 역할을 설명하라.
9. `PUSH`와 `URGENT`가 각각 어떤 TCP service facility인지 설명하라.
10. `SRTT`, `SDEV`, `RTO`가 Jacobson's algorithm에서 어떻게 연결되는지 설명하라.
11. Karn's algorithm이 retransmitted segment의 RTT sample을 버리는 이유를 설명하라.
12. `cwnd`, `credit`, `awnd`의 차이와 `awnd = MIN[credit, cwnd]`의 의미를 설명하라.
13. Slow start와 congestion avoidance의 증가 방식 차이를 설명하라.
14. Fast retransmit이 three duplicate ACKs를 사용하는 이유를 설명하라.
15. UDP가 TCP 대신 적합한 application 유형을 예로 들고 이유를 설명하라.

## 핵심 용어 정리

| Term | 의미 |
|---|---|
| `transport protocol` | upper-layer protocol에게 end-to-end data transfer service를 제공하는 protocol |
| `TS user` | transport service를 사용하는 application 또는 upper-layer protocol |
| `port` | host 내부의 특정 transport user/application endpoint 식별자 |
| `socket` | TCP에서 host/address와 port의 조합, connection endpoint |
| `multiplexing` | 여러 upper-layer user 또는 lower-layer connection을 공유/분리하는 기능 |
| `credit` | receiver가 sender에게 허용하는 추가 data octets 양 |
| `flow control` | receiver/user/buffer가 감당 가능한 속도로 sender를 제한하는 기능 |
| `sequence number` | TCP byte stream에서 data octet 순서를 나타내는 번호 |
| `duplicate detection` | retransmission 또는 obsolete segment를 중복으로 식별하는 기능 |
| `three-way handshake` | 양쪽 SYN과 sequence number를 서로 ACK해 connection을 안전하게 여는 절차 |
| `2MSL / TIME WAIT` | obsolete segment가 사라질 시간을 확보하기 위해 close 후 기다리는 interval/state |
| `data stream push` | TCP가 누적 data를 지체하지 않고 전송/전달하도록 하는 service |
| `urgent data signaling` | stream 안의 urgent data 존재를 destination TCP user에게 알리는 service |
| `TCP header` | TCP segment의 control information. port, sequence/ack, flags, window, checksum 등 포함 |
| `SRTT` | Smoothed Round-Trip Time, exponential averaging으로 추정한 RTT |
| `RTO` | Retransmission Timeout, ACK를 기다릴 timer 값 |
| `Jacobson's algorithm` | RTT 평균과 deviation을 함께 추정해 RTO를 계산하는 방식 |
| `Karn's algorithm` | retransmitted segment의 ambiguous RTT sample을 estimator에서 제외하는 방식 |
| `cwnd` | congestion window, sender가 congestion control을 위해 유지하는 window |
| `slow start` | connection start/recovery에서 cwnd를 작은 값부터 ACK 기반으로 증가시키는 기법 |
| `congestion avoidance` | threshold 이후 cwnd를 RTT당 선형 증가시키는 기법 |
| `fast retransmit` | duplicate ACK pattern으로 timeout 전에 loss를 추정해 retransmit하는 기법 |
| `fast recovery` | fast retransmit 후 cwnd를 절반으로 줄이고 선형 증가로 복구하는 기법 |
| `UDP` | User Datagram Protocol, connectionless transport service와 port addressing을 제공 |
| `UDP checksum` | UDP segment와 pseudoheader를 검사하는 optional checksum |
