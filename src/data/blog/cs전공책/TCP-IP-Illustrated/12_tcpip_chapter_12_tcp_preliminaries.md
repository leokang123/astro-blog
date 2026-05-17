---
title: "Chapter 12. TCP Preliminaries"
order: 12
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: Chapter 12. TCP Preliminaries"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

TCP는 IP가 제공하지 않는 reliability를 end-to-end transport layer에서 제공한다. IP와 UDP는 error detection 또는 best-effort delivery에 머무르고, packet drop, bit error, reordering, duplication을 직접 복구하지 않는다. TCP는 이런 unreliable network 위에서 application이 사용할 수 있는 reliable byte stream을 만들기 위해 `ACK`, `sequence number`, `retransmission`, `sliding window`, `flow control`, `congestion control`, `retransmission timeout (RTO)` 같은 mechanism을 결합한다.

이 장은 TCP의 세부 algorithm을 본격적으로 다루기 전의 예비 지식이다. 핵심은 "왜 단순히 packet을 보내고 기다리는 방식이 부족한가"와 "TCP header가 reliability와 multiplexing을 위해 어떤 field를 제공하는가"다.

## 핵심 개념

- `ARQ (Automatic Repeat Request)`: receiver가 ACK로 수신을 알리고, sender가 ACK를 받지 못하면 다시 보내는 reliability 기법이다.
- `ACK (Acknowledgment)`: receiver가 특정 data를 받았음을 sender에게 알리는 signal이다.
- `sequence number`: duplicate, reordering, missing data를 구분하기 위해 data에 붙이는 번호다.
- `stop-and-wait`: 한 packet을 보내고 ACK를 기다린 뒤 다음 packet을 보내는 가장 단순한 ARQ 방식이다.
- `RTT (Round-Trip Time)`: packet 전송과 그 ACK 수신까지의 왕복 시간이다.
- `throughput`: network에 실어 보낸 data 양/time이고, `goodput`은 그중 실제 유용하게 전달된 data 양/time이다.
- `sliding window`: 여러 packet을 ACK 대기 상태로 동시에 network에 올려 보내 pipeline을 만드는 방식이다.
- `flow control`: receiver buffer/processing capacity를 넘지 않도록 sender 속도를 제한한다.
- `congestion control`: network/router capacity를 넘지 않도록 sender 속도를 제한한다.

## 세부 정리

### 12.1 Introduction

지금까지의 protocol들, 특히 IP와 UDP는 data를 reliable하게 전달하려는 자체 복구 mechanism이 없다. IP/UDP는 checksum 등으로 오류를 detect할 수는 있지만, 손상되거나 사라진 data를 고치거나 다시 보내는 일은 하지 않는다. Ethernet 계열 protocol은 일정 횟수 retry 후 포기할 수 있지만, multihop Internet 전체에 대한 end-to-end reliability를 보장하지는 않는다.

Lossy channel에서 information을 전달하는 문제는 information theory와 coding theory의 오래된 주제다. Error handling에는 크게 두 접근이 있다.

| 접근 | 의미 | TCP와의 관계 |
|---|---|---|
| error-correcting code | redundant bits를 추가해 일부 bit가 손상되어도 원래 information을 복원 | link/storage 등에서 중요하지만 TCP의 기본 복구 방식은 아님 |
| `ARQ (Automatic Repeat Request)` | 잘못되었거나 도착하지 않은 data를 다시 보냄 | TCP reliability의 중심 아이디어 |

TCP는 Internet처럼 packet이 drop, reorder, duplicate될 수 있는 환경에서 ARQ 계열 mechanism을 사용한다. 단순히 bit error만 다루는 것이 아니라, router 중간에서 생길 수 있는 packet erasure, reordering, duplication까지 처리해야 한다.

### 12.1.1 ARQ and Retransmission

ARQ의 가장 단순한 형태는 sender가 packet 하나를 보내고, receiver가 제대로 받으면 `ACK (Acknowledgment)`를 돌려주는 방식이다. Sender는 ACK를 받으면 다음 packet을 보내고, ACK가 오지 않으면 packet이 사라졌거나 ACK가 사라졌거나 packet이 손상되었다고 보고 retransmission을 수행한다.

이 구조에서 sender/receiver가 풀어야 하는 문제는 다음과 같다.

| 문제 | 필요한 mechanism |
|---|---|
| receiver가 packet을 받았는가 | ACK |
| receiver가 받은 packet이 sender가 보낸 packet과 같은가 | checksum/CRC 같은 error detection |
| ACK가 사라진 경우와 data packet이 사라진 경우를 어떻게 구분하는가 | 기본적으로 구분하기 어렵기 때문에 sender는 retransmission |
| retransmission으로 duplicate packet이 생기면 어떻게 하는가 | sequence number로 이미 받은 packet인지 확인 |
| ACK를 얼마나 기다린 뒤 재전송할 것인가 | retransmission timeout, TCP에서는 Chapter 14에서 상세히 다룸 |

Receiver가 error가 있는 packet을 받으면 ACK를 보내지 않는다. Sender는 timeout 후 같은 packet을 다시 보낸다. 이때 ACK loss와 data loss는 sender 입장에서 구분하기 어렵다. 둘 다 "ACK를 받지 못했다"로 보이기 때문이다. 그래서 receiver는 duplicate copy를 받을 수 있고, 이를 버릴 수 있어야 한다.

`sequence number`는 이 duplicate/reordering 문제를 해결하는 기본 도구다. Sender는 unique packet마다 sequence number를 붙이고, receiver는 그 번호를 보고 이미 처리한 packet인지, 예상보다 앞서 도착한 out-of-sequence packet인지 판단한다. TCP에서는 packet 단위가 아니라 byte stream 단위 sequence number를 사용하지만, 이 장의 추상 설명에서는 packet sequence number로 먼저 이해하면 된다.

가장 단순한 ARQ protocol은 reliable하지만 비효율적이다. Sender가 packet 하나를 보내고 ACK를 받을 때까지 멈추는 방식을 `stop-and-wait`라고 한다. Packet size를 `M`, RTT를 `R`이라 하면 packet loss가 없을 때 throughput은 대략 `M/R`에 비례한다. RTT가 커질수록 sender가 기다리는 시간이 길어지고 throughput이 떨어진다. Satellite link처럼 latency가 큰 path에서는 network capacity가 남아도 sender가 한 packet만 넣고 기다리므로 대부분의 path가 idle 상태가 된다.

이때 실제 useful data rate인 `goodput`은 throughput보다 더 나빠질 수 있다. Packet이 손상되거나 drop되어 retransmission이 발생하면 network에는 data가 실리지만 application 관점에서 새 useful data가 전달되지 않기 때문이다.

Stop-and-wait의 한계는 assembly line 비유로 이해할 수 있다. 완성품 하나가 끝까지 나올 때까지 다음 작업물을 넣지 못하면 생산 line 대부분이 놀게 된다. Network도 마찬가지로, RTT 동안 하나의 packet만 path에 존재하면 bandwidth-delay product가 큰 network를 채우지 못한다. 이를 해결하려면 여러 packet을 동시에 outstanding 상태로 둘 수 있어야 하고, 이것이 다음 section의 `sliding window`로 이어진다.

여러 packet을 동시에 보내면 효율은 좋아지지만 복잡도도 증가한다. Sender는 몇 개까지 보낼지, 각 packet의 timer를 어떻게 관리할지, ACK되지 않은 packet copy를 얼마나 보관할지 결정해야 한다. Receiver는 어떤 packet이 왔고 어떤 packet이 빠졌는지 구분하는 ACK mechanism과 out-of-sequence packet buffer를 가져야 한다. 또한 receiver가 sender보다 느리거나 network 중간 router가 감당하지 못하는 경우도 고려해야 하므로, flow control과 congestion control이 필요해진다.

### 12.1.2 Windows of Packets and Sliding Windows

`window of packets`는 sender가 이미 network에 넣었지만 아직 complete ACK를 받지 못한 packet 또는 sequence number의 집합이다. `window size`는 이 window 안에 들어갈 수 있는 packet 수다. Stop-and-wait에서는 outstanding packet이 최대 1개지만, sliding window에서는 여러 packet이 동시에 outstanding 상태가 될 수 있다.

![Figure 12-1](@/assets/images/241_figure_12_1_page_621.png)
*Figure 12-1 · PDF p. 621 · sender window에서 이미 ACK된 packet, 전송 가능한 packet, 아직 보낼 수 없는 packet의 구분*

Figure 12-1의 예에서 window size는 3이다. Packet 3은 이미 sent and acknowledged 상태이므로 sender가 보관하던 copy를 버릴 수 있다. Packet 4, 5, 6은 current window 안에 있으므로 이미 보냈거나 보낼 수 있는 packet이다. Packet 7은 sender 쪽에 준비되어 있어도 아직 right window edge 밖에 있으므로 보낼 수 없다. 이후 packet 4에 대한 ACK가 오면 left window edge가 오른쪽으로 이동하고, packet 7이 window 안으로 들어와 전송 가능해진다. 이 움직임 때문에 `sliding window protocol`이라고 부른다.

Sliding window는 sender와 receiver 양쪽에서 tracking structure로 쓰인다.

| 위치 | window가 추적하는 것 |
|---|---|
| sender | 어떤 packet copy를 release할 수 있는지, 어떤 packet이 ACK 대기 중인지, 어떤 packet은 아직 보낼 수 없는지 |
| receiver | 어떤 packet을 이미 받고 ACK했는지, 어떤 packet을 기대하는지, out-of-sequence packet을 어디까지 buffer할 수 있는지 |

이 구조 자체는 reliability와 pipelining의 기반일 뿐, window size를 얼마로 해야 하는지는 알려 주지 않는다. Window가 너무 작으면 network가 idle해지고 throughput이 낮다. Window가 너무 크면 receiver buffer나 network router queue를 넘어서 packet loss가 늘 수 있다. 그래서 window size는 receiver 보호를 위한 `flow control`과 network 보호를 위한 `congestion control`과 연결된다.

### 12.1.3 Variable Windows: Flow Control and Congestion Control

`flow control`은 sender가 receiver가 감당할 수 있는 속도를 넘지 않도록 조절하는 mechanism이다. 대표 방식은 두 가지다.

| 방식 | 의미 | 어울리는 상황 |
|---|---|---|
| `rate-based flow control` | sender에게 특정 data rate allocation을 주고 그 rate를 넘지 못하게 함 | streaming, broadcast/multicast delivery |
| `window-based flow control` | receiver가 sender에게 허용 window size를 알려 주고 sender outstanding data를 제한 | sliding window protocol, TCP |

TCP 계열에서 중요한 것은 `window-based flow control`이다. Receiver는 자신이 받아들일 수 있는 window size를 sender에게 `window advertisement` 또는 `window update`로 알린다. 논리적으로 window update와 ACK는 별개지만, 실제 protocol에서는 한 packet 안에 ACK와 window update가 함께 실리는 일이 많다. 그래서 sender는 ACK를 받고 left window edge를 밀면서 동시에 advertised window에 맞춰 right window edge도 조정한다.

Window size와 전송률의 관계는 직관적으로 다음과 같다.

```text
transfer rate ~= (S * W) / R bits/s
```

여기서 `S`는 packet size in bits, `W`는 window size, `R`은 RTT다. Receiver가 window advertisement로 `W`를 작게 제한하면 sender가 network에 동시에 올릴 수 있는 data 양이 줄어 receiver를 압도하지 않는다.

하지만 flow control만으로는 충분하지 않다. Receiver는 충분히 빠르더라도 중간 router의 buffer나 outgoing link가 부족하면 packet loss가 발생할 수 있다. 이런 network 내부 overload를 다루는 것이 `congestion control`이다. Flow control이 receiver capacity를 보호한다면, congestion control은 sender와 receiver 사이 network path의 capacity를 보호한다.

| 구분 | 보호 대상 | signal 형태 | TCP에서 이어지는 장 |
|---|---|---|---|
| `flow control` | receiver buffer/processing capacity | receiver가 explicit하게 advertised window 제공 | Chapter 15 |
| `congestion control` | router queue, bottleneck link, network path | loss, delay, ECN 등 explicit/implicit signal | Chapter 16 |

본문은 explicit signaling과 implicit signaling을 구분한다. Receiver window advertisement는 protocol field로 직접 "얼마나 보내도 되는가"를 알려 주므로 explicit signaling이다. 반면 sender가 packet loss나 delay 증가를 보고 network congestion을 추측해 속도를 낮추는 것은 implicit signaling에 가깝다. Congestion control은 datagram network와 queuing theory가 얽힌 어려운 문제라 모든 상황에서 완전한 해법은 없고, TCP의 구체적 algorithm은 Chapter 16에서 다룬다.

### 12.1.4 Setting the Retransmission Timeout

Retransmission-based reliable protocol에서 중요한 성능 문제는 `retransmission timeout (RTO)`를 얼마로 둘 것인가다. Sender가 너무 빨리 timeout을 판단하면 실제로는 도착 중인 packet/ACK에 대해 불필요한 retransmission이 생긴다. 너무 늦게 timeout을 판단하면 loss를 복구하기 전까지 network와 application이 오래 기다려 throughput과 latency가 나빠진다.

이상적으로 sender가 기다려야 하는 시간은 다음 요소의 합에 가깝다.

| 구성 요소 | 의미 |
|---|---|
| packet transmit time | sender가 packet을 내보내는 데 걸리는 시간 |
| forward path delay | packet이 receiver까지 가는 시간 |
| receiver processing time | receiver가 packet을 처리하고 ACK를 만드는 시간 |
| reverse path delay | ACK가 sender로 돌아오는 시간 |
| sender ACK processing time | sender가 ACK를 처리하는 시간 |

문제는 이 값들이 고정되어 있지 않고, host load, router load, path 변화에 따라 계속 변한다는 점이다. 그래서 protocol implementation은 사용자가 값을 직접 지정하게 하기보다 `round-trip-time estimation`을 수행한다. 여러 RTT sample을 모아 평균적인 RTT를 추정하지만, 실제 RTT distribution은 시간에 따라 변하는 non-stationary process다.

RTO를 RTT mean과 정확히 같게 두면 안 된다. 평균은 sample들의 극단값이 아니므로 실제 RTT 중 상당수는 평균보다 클 수 있고, 그러면 정상 packet에 대해 spurious retransmission이 발생한다. 따라서 timeout은 평균보다 충분히 커야 한다. 하지만 너무 크게 잡으면 loss recovery가 늦어지고 stop-and-wait의 문제처럼 network가 idle해진다. TCP가 이 균형을 어떻게 잡는지는 Chapter 14의 timer-based retransmission에서 상세히 이어진다.

### 12.2 Introduction to TCP

이제 일반적인 reliable delivery 문제를 TCP에 적용한다. TCP header에는 앞에서 본 개념들이 직접 field로 드러난다. 예를 들어 ACK는 `Acknowledgment Number`와 ACK bit로, receiver가 허용하는 window는 `Window Size`로, data 위치는 `Sequence Number`로 표현된다. 이 장은 TCP의 header와 encapsulation을 소개하고, 이후 장들이 각 field와 algorithm을 자세히 다룬다.

TCP 관련 이후 장의 흐름은 다음과 같다.

| 장 | TCP에서 다루는 내용 |
|---|---|
| Chapter 13 | TCP connection establishment and termination |
| Chapter 14 | per-connection RTT estimation, retransmission timeout |
| Chapter 15 | normal data transfer, interactive/bulk flow, window management, flow control, urgent mechanism |
| Chapter 16 | congestion control algorithms, fast networks/lossy networks 관련 variant |
| Chapter 17 | data가 없을 때 connection을 유지하는 keepalive 관련 동작 |

TCP의 original specification은 RFC0793이고, Host Requirements RFC1122와 이후 여러 RFC가 congestion control, retransmission timeout, NAT traversal, acknowledgment behavior, security, connection management, urgent mechanism 등을 보완했다. 암기할 대상이라기보다 TCP가 단일 문서 하나로 끝나는 protocol이 아니라, 수십 년 동안 Internet 운용 경험에 맞춰 계속 보정된 protocol이라는 점이 중요하다.

### 12.2.1 The TCP Service Model

TCP와 UDP는 같은 network layer, 즉 IPv4 또는 IPv6 위에서 동작하지만 application에 제공하는 service model이 완전히 다르다. TCP는 `connection-oriented`, `reliable`, `byte stream` service다.

`connection-oriented`는 두 application endpoint가 data를 교환하기 전에 TCP connection을 먼저 establish해야 한다는 뜻이다. 전화 통화처럼 상대를 부르고, 응답을 확인하고, 그 뒤 대화를 시작하는 model에 가깝다. 하나의 TCP connection에는 정확히 두 endpoint만 있으므로 TCP에는 broadcast나 multicast 개념이 적용되지 않는다.

`byte stream`은 TCP가 application write boundary를 보존하지 않는다는 뜻이다. Application이 10 bytes, 20 bytes, 50 bytes를 세 번 write하더라도 receiver application은 이를 20 bytes씩 네 번 read할 수도 있고, 다른 크기로 read할 수도 있다. TCP가 보장하는 것은 "같은 byte들이 같은 순서로 도착한다"는 것이지, "sender의 write 단위가 receiver의 read 단위로 보인다"는 것이 아니다.

| 특성 | TCP | UDP와의 대비 |
|---|---|---|
| connection | connection-oriented, 2 endpoints | connectionless |
| data abstraction | byte stream | datagram/message-oriented에 가까움 |
| write boundary | 보존하지 않음 | 보통 application write 하나가 UDP datagram 하나 |
| reliability | retransmission/ACK/sequence number로 제공 | application이 직접 처리해야 함 |
| multicast/broadcast | TCP connection model에는 없음 | UDP는 broadcast/multicast와 함께 사용 가능 |

TCP는 byte content를 해석하지 않는다. TCP 입장에서는 application data가 binary인지 ASCII인지 EBCDIC인지 알지 못하고, 알 필요도 없다. Data interpretation은 양 endpoint의 application protocol이 담당한다. TCP에는 과거의 `urgent mechanism`이 있지만 현재는 사용이 권장되지 않는다.

### 12.2.2 Reliability in TCP

TCP는 application byte stream을 IP가 운반할 수 있는 packet 단위로 나눈다. 이 과정을 `packetization`이라고 한다. TCP가 IP에 넘기는 chunk를 `segment`라고 부른다. UDP에서는 application write 하나가 보통 같은 크기의 UDP datagram이 되지만, TCP에서는 application write boundary와 segment boundary가 일치하지 않는다. TCP는 path에서 fragmentation이 일어나지 않도록 적절한 segment size를 고르려 하며, 그 결정은 Chapter 15에서 더 자세히 다룬다.

TCP의 sequence number는 packet 번호가 아니라 byte stream 안의 byte offset이다. Segment마다 `Sequence Number`는 그 segment에 들어 있는 첫 byte의 stream offset을 나타낸다. 이 설계 덕분에 TCP segment는 transfer 중 variable size일 수 있고, 상황에 따라 여러 data chunk를 다시 묶는 `repacketization`도 가능하다.

TCP reliability mechanism은 다음처럼 정리할 수 있다.

| Mechanism | TCP에서의 역할 |
|---|---|
| mandatory checksum | TCP header, application data, IP pseudo-header field를 대상으로 bit error detect |
| sequence number | byte stream position, duplicate detection, reordering, missing hole tracking |
| cumulative ACK | ACK number N은 N 직전 byte까지 모두 받았음을 의미 |
| retransmission timer | ACK가 제때 오지 않으면 segment retransmission |
| receive reordering buffer | higher sequence data를 application에 바로 넘기지 않고 hole이 채워질 때까지 보관 |

TCP checksum은 UDP, ICMP 등과 같은 Internet checksum 계열의 mathematical function을 사용한다. TCP에서는 IPv4든 IPv6든 pseudo-header checksum이 mandatory다. Segment checksum이 invalid하면 receiving TCP는 그 segment를 discard하고, 그 segment 자체에 대한 ACK를 보내지 않는다. 다만 congestion control 계산에 도움을 주기 위해 이미 ACK한 이전 data에 대한 ACK를 다시 보낼 수 있다.

큰 data transfer에서는 TCP checksum이 충분히 강한가에 대한 우려가 있다. TCP checksum은 end-to-end bit error detection에는 필수지만, 매우 큰 data나 높은 신뢰성이 필요한 application은 stronger checksum, CRC, middleware layer 같은 추가 error protection을 사용할 수 있다.

TCP는 일반적으로 segment마다 별도 retransmission timer를 두지 않는다. Window of data를 보낼 때 하나의 timer를 설정하고, ACK가 도착함에 따라 timeout 계산을 update한다. ACK가 제때 오지 않으면 segment가 retransmit된다. TCP의 adaptive timeout과 retransmission strategy는 Chapter 14로 이어진다.

TCP ACK는 `cumulative`하다. ACK number `N`은 byte number `N` 자체가 아니라, 그 직전까지의 모든 byte가 성공적으로 수신되었다는 뜻이다. 이 방식은 ACK loss에 robust하다. 예를 들어 어떤 ACK가 사라져도 이후 더 큰 ACK number를 가진 ACK가 오면 이전 data도 함께 확인된 것으로 처리할 수 있다.

TCP는 `full-duplex service`를 제공한다. Connection이 established된 뒤 양방향 data flow는 독립적이며, 각 방향마다 별도 sequence number space가 있다. Data를 한 방향으로 운반하는 TCP segment도 반대 방향 data에 대한 ACK와 window advertisement를 함께 담을 수 있다. 따라서 segment 하나를 받으면 동시에 세 일이 일어날 수 있다.

| 수신한 TCP segment가 야기할 수 있는 변화 | 설명 |
|---|---|
| window slides forward | 반대 방향 data에 대한 ACK가 도착해 sender window가 전진 |
| window size changes | 반대 방향 flow control을 위한 advertised window가 바뀜 |
| new data arrives | 이 segment 자체가 현재 방향의 application data를 포함 |

TCP는 IP 위에서 동작하므로 IP의 특성도 그대로 받아들여야 한다. IP는 duplicate elimination도, ordering guarantee도 제공하지 않는다. 그래서 receiving TCP는 duplicate segment를 버리고, out-of-order segment를 sequence number 기준으로 재정렬한다. 하지만 TCP는 byte stream protocol이므로 receiving application에는 절대 out-of-order data를 전달하지 않는다. 더 큰 sequence number의 data가 먼저 도착하면 TCP는 이를 buffer에 보관하고, missing lower-sequence-number segment, 즉 `hole`이 채워질 때까지 기다린다.

### 12.3 TCP Header and Encapsulation

TCP segment는 IP datagram 안에 encapsulate된다. IPv4에서는 IP header의 `Protocol` field가 6이면 payload가 TCP임을 뜻하고, IPv6에서는 `Next Header` chain의 마지막 transport header 값이 6이면 TCP다.

![Figure 12-2](@/assets/images/242_figure_12_2_page_626.png)
*Figure 12-2 · PDF p. 626 · IP datagram 안에서 TCP header와 TCP/application data가 놓이는 위치*

TCP header는 IP header 또는 마지막 IPv6 extension header 바로 뒤에 온다. TCP header는 options가 없으면 보통 20 bytes이고, options가 있으면 최대 60 bytes까지 커질 수 있다. 흔한 TCP option에는 `MSS (Maximum Segment Size)`, `Timestamps`, `Window Scaling`, `SACK (Selective ACK)`가 있다. TCP segment의 data portion은 optional이다. Connection establishment/termination, pure ACK, window update, 일부 timeout-related segment는 application data 없이 TCP header만 가질 수 있다.

![Figure 12-3](@/assets/images/243_figure_12_3_page_627.png)
*Figure 12-3 · PDF p. 627 · TCP header format과 Sequence Number, Acknowledgment Number, flags, Window Size field*

Figure 12-3의 TCP header는 UDP보다 복잡하다. TCP는 양 endpoint의 connection state를 synchronize해야 하므로, reliability, ordering, flow control, connection management, congestion signaling에 필요한 field가 header에 들어간다.

| Field | 크기 | 핵심 역할 |
|---|---:|---|
| `Source Port` | 16 bits | sender-side application endpoint 식별 |
| `Destination Port` | 16 bits | receiver-side application endpoint 식별 |
| `Sequence Number` | 32 bits | 이 segment data의 첫 byte가 byte stream에서 갖는 번호 |
| `Acknowledgment Number` | 32 bits | 다음에 기대하는 byte number, 즉 cumulative ACK 값 |
| `Header Length` | 4 bits | TCP header 길이, 32-bit words 단위 |
| `Resv` | 4 bits | reserved, 기본 0 |
| flags | 8 bits | CWR, ECE, URG, ACK, PSH, RST, SYN, FIN |
| `Window Size` | 16 bits | ACK Number부터 receiver가 더 받을 수 있는 byte 수 |
| `TCP Checksum` | 16 bits | TCP header/data와 IP pseudo-header에 대한 mandatory checksum |
| `Urgent Pointer` | 16 bits | URG set일 때 urgent data 끝 위치를 나타내는 offset |
| `Options` | variable | MSS, SACK, Timestamp, Window Scale 등 확장 기능 |

TCP connection은 4-tuple로 식별된다.

```text
(client IP address, client port number, server IP address, server port number)
```

IP address와 port number의 조합은 `endpoint` 또는 `socket`이라고 부른다. Server가 여러 client와 동시에 통신할 수 있는 이유는 client IP/port가 다르면 같은 server IP/port라도 TCP connection 4-tuple이 서로 다르기 때문이다. 이 사실은 Chapter 13의 connection establishment와 server concurrency 이해에 중요하다.

`Sequence Number`는 한 방향 byte stream에서 이 segment의 첫 byte 번호를 나타낸다. 32-bit unsigned number이므로 `(2^32)-1` 이후 0으로 wraparound된다. TCP connection을 시작할 때 client가 보내는 첫 `SYN` segment에는 그 방향에서 사용할 `ISN (Initial Sequence Number)`이 들어간다. ISN은 보통 0이나 1이 아니라 security 이유로 임의성 있게 선택된다. SYN은 sequence number 하나를 consume하므로, 첫 application data byte의 sequence number는 `ISN + 1`이다. `FIN`도 sequence number를 consume한다. 반대로 pure ACK는 sequence number를 consume하지 않으므로 reliable delivery 대상이 아니다.

`Acknowledgment Number`는 ACK bit가 set되어 있을 때 valid하다. 값 `N`은 "N 바로 전 byte까지 in-order로 받았고, 다음에는 byte N을 기대한다"는 뜻이다. TCP는 `sliding window protocol with cumulative positive acknowledgments`라고 요약할 수 있다. 일반 ACK Number field만으로는 out-of-order segment 수신 사실을 세밀하게 표현할 수 없다. 예를 들어 bytes 1-1024를 받은 뒤 2049-3072가 먼저 도착해도 cumulative ACK는 여전히 1025를 가리킨다. 현대 TCP의 `SACK (Selective Acknowledgment)` option은 이런 out-of-order data block을 sender에게 알려 selective repeat 성능을 높인다.

TCP flags는 connection management와 data transfer control에 쓰인다.

| Flag | 이름 | 의미 |
|---|---|---|
| `CWR` | Congestion Window Reduced | sender가 congestion window를 줄였음을 알림 |
| `ECE` | ECN Echo | earlier congestion notification을 받았음을 알림 |
| `URG` | Urgent | Urgent Pointer field가 valid |
| `ACK` | Acknowledgment | Acknowledgment Number field가 valid |
| `PSH` | Push | receiver가 data를 application에 빨리 넘기라는 hint |
| `RST` | Reset | error 등으로 connection abort |
| `SYN` | Synchronize | sequence number synchronize, connection initiation |
| `FIN` | Finish | sender가 peer에게 더 이상 보낼 data가 없음을 알림 |

`Window Size` field는 flow control의 header 표현이다. ACK Number가 가리키는 byte부터 receiver가 추가로 받을 의향이 있는 byte 수를 나타낸다. Field가 16 bits라 raw window는 최대 65,535 bytes이고, 이는 high-speed/long-delay network에서 throughput을 제한할 수 있다. Chapter 15의 `Window Scale` option은 이 field를 scaling해 훨씬 큰 effective window를 제공한다.

`TCP Checksum`은 sender가 반드시 계산해 저장하고 receiver가 반드시 검증해야 한다. TCP header와 data뿐 아니라 IP pseudo-header 일부 field까지 포함해, 잘못된 endpoint/length/protocol 조합이나 in-transit bit error를 detect한다. 이는 UDP checksum과 유사한 pseudo-header 방식이지만, TCP에서는 IPv4와 IPv6 모두에서 mandatory다.

`Urgent Pointer`는 URG flag가 set되어 있을 때만 의미가 있다. Segment의 Sequence Number에 더하는 positive offset으로 urgent data의 마지막 byte sequence number를 계산한다. TCP urgent mechanism은 특별 표시 data를 peer에게 전달하기 위한 기능이지만 현재는 거의 사용되지 않고 권장되지 않는다.

`MSS (Maximum Segment Size)` option은 connection의 첫 SYN segment에서 보통 교환된다. 이 option을 보낸 endpoint가 reverse direction으로 받아들일 최대 TCP segment data size를 알려 준다. 그 밖의 중요한 option인 `SACK`, `Timestamp`, `Window Scale`은 이후 장에서 data transfer, retransmission, flow control 성능과 연결된다.

### 12.4 Summary

Reliable communication은 lossy channel 위에서 오래 연구된 문제이고, 큰 축은 error-correcting code와 retransmission이다. Retransmission protocol은 ACK, timer, sequence number를 필요로 하며, ACK를 얼마나 기다릴지 결정하는 RTO 문제는 path/load 변화 때문에 단순하지 않다. Modern protocol은 RTT를 estimate하고 그 측정값의 함수로 retransmission timer를 설정한다.

Stop-and-wait는 이해하기 쉽지만 high-delay network에서 성능이 좋지 않다. 효율을 높이려면 여러 packet을 network에 동시에 넣어 pipeline을 만들어야 하고, 이를 관리하기 위해 sliding window가 필요하다. Window size가 receiver feedback에 따라 변하면 flow control을, loss/delay 같은 network signal에 따라 변하면 congestion control을 구현할 수 있다.

TCP는 이런 기법들을 결합해 reliable, connection-oriented, byte stream transport-layer service를 제공한다. TCP는 application data를 segment로 packetize하고, data를 보낼 때 timeout을 설정하며, 받은 data를 cumulative ACK로 확인하고, out-of-order data를 reorder하며, duplicate data를 discard하고, end-to-end flow control과 mandatory checksum을 제공한다. HTTP, SSH/TLS, Telnet, FTP, SMTP, NetBIOS over TCP, 여러 file-sharing application처럼 Internet의 많은 application이 TCP 위에서 동작한다.

## 연결 관계

- Chapter 13: `SYN`, `FIN`, `RST`, `ISN`, 4-tuple이 connection establishment/termination에서 실제로 어떻게 쓰이는지 다룬다.
- Chapter 14: `RTO`, RTT estimation, duplicate ACK, SACK retransmission 같은 timer/error control 세부로 이어진다.
- Chapter 15: `Window Size`, `Window Scale`, MSS, data transfer, flow control, window management로 이어진다.
- Chapter 16: `CWR`, `ECE`, congestion window, congestion control algorithm과 연결된다.
- Chapter 17: data가 없을 때 TCP connection을 유지하거나 확인하는 keepalive 성격의 동작으로 이어진다.

## 오해하기 쉬운 내용

- TCP는 message protocol이 아니다. Application write boundary를 보존하지 않는 `byte stream` protocol이다.
- TCP sequence number는 packet 번호가 아니라 byte offset이다.
- ACK number `N`은 byte `N`을 받았다는 뜻이 아니라, byte `N`을 다음에 기대한다는 뜻이다.
- Pure ACK는 sequence number를 consume하지 않으므로 SYN/FIN/application data처럼 retransmission으로 reliable delivery되는 대상이 아니다.
- Flow control과 congestion control은 모두 sender를 느리게 만들 수 있지만, 보호 대상이 receiver인지 network path인지가 다르다.

## 면접 질문

1. TCP가 UDP와 달리 `byte stream service`를 제공한다는 말은 application read/write 관점에서 어떤 의미인가?
2. Stop-and-wait ARQ의 throughput이 RTT에 민감한 이유는 무엇이고, sliding window는 이를 어떻게 개선하는가?
3. TCP에서 `Sequence Number`와 `Acknowledgment Number`는 각각 무엇을 가리키는가?
4. `flow control`과 `congestion control`의 차이를 receiver, network, signaling 관점에서 설명하라.
5. TCP header의 `Window Size`, `ACK`, `SYN`, `FIN`, `RST`, `Checksum` field는 각각 어떤 문제를 해결하는가?
