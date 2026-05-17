---
title: "Internetwork Protocols"
order: 18
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Internetwork Protocols"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 18은 Internet Protocols의 기본 뼈대다. 먼저 거의 모든 protocol이 공통으로 수행하는 기능을 정리하고, 여러 heterogeneous network를 router로 묶는 internetworking 원리를 설명한 뒤, `IPv4`, `IPv6`, `IPSec`으로 이어진다. 이 장의 핵심은 “상위 계층 데이터가 어떻게 PDU로 감싸지고, 여러 network/router를 거쳐, 주소와 fragmentation 정보를 유지한 채 destination까지 전달되는가”다.

## 핵심 개념

| 세부 주제 | 핵심 질문 | 검색용 용어 |
|---|---|---|
| Basic Protocol Functions | protocol은 데이터 전송을 위해 어떤 공통 기능을 제공하는가? | encapsulation, fragmentation, reassembly, connection control, flow control, error control |
| Principles of Internetworking | 서로 다른 network를 하나의 internet처럼 묶으려면 무엇이 필요한가? | internet, router, datagram, connectionless service |
| Internet Protocol Operation | source host의 IP datagram은 여러 network와 router를 어떻게 통과하는가? | routing, direct delivery, indirect delivery, fragmentation |
| Internet Protocol | IPv4 header는 어떤 정보를 담고 왜 필요한가? | IPv4, header, address, TTL, Type of Service, checksum, ICMP |
| IPv6 | IPv4의 한계를 어떻게 고치려 했는가? | IPv6, 128-bit address, extension header, flow label, anycast |
| VPN and IP Security | public internet 위에서 private network와 security를 어떻게 제공하는가? | VPN, IPSec, AH, ESP, tunnel |

## 세부 정리

### 18.1 Basic Protocol Functions

Protocol은 단순히 “형식 약속”이 아니라, 양 끝 entity가 데이터를 주고받기 위해 필요한 기능 묶음이다. 모든 protocol이 모든 기능을 갖지는 않는다. 같은 기능이 여러 layer에 중복되어 나타나는 경우도 많다. 예를 들어 error control은 data link layer에서 hop 단위로 필요하고, transport layer에서 end-to-end 복구를 위해 다시 필요할 수 있다.

#### Encapsulation

대부분의 protocol은 데이터를 block 단위인 `PDU (Protocol Data Unit)`로 전송한다. PDU는 user data만 담는 것이 아니라 control information을 함께 담는다. 어떤 PDU는 control information만 있고 data가 없을 수도 있다.

| Control information | 역할 |
|---|---|
| `Address` | sender 또는 receiver를 식별한다. |
| `Error-detecting code` | frame check sequence, checksum, CRC처럼 오류 검출에 사용된다. |
| `Protocol control` | flow control, sequencing, fragmentation 같은 protocol 기능 수행에 필요한 정보다. |

`Encapsulation`은 entity가 받은 data에 header, 때로는 trailer를 붙여 PDU로 만드는 과정이다. 예를 들어 upper-layer data가 TCP segment가 되고, 다시 IP datagram이 되고, 다시 data-link frame이 되는 식으로 각 layer가 자기 control information을 덧붙인다. 이 장의 뒤쪽 IPv4/IPv6 header 설명은 encapsulation이 실제 packet format에 어떻게 박히는지를 보여준다.

#### Fragmentation and Reassembly

`Fragmentation`은 higher layer에서 받은 큰 block을 lower-level network가 처리할 수 있는 더 작은 PDU들로 나누는 과정이다. OSI 계열 문헌에서는 `segmentation`이라는 말을 쓰기도 하지만, TCP/IP specification에서는 보통 `fragmentation`이라고 부른다.

Fragmentation이 필요한 이유는 하나가 아니다.

| 이유 | 설명 |
|---|---|
| network maximum block size | ATM cell은 53 octets, Ethernet frame은 최대 크기가 제한되는 것처럼 network마다 수용 가능한 block size가 다르다. |
| error control efficiency | 작은 PDU는 오류가 났을 때 재전송해야 할 bit 수가 적다. |
| shared medium fairness | 너무 큰 PDU를 허용하면 한 station이 multipoint medium을 오래 점유할 수 있다. |
| receiver buffer | 작은 PDU는 receiver가 필요한 buffer를 줄일 수 있다. |
| checkpoint/restart | data transfer가 일정 단위로 closure를 갖게 되어 recovery가 쉬워질 수 있다. |

하지만 PDU를 너무 작게 만들면 header/control overhead 비율이 커지고, PDU마다 interrupt와 processing이 발생해 처리 비용이 늘어난다. 따라서 protocol designer는 maximum/minimum PDU size를 정할 때 reliability, fairness, buffer, overhead, processing cost를 함께 본다. `Reassembly`는 이 조각들을 application이 이해할 수 있는 message로 다시 맞추는 과정이며, fragment가 out of order로 도착하면 더 복잡해진다.

#### Connection Control

Data transfer 방식은 크게 `connectionless data transfer`와 `connection-oriented data transfer`로 나뉜다. Connectionless 방식에서는 각 PDU가 독립적으로 취급된다. Chapter 10의 `datagram` operation이 예다. 반대로 connection-oriented 방식에서는 두 entity 사이에 logical association, 즉 `connection`을 먼저 만들고 그 connection 상태를 바탕으로 데이터를 주고받는다. Chapter 10의 `virtual circuit`이 대표 예다.

![Figure 18.1](@/assets/images/data-communication-235-figure-18-1-page-579.png)
*Figure 18.1 · PDF p. 579 · connection establishment, data transfer, connection termination의 세 단계*

Figure 18.1처럼 connection-oriented transfer는 보통 세 phase로 구성된다.

| Phase | 의미 |
|---|---|
| `Connection establishment` | 한 entity가 connection request를 보내고 상대가 accept/reject한다. 복잡한 protocol에서는 PDU size, option, timing, syntax/semantics를 negotiation한다. |
| `Data transfer` | data와 control information을 주고받는다. flow control, error control, ACK 등이 이 단계에서 동작한다. |
| `Connection termination` | 한쪽이 terminate request를 보내거나, 중앙 authority가 강제로 connection을 끝낼 수 있다. |

Connection-oriented protocol의 중요한 특징은 `sequencing`이다. 각 side가 자신이 보내는 PDU에 sequential number를 붙이고, outgoing/incoming number를 추적한다. Sequencing은 ordered delivery, flow control, error control을 지원한다. 다만 frame relay나 ATM처럼 connection-oriented이면서도 sequencing을 제공하지 않는 예도 있다. 이 경우에도 PDU format에는 connection을 식별하는 `connection identifier`가 필요하다.

#### Ordered Delivery

서로 다른 host가 network를 통해 통신할 때 PDU들은 서로 다른 path를 지나 out of order로 도착할 수 있다. File transfer처럼 record 순서가 중요한 응용에서는 receiver가 원래 순서를 복구해야 한다. 가장 단순한 방법은 PDU마다 sequence number를 붙이는 것이다.

주의할 점은 sequence number field가 유한하다는 것이다. Sequence number는 modulo 방식으로 반복되므로, maximum sequence number는 한 시점에 outstanding 상태일 수 있는 PDU 수보다 커야 한다. `selective-repeat ARQ` 같은 경우에는 ambiguity를 피하려고 최대 outstanding PDU 수의 두 배 수준까지 고려해야 한다.

#### Flow Control

`Flow control`은 receiving entity가 transmitting entity의 전송량 또는 전송 속도를 제한하는 기능이다. 가장 단순한 방식은 `stop-and-wait`처럼 PDU 하나마다 ACK를 기다리는 것이다. 더 효율적인 방식은 transmitter에게 ACK 없이 보낼 수 있는 양인 `credit`을 주는 방식이며, HDLC의 `sliding-window`가 예다.

![Figure 18.2](@/assets/images/data-communication-236-figure-18-2-page-581.png)
*Figure 18.2 · PDF p. 581 · TCP/IP architecture에서 application, TCP, IP, network access protocol이 각기 다른 주소와 logical connection을 갖는 모습*

Figure 18.2는 flow control이 한 layer에만 있는 기능이 아님을 보여준다. Network는 host A에 대해 traffic control을 위해 flow control을 행사할 수 있고, host B의 network access module은 finite buffer 때문에 transport protocol 차원의 flow control이 필요할 수 있으며, B의 application도 disk access 대기 등으로 overflow될 수 있어 application-oriented protocol 차원의 flow control이 필요할 수 있다.

#### Error Control

`Error control`은 data/control information의 loss 또는 damage에 대비하는 기능이다. 전형적으로 두 부분으로 나뉜다.

| 기능 | 의미 |
|---|---|
| `Error detection` | sender가 PDU bit들에 대한 error-detecting code를 넣고, receiver가 이를 검사한다. 오류가 감지되면 PDU를 discard한다. |
| `Retransmission` | sender가 적절한 시간 안에 ACK를 받지 못하면 PDU가 손실/손상되었다고 보고 다시 보낸다. |

일부 protocol은 `error correction code`를 사용해 receiver가 오류를 감지할 뿐 아니라 일정 범위까지 수정할 수 있게 한다. 하지만 internet 전체 관점에서는 hop 단위 error control만으로 충분하지 않다. Network access protocol이 station-network 사이 교환을 보호하더라도 packet이 network 내부에서 사라질 수 있으므로, transport protocol이 end-to-end loss recovery를 담당해야 한다.

#### Addressing

Addressing은 단순히 “IP 주소 하나”가 아니다. 통신 구조 안에서 무엇을 식별하느냐에 따라 여러 층위가 있다.

| Addressing issue | 의미 |
|---|---|
| `Addressing level` | architecture의 어느 level entity를 이름 붙이는가 |
| `Addressing scope` | address가 local 범위인지 global 범위인지 |
| `Connection identifiers` | connection-oriented transfer에서 data phase 동안 global address 대신 connection ID를 쓸 수 있는가 |
| `Addressing mode` | unicast, multicast, broadcast처럼 destination 집합을 어떻게 지정하는가 |

`Addressing level`에서 network-level address는 end system과 intermediate system을 식별하고 routing에 쓰인다. TCP/IP에서는 이것이 `IP address` 또는 `internet address`이고, OSI에서는 `NSAP (Network Service Access Point)`다. Data가 destination system에 도착하면 다시 process/application으로 전달되어야 하므로 TCP/IP의 `port`, OSI의 `SAP (Service Access Point)` 같은 상위 식별자가 필요하다.

`Addressing scope`에서 global address는 두 성질을 가져야 한다. 첫째, `global nonambiguity`로 하나의 global address가 unique system을 식별해야 한다. 같은 system이 여러 global address를 갖는 synonym은 허용된다. 둘째, `global applicability`로 어느 global address에서도 다른 system의 global address를 식별할 수 있어야 한다. 이런 성질 때문에 internet은 임의의 network에 붙은 system에서 다른 network의 system으로 routing할 수 있다.

Network-level global address와 별개로 각 network 안에서는 interface를 식별하는 `network attachment point address`가 필요하다. IEEE 802 network의 `MAC address`, ATM host address가 예다. Port/SAP는 global하게 unique할 필요는 없고 해당 system 내부에서만 unique하면 된다. 예를 들어 host A의 port 1과 host B의 port 1은 각각 A.1, B.1로 구분된다.

`Connection identifier`는 connection-oriented transfer에서 overhead와 routing state를 줄인다. Connection setup 때는 destination global address를 쓰지만, connection이 수락된 뒤에는 짧은 number인 connection identifier로 future PDU를 식별할 수 있다. 장점은 다음과 같다.

| 장점 | 설명 |
|---|---|
| Reduced overhead | global address보다 짧은 identifier를 data phase에 사용한다. Frame relay의 `DLCI`가 예다. |
| Routing | connection setup 때 fixed route를 정해 두고, intermediate system이 connection ID로 route를 찾는다. |
| Multiplexing | 한 entity가 동시에 여러 connection을 유지할 때 incoming PDU를 구분한다. |
| State information | sequence number 기반 flow/error control처럼 connection state를 유지할 수 있다. |

`Addressing mode`는 destination 수에 관한 구분이다.

| Mode | 의미 |
|---|---|
| `Unicast` | 단일 system 또는 port로 전송 |
| `Multicast` | 특정 subset/group으로 전송 |
| `Broadcast` | 어떤 domain 안의 모든 entity로 전송 |

#### Multiplexing

`Multiplexing`은 여러 상위 connection이나 data stream을 하나의 하위 connection/interface 위에 실어 보내거나, 반대로 하나의 상위 connection을 여러 하위 connection으로 나누는 기능이다.

| 방향 | 다른 이름 | 의미 | 사용 이유 |
|---|---|---|---|
| `Upward multiplexing` | inward multiplexing | 여러 higher-level connection이 하나의 lower-level connection을 공유 | lower-level service를 효율적으로 사용하거나 lower-level connection이 하나뿐인 환경을 활용 |
| `Downward multiplexing` | splitting | 하나의 higher-level connection traffic을 여러 lower-level connection에 나눔 | reliability, performance, efficiency 개선 |

Port name도 multiplexing을 가능하게 한다. 하나의 host에 여러 TCP connection이 동시에 terminates될 수 있고, 각 connection은 서로 다른 port pair로 구분된다.

#### Transmission Services

Protocol은 기본 data transfer 외에도 추가 서비스를 제공할 수 있다.

| Service | 의미 |
|---|---|
| `Priority` | terminate-connection request 같은 control message나 특정 connection에 높은 우선순위를 부여한다. |
| `Quality of Service (QoS)` | 특정 class의 data가 minimum throughput 또는 maximum delay threshold를 요구할 수 있다. |
| `Security` | access restriction, confidentiality 같은 보호 메커니즘을 제공한다. |

이런 서비스는 protocol만으로 공중에 생기지 않는다. Underlying transmission system과 intervening lower-level entities가 실제로 지원할 수 있어야 상위 protocol이 그 기능을 행사할 수 있다.

### 18.2 Principles of Internetworking

하나의 network만으로는 사용자가 원하는 모든 resource에 접근하기 어렵다. 그렇다고 서로 다른 network들을 하나의 거대한 단일 network로 합치는 것은 현실적이지 않다. 각 network는 addressing, maximum packet size, access mechanism, timeout, routing, access control이 서로 다를 수 있기 때문이다. `Internetworking`은 이런 network들의 정체성을 유지하면서, 서로 다른 network에 붙은 end system들이 통신할 수 있게 하는 방법이다.

#### Internetworking Terms

| 용어 | 의미 |
|---|---|
| `Communication Network` | network에 붙은 device들 사이 data transfer service를 제공하는 시설 |
| `Internet` | 여러 communication network가 bridge 또는 router로 상호 연결된 집합 |
| `Intranet` | 한 조직 내부에서 Internet application, 특히 World Wide Web을 제공하는 organization-local internet |
| `Subnetwork` | internet을 구성하는 개별 network. 사용자 관점의 “하나의 큰 network”와 구분하기 위해 쓰는 말 |
| `End System (ES)` | end-user application 또는 service를 지원하는, network에 붙은 device |
| `Intermediate System (IS)` | 서로 다른 network에 붙은 end system 간 통신을 위해 network들을 연결하는 device |
| `Bridge` | 유사한 LAN protocol을 쓰는 두 LAN을 연결하는 layer 2 IS. packet 내용을 바꾸거나 새 정보를 추가하지 않고 frame relay/filter 역할을 한다. |
| `Router` | 같거나 다른 network를 연결하는 layer 3 IS. router와 end system 모두에 존재하는 internet protocol을 사용한다. |

Bridge와 router의 핵심 차이는 internetworking logic이 위치하는 layer다. `Bridge`는 OSI layer 2에서 frame을 relay하고, 상위 protocol이 동일하다고 가정한다. `Router`는 OSI layer 3에서 packet을 route하며, 서로 다른 network access technology 위에 공통 internet protocol layer를 얹는다. 이 장의 중심은 connectionless router 기반 internetworking이다.

#### Internetworking Requirements

Internetworking facility가 제공해야 하는 요구사항은 다음과 같다.

| 요구사항 | 의미 |
|---|---|
| Link between networks | 최소한 physical connection과 link control connection이 필요하다. Router는 각 network 쪽 link마다 해당 data link protocol을 사용한다. |
| Routing and delivery | 서로 다른 network의 process들 사이에서 data를 route하고 deliver해야 한다. |
| Accounting/status | 여러 network와 router 사용량을 추적하고 status information을 유지해야 한다. |
| Network transparency | constituent network의 기존 architecture를 바꾸지 않고 동작해야 한다. |

마지막 요구사항이 가장 어렵다. Internetworking은 기존 network를 고치지 않는 대신, 차이를 흡수해야 한다.

| 차이 | internetworking이 처리해야 하는 이유 |
|---|---|
| `Different addressing schemes` | network마다 endpoint name/address/directory 방식이 다르므로 global network addressing과 directory service가 필요하다. |
| `Different maximum packet size` | 한 network에서 허용된 packet이 다른 network에서는 너무 클 수 있어 fragmentation이 필요하다. |
| `Different network access mechanisms` | 예를 들어 한쪽은 frame relay, 다른 쪽은 Ethernet일 수 있다. |
| `Different timeouts` | 여러 network를 지나는 전송은 더 오래 걸릴 수 있으므로 불필요한 retransmission을 피해야 한다. |
| `Error recovery` | 개별 network의 recovery 능력은 다양하다. Internetwork service는 특정 network의 error recovery에 의존하거나 방해받지 않아야 한다. |
| `Status reporting` | network마다 상태와 성능 보고 방식이 달라도 authorized process에게 internetwork activity 정보를 제공할 수 있어야 한다. |
| `Routing techniques` | 각 network 내부 routing은 고유한 fault detection/congestion control에 의존할 수 있으므로, 전체 route 선택과 조정이 필요하다. |
| `User access control` | 각 network의 access control을 필요할 때 호출하고, 별도 internetwork access control도 필요할 수 있다. |
| `Connection vs connectionless service` | constituent network가 virtual circuit이든 datagram이든, internetwork service는 그 성격에 과도하게 의존하지 않아야 한다. |

`IP`는 이 요구사항 중 일부를 만족한다. 하지만 accounting, directory, access control, detailed status reporting 같은 기능은 IP만으로 끝나지 않고 control/application software가 추가로 필요하다.

#### Connectionless Operation

대부분의 internetworking 구현에서 Internet Protocol level은 `connectionless operation`을 사용한다. 이는 packet-switching network의 `datagram mechanism`과 대응된다. 각 network PDU는 독립적으로 취급되며 source ES에서 destination ES까지 router와 network들을 hop-by-hop으로 지나간다.

Connectionless internetworking의 동작 감각은 다음과 같다.

| 단계 | 의미 |
|---|---|
| Source decision | Source end system A는 각 data unit을 어느 router로 보낼지 결정한다. |
| Hop-by-hop forwarding | Data unit은 router에서 router로 이동한다. |
| Per-router routing decision | 각 router는 data unit마다 next hop을 독립적으로 결정한다. |
| Possible different paths | 같은 source/destination 사이의 data unit들도 서로 다른 route를 탈 수 있다. |

모든 ES와 router는 공통 network-layer protocol인 `Internet Protocol (IP)`을 공유한다. IP 아래에는 특정 network에 접근하기 위한 network access protocol이 필요하다. 따라서 ES/router의 network layer에는 보통 두 sublayer가 있다고 볼 수 있다. 위쪽 sublayer는 internetworking function을 제공하는 IP이고, 아래쪽 sublayer는 Ethernet, frame relay 같은 particular network access function을 제공한다.

### 18.3 Internet Protocol Operation

이 절은 IPv4를 기준으로 설명하지만, 핵심 흐름은 `IPv6` 같은 connectionless Internet Protocol에도 적용된다. IP는 end system 사이에 `connectionless`, 즉 `datagram service`를 제공한다. 장점은 세 가지다. 첫째, IP가 constituent network에 많은 기능을 요구하지 않으므로 다양한 network 위에서 동작한다. 둘째, datagram 방식은 route 변경이 쉬워 failure와 congestion에 robust하다. 셋째, UDP처럼 connectionless transport protocol에 불필요한 virtual-circuit overhead를 강요하지 않는다.

#### IP Datagram Wrapping Across Networks

![Figure 18.3](@/assets/images/data-communication-237-figure-18-3-page-588.png)
*Figure 18.3 · PDF p. 588 · LAN 1, frame relay WAN, LAN 2를 거치며 IP datagram은 유지되고 link-layer wrapper만 바뀌는 예*

Figure 18.3의 예시는 host A가 LAN 1에 있고 host B가 LAN 2에 있으며, 두 LAN 사이가 frame relay WAN으로 연결된 구조다. End system과 router는 모두 공통 `IP`를 구현해야 한다. End system A와 B는 IP 위의 protocol, 예를 들어 `TCP` 또는 `UDP`도 공유한다. 반면 intermediate router는 IP까지만 구현하면 되고, TCP 같은 transport layer까지 알 필요는 없다.

핵심은 `IP header + upper-layer data`로 이루어진 IP datagram은 router를 지나도 논리적으로 유지되고, 각 link/network에 맞는 wrapper만 바뀐다는 점이다.

| 시점 | 구성 | 의미 |
|---|---|---|
| `t1` | `IP-H + TCP-H + Data` | A의 IP가 upper-layer block에 IP header를 붙여 datagram을 만든다. |
| `t2-t3` | `MAC1-H + LLC1-H + IP-H + TCP-H + Data + MAC1-T` | LAN 1으로 보내기 위해 LLC/MAC header/trailer로 감싼다. MAC destination은 router X다. |
| `t6` | `IP-H + TCP-H + Data` | Router X가 LAN wrapper를 벗기고 IP header를 읽어 ultimate destination B를 확인한다. |
| `t8-t9` | `FR-H + IP-H + TCP-H + Data + FR-T` | Router X가 frame relay header/trailer로 다시 감싸 WAN을 통해 router Y로 보낸다. |
| `t12-t13` | `MAC2-H + LLC2-H + IP-H + TCP-H + Data + MAC2-T` | Router Y가 LAN 2 wrapper로 감싸 B에게 보낸다. |

이 예에서 source A의 IP module은 destination B가 자기 network에 없다는 것을 알고 router X를 next hop으로 선택한다. 이때 IP datagram 안의 destination은 B의 global internet address이지만, LAN 1의 MAC header에 들어가는 destination은 router X의 MAC-level address다. 즉 “IP destination”과 “현재 link의 next-hop address”는 다르다.

Router가 IP datagram을 받으면 lower-layer fields를 제거하고 IP header를 분석한다. 그 다음 세 가지 가능성이 있다.

| Router decision | 동작 |
|---|---|
| Destination이 직접 연결된 network에 있음 | datagram을 해당 destination에게 직접 보낸다. |
| 추가 router를 지나야 함 | routing table을 보고 next router를 선택한다. |
| destination address를 모름 | source에게 error message를 돌려보낸다. |

#### Unreliable IP Service

IP service는 `unreliable`하다. 이는 무가치하다는 뜻이 아니라, IP가 delivery, ordering, duplication 방지를 보장하지 않는다는 뜻이다. Packet이 queue overflow, lifetime expiration, FCS error, route failure 등으로 사라질 수 있고, successive datagram들이 다른 path를 지나 out of order로 도착할 수도 있다. 이런 오류 복구는 다음 higher layer, 대표적으로 `TCP`, 의 책임이다.

이 설계의 trade-off는 명확하다.

| 얻는 것 | 잃는 것 |
|---|---|
| network 종류에 대한 유연성 | IP 자체는 delivery 보장을 하지 않음 |
| congestion/failure에 대한 route 변경 가능성 | ordering 보장은 higher layer가 해야 함 |
| router 상태 최소화 | end-to-end reliability logic이 transport layer로 올라감 |

#### Design Issues

IP-controlled internet의 설계 이슈는 packet-switching network의 이슈와 닮았다. Router는 packet-switching node처럼 동작하고, intervening network는 transmission link처럼 사용된다.

![Figure 18.4](@/assets/images/data-communication-238-figure-18-4-page-591.png)
*Figure 18.4 · PDF p. 591 · packet-switching node/link와 internet router/network의 대응 관계*

Figure 18.4는 internet을 하나의 packet-switching network처럼 볼 수 있음을 보여준다. Packet-switching network의 node `P1/P2/P3`는 internet의 router `R1/R2/R3`에 대응하고, transmission link `T1/T2/T3`는 internet 안의 network `N1/N2/N3`에 대응한다.

##### Routing

Routing을 위해 각 end system과 router는 destination network마다 “어느 next router로 보낼지”를 담은 `routing table`을 유지한다. Routing table은 `static`일 수도 있고 `dynamic`일 수도 있다. Static table도 alternate route를 가질 수 있지만, dynamic table은 router failure와 congestion에 더 유연하다. Router가 down되면 neighbor가 status report를 보내고, 다른 router/station이 routing table을 update할 수 있다.

Routing table은 단순 shortest path만을 위한 것이 아니다. Security classification이나 priority 같은 internetworking service에도 연결된다. 예를 들어 특정 security level의 data가 그 등급을 처리할 수 없는 network를 지나지 않도록 routing mechanism이 보장해야 할 수 있다.

`Source routing`에서는 source station이 datagram 안에 router들의 sequential list를 넣어 route를 지정한다. `Route recording`에서는 각 router가 자기 internet address를 datagram의 address list에 append한다. Route recording은 test/debugging에 유용하다.

##### Datagram Lifetime

Dynamic routing이나 alternate routing을 쓰면 datagram이 loop에 빠질 수 있다. 영원히 순환하는 datagram은 resource를 낭비하고, transport protocol이 가정하는 maximum datagram lifetime을 깨뜨린다. 그래서 datagram은 lifetime을 가져야 하며, lifetime이 끝나면 discard된다.

Lifetime 구현 방법은 두 가지가 있다.

| 방법 | 의미 | 장단점 |
|---|---|---|
| `Hop count` | router를 지날 때마다 count를 감소 | 단순하고 global clock이 필요 없다. |
| `True time measure` | 실제 시간 기준으로 lifetime 감소 | reassembly algorithm에도 활용 가능하지만 clocking 문제가 있다. |

##### Fragmentation and Reassembly

Internet을 구성하는 network들은 서로 다른 maximum packet size를 가질 수 있다. 모든 network에 uniform packet size를 강제하는 것은 비효율적이므로, router는 outgoing network의 maximum size에 맞게 datagram을 fragment할 수 있다.

Reassembly 위치는 중요한 설계 선택이다.

| 방식 | 장점 | 단점 |
|---|---|---|
| Destination reassembly | router buffer 부담이 없고 dynamic routing을 방해하지 않는다. IP가 택한 방식이다. | fragment가 internet을 지나는 동안 더 작아지기만 하므로 일부 network 효율이 떨어질 수 있다. |
| Intermediate router reassembly | 다음 큰-packet network에서 효율을 회복할 수 있다. | router에 large buffer가 필요하고, 같은 datagram의 모든 fragment가 같은 router를 지나야 해 dynamic routing을 제한한다. |

IP fragmentation에는 header의 다음 정보가 사용된다.

| Field | 의미 |
|---|---|
| `Data Unit Identifier (ID)` | end-system-originated datagram을 식별한다. Source/destination address, generating protocol, protocol-supplied identification 등이 결합된다. |
| `Data Length` | user data field의 길이. IPv4에서는 Total Length에서 header length를 빼 계산한다. IPv6에서는 Payload Length가 대응된다. |
| `Offset` | original datagram의 data field 안에서 fragment data가 시작하는 위치. 64-bit 단위로 표현된다. |
| `More Flag` | 뒤에 fragment가 더 있으면 true, 마지막 fragment면 false다. |

![Figure 18.5](@/assets/images/data-communication-239-figure-18-5-page-594.png)
*Figure 18.5 · PDF p. 594 · TCP segment를 담은 IP datagram이 두 fragment로 나뉘는 예*

Figure 18.5의 original IP datagram은 20-octet IP header, 20-octet TCP header, 384-octet TCP payload를 포함한다. Fragmentation 후 첫 fragment는 TCP header와 payload 일부를 담고, second fragment는 남은 TCP payload만 담는다. 중요한 점은 TCP header가 두 번째 fragment에 복제되지 않는다는 것이다. IP는 payload 내부가 TCP header인지 application data인지 신경 쓰지 않고, IP payload 전체를 opaque byte sequence로 본다.

Fragmentation 절차를 일반화하면 다음과 같다.

1. Incoming datagram의 header fields를 복사해 새 datagram들을 만든다.
2. User data field를 64-bit boundary에 맞춰 나눈다.
3. 첫 fragment의 `Data Length`를 삽입된 data 길이로 설정하고 `More Flag = 1`로 둔다.
4. 뒤 fragment의 `Offset`은 앞 fragment data 길이를 8 octets 단위로 나눈 값만큼 증가시키고, 마지막 fragment의 `More Flag`는 원래 값 또는 false가 된다.

Destination reassembly는 같은 ID를 가진 fragment들의 data fields를 buffer의 올바른 위치에 삽입한다. Offset 0에서 시작해 false More Flag를 가진 마지막 fragment까지 contiguous data가 채워지면 original data field가 복구된다. 만약 하나 이상의 fragment가 도착하지 않으면 buffer를 영원히 붙잡을 수 있으므로, `reassembly lifetime` 또는 datagram lifetime 기반 timeout으로 incomplete reassembly를 포기해야 한다.

##### Error Control and Flow Control

IP internetwork facility는 모든 datagram의 successful delivery를 보장하지 않는다. Router가 datagram을 discard하면 가능할 경우 source에게 정보를 돌려보낸다. Discard 이유는 lifetime expiration, congestion, FCS error 등이 될 수 있다. FCS error처럼 source address field 자체가 손상되었을 가능성이 있으면 notification이 불가능할 수도 있다.

Connectionless IP에서 flow control은 제한적이다. Router나 receiving station이 incoming rate를 제한해야 할 때, 다른 router나 source station에게 reduced data flow를 요청하는 control packet을 보내는 방식이 가능하다. 다음 절의 `ICMP (Internet Control Message Protocol)`가 이런 control reporting의 대표 예다.

### 18.4 Internet Protocol

이 절은 RFC 791로 정의된 `IPv4`를 다룬다. IPv4는 결국 IPv6로 대체되는 방향이지만, TCP/IP network에서 오랫동안 표준 IP로 쓰여 왔다. IP 표준은 두 관점으로 볼 수 있다. 하나는 TCP 같은 higher layer에 어떤 service를 제공하는가이고, 다른 하나는 IP entity 사이에서 실제로 교환되는 datagram format과 mechanism이다.

#### IP Services: Send and Deliver

IP는 next higher layer와의 interface에서 두 service primitive를 제공한다.

| Primitive | 의미 |
|---|---|
| `Send` | higher layer가 IP에게 data unit 전송을 요청한다. |
| `Deliver` | IP가 data unit 도착을 higher layer에 알린다. |

Send/Deliver primitive에서 오가는 parameter는 IP header field와 직접 연결된다.

| Parameter | 의미 |
|---|---|
| `Source address` | sending IP entity의 internetwork address |
| `Destination address` | destination IP entity의 internetwork address |
| `Protocol` | TCP, UDP, ICMP 같은 recipient protocol entity |
| `Type-of-service indicators` | component network를 지날 때 data unit을 어떻게 취급할지 지정 |
| `Identification` | source/destination/protocol과 결합되어 data unit을 unique하게 식별. reassembly와 error reporting에 필요 |
| `Don't fragment identifier` | IP가 delivery를 위해 fragmentation을 해도 되는지 지시 |
| `Time to live` | datagram이 internet 안에 머물 수 있는 시간 |
| `Data length` | 전송되는 data 길이 |
| `Option data` | IP user가 요청한 option |
| `Data` | 전송할 user data |

`Identification`, `Don't fragment identifier`, `Time to live`은 Send primitive에는 있지만 Deliver primitive에는 없다. 이들은 recipient IP user에게 전달할 의미라기보다, IP가 전송 중 처리해야 할 instruction이다.

IP option은 자주 쓰이지 않는 기능과 future extensibility를 위한 공간이다. 원문이 언급하는 options는 다음과 같다.

| Option | 의미 |
|---|---|
| `Security` | datagram에 security label을 붙인다. |
| `Source routing` | datagram이 따라야 할 router address list를 지정한다. Strict source routing은 지정 router만 허용하고, loose source routing은 다른 intermediate router도 허용한다. |
| `Route recording` | datagram이 방문한 router sequence를 기록할 field를 할당한다. |
| `Stream identification` | voice 같은 volatile periodic traffic을 위한 reserved resource를 이름 붙인다. |
| `Timestamping` | source IP entity와 일부/전체 intermediate router가 timestamp를 추가한다. |

#### IPv4 Header

![Figure 18.6](@/assets/images/data-communication-240-figure-18-6-page-597.png)
*Figure 18.6 · PDF p. 597 · IPv4 datagram header field 배치*

IPv4 header는 최소 20 octets이고, option이 붙으면 길어진다. 핵심 field를 기능별로 보면 다음과 같다.

| Field | 크기 | 의미 |
|---|---:|---|
| `Version` | 4 bits | IP version. IPv4에서는 값이 4다. |
| `IHL (Internet Header Length)` | 4 bits | header 길이를 32-bit word 단위로 표시한다. 최소값 5는 20 octets다. |
| `DS/ECN` | 8 bits | 과거 `Type of Service` field. 현재 첫 6 bits는 `DS (Differentiated Services)`, 나머지 2 bits는 `ECN (Explicit Congestion Notification)` 용도다. |
| `Total Length` | 16 bits | header와 data를 포함한 전체 datagram 길이. 단위는 octet이다. |
| `Identification` | 16 bits | source/destination/protocol과 함께 datagram을 식별해 fragmentation/reassembly에 사용된다. |
| `Flags` | 3 bits | `More` bit와 `Don't Fragment` bit가 핵심이다. DF가 set된 datagram이 작은 MTU network를 만나면 discard될 수 있다. |
| `Fragment Offset` | 13 bits | original datagram 안에서 이 fragment가 어디에 속하는지 64-bit 단위로 표시한다. |
| `Time to Live (TTL)` | 8 bits | datagram lifetime. 각 router는 최소 1씩 감소시켜 hop count처럼 동작한다. |
| `Protocol` | 8 bits | destination에서 data field를 받을 next higher protocol. 예: `TCP = 6`, `UDP = 17`, `ICMP = 1`. |
| `Header Checksum` | 16 bits | IP header에만 적용되는 error-detecting code. TTL과 fragmentation field가 변할 수 있어 각 router에서 재검사/재계산된다. |
| `Source Address` | 32 bits | source IP address |
| `Destination Address` | 32 bits | destination IP address |
| `Options` | variable | sender가 요청한 IP option |
| `Padding` | variable | header가 32-bit multiple이 되게 맞춘다. |
| `Data` | variable | upper-layer data. 전체 datagram 최대 길이는 65,535 octets다. |

Header checksum은 header만 보호한다. Router가 TTL을 줄이고 fragmentation-related field를 바꾸면 header checksum도 다시 계산해야 한다. 반대로 TCP/UDP payload의 end-to-end integrity는 transport layer checksum 등 다른 계층의 책임이다.

#### IPv4 Addresses and Classes

IPv4 source/destination address field는 각각 32-bit global internet address다. 전통적인 classful addressing에서는 address가 `network identifier`와 `host identifier`로 나뉜다.

![Figure 18.7](@/assets/images/data-communication-241-figure-18-7-page-599.png)
*Figure 18.7 · PDF p. 599 · Class A/B/C/D/E IPv4 address format*

| Class | leading bits | network/host bit 감각 | 용도 |
|---|---|---|---|
| `Class A` | `0` | network 7 bits, host 24 bits | 적은 수의 network, 각 network에 많은 hosts |
| `Class B` | `10` | network 14 bits, host 16 bits | 중간 수의 network, 중간 수의 hosts |
| `Class C` | `110` | network 21 bits, host 8 bits | 많은 수의 network, 각 network에 적은 hosts |
| `Class D` | `1110` | multicast | multicast address |
| `Class E` | `11110` | future use | reserved/future use |

IPv4 address는 보통 `dotted decimal notation`으로 쓴다. 예를 들어 binary `11000000 11100100 00010001 00111001`은 `192.228.17.57`이다. Class A는 first octet 1-126 범위이고, 0과 127은 reserved다. Class B는 first octet 128-191, Class C는 192-223 범위다.

#### Subnets and Subnet Masks

`Subnet`은 organization 내부 LAN 구조를 internet 전체 routing complexity로부터 숨기기 위해 도입되었다. 외부 internet에서는 한 site가 하나의 network number처럼 보이고, site 내부 router들은 host portion 일부를 `subnet number`로 사용해 여러 LAN을 구분한다.

`Subnet mask`는 IP address의 어느 bit들이 extended network number, 즉 original network number + subnet number인지 표시한다. Host는 mask를 사용해 outgoing datagram의 destination이 같은 LAN에 있는지, 아니면 router로 보내야 하는지 판단한다.

Mask 계산의 본질은 bitwise AND다.

```text
IP address      192.228.17.57    11000000.11100100.00010001.00111001
Subnet mask     255.255.255.224  11111111.11111111.11111111.11100000
AND result      192.228.17.32    11000000.11100100.00010001.00100000
```

결과 `192.228.17.32`는 network/subnet number를 나타내고, 남은 host bits는 subnet 내부 host를 식별한다.

![Figure 18.8](@/assets/images/data-communication-242-figure-18-8-page-601.png)
*Figure 18.8 · PDF p. 601 · Class C address 192.228.17.x를 subnet mask로 LAN X/Y/Z에 나누는 예*

Figure 18.8에서 외부 internet은 local complex 전체를 `192.228.17.x` 하나의 Class C network로 본다. 내부에서는 mask `255.255.255.224`를 사용해 LAN X, Y, Z를 subnet 1/2/3으로 구분한다. 예를 들어 `192.228.17.57`에 mask를 적용하면 subnet 1, 즉 LAN X임을 알 수 있고, router는 그 datagram을 LAN X로 forward한다. Default subnet mask는 subnetting을 하지 않는 null mask와 같아 classful network/host 구분만 남긴다.

#### Internet Control Message Protocol (ICMP)

`ICMP (Internet Control Message Protocol)`는 IP 구현이 반드시 함께 구현해야 하는 control protocol이다. ICMP는 router나 host가 communication environment의 문제를 host에게 알려주는 feedback mechanism이다. 예를 들어 destination에 도달할 수 없거나, router buffer가 부족하거나, 더 짧은 route가 있음을 알릴 때 사용된다.

ICMP는 TCP/IP architecture에서 IP와 같은 level처럼 보이지만 실제로는 IP의 user다. ICMP message가 만들어지면 IP로 내려가 IP header로 encapsulation되고, 일반 IP datagram처럼 전송된다. 따라서 ICMP message의 delivery도 보장되지 않는다.

![Figure 18.9](@/assets/images/data-communication-243-figure-18-9-page-602.png)
*Figure 18.9 · PDF p. 602 · destination unreachable, redirect, echo, timestamp 등 ICMP message format*

ICMP message는 64-bit 기본 header로 시작한다.

| Field | 의미 |
|---|---|
| `Type` | ICMP message 종류 |
| `Code` | type 내부의 세부 parameter |
| `Checksum` | ICMP message 전체에 대한 checksum. IP checksum과 같은 algorithm 사용 |
| `Parameters` | 더 긴 parameter를 담는 32-bit 영역 |

ICMP가 이전 datagram에 대한 응답일 때는 original datagram의 전체 IP header와 data field의 first 64 bits를 포함한다. 이 64 bits에는 보통 TCP header나 다른 transport header 일부가 들어 있어 source host가 “어떤 upper-level protocol/connection과 관련된 오류인지”를 식별할 수 있다.

주요 ICMP message는 다음과 같다.

| Message | 언제 쓰는가 |
|---|---|
| `Destination unreachable` | router가 destination network를 모르거나, host/service/SAP가 unreachable이거나, source route가 usable하지 않거나, DF bit 때문에 fragmentation이 불가능할 때 |
| `Time exceeded` | router에서 datagram lifetime이 끝났거나, host가 reassembly timeout을 맞았을 때 |
| `Parameter problem` | IP header option argument 등 syntactic/semantic error가 있을 때. Parameter field가 오류 octet을 가리킨다. |
| `Source quench` | router/host가 source에게 전송 rate를 줄이라고 요청하는 rudimentary flow control |
| `Redirect` | 직접 연결된 host에게 더 나은 next router를 알려준다. Original datagram은 계속 forward된다. |
| `Echo / Echo reply` | entity 간 통신 가능성을 test한다. Identifier와 sequence number로 request/reply를 match한다. |
| `Timestamp / Timestamp reply` | originate/receive/transmit timestamp로 delay characteristic을 sampling한다. Strict source routing과 함께 특정 route delay를 측정할 수 있다. |
| `Address mask request/reply` | subnet 환경에서 host가 자기 LAN의 address mask를 알아내도록 한다. |

#### Address Resolution Protocol (ARP)

IP datagram을 실제 LAN 위에서 보내려면 `IP address`를 해당 subnetwork의 physical address, 예를 들어 Ethernet `MAC address`, 로 바꿔야 한다. 이 mapping은 마지막 hop의 router가 수행할 수도 있고, 같은 subnetwork 안 host-to-host 통신이면 source host가 수행한다.

IP-to-subnetwork address mapping 방법에는 local table, address embedding, centralized directory, address resolution protocol이 있다. LAN에서는 `ARP (Address Resolution Protocol, RFC 826)`가 단순하고 적합하다. ARP는 broadcast LAN의 성질, 즉 한 device의 transmission을 LAN의 다른 device들이 모두 들을 수 있다는 점을 사용한다.

ARP 동작은 다음과 같다.

1. 각 system은 알려진 IP-subnetwork address mapping table을 유지한다.
2. 필요한 IP address의 subnetwork address가 table에 없으면, system은 LAN protocol 위에서 ARP request를 broadcast한다.
3. 같은 subnetwork의 host들은 ARP message를 듣고, 자기 IP와 일치하면 IP address와 subnetwork address를 담은 reply를 보낸다.
4. Request에는 requester의 IP address와 subnetwork address도 들어 있으므로, 다른 host들이 이를 local table에 cache할 수 있다.
5. ARP message는 자기 IP/subnetwork address를 LAN에 알리는 용도로도 쓰일 수 있다.

정리하면 IP는 global addressing과 datagram forwarding을 담당하지만, 마지막 link에서 실제 frame을 만들려면 local subnetwork address가 필요하다. `ARP`는 그 둘 사이를 연결하는 glue protocol이다.

### 18.5 IPv6

`IPv6 (IP version 6)`는 IPv4를 궁극적으로 대체하기 위해 정의된 next-generation IP다. 가장 직접적인 동기는 IPv4의 32-bit address space 한계지만, 단순히 address 길이만 늘린 것은 아니다. Address autoconfiguration, routing flexibility, traffic support, security extension을 수용할 수 있도록 header 구조도 재설계되었다.

#### 왜 IPv6가 필요한가

IPv4는 원칙적으로 `2^32`개의 address, 즉 40억 개 이상을 제공한다. 하지만 실제로는 다음 이유 때문에 부족해졌다.

| 이유 | 설명 |
|---|---|
| Two-level structure waste | network number가 한 network에 할당되면, 그 network의 host-number space가 sparsely used되어도 address space는 사실상 점유된다. |
| Unique network number requirement | Internet에 실제 연결되지 않은 IP network에도 unique network number가 필요한 경우가 많다. |
| Network proliferation | organization이 여러 LAN과 wireless network를 가지며 network 수가 급증했다. |
| TCP/IP expansion | POS terminal, cable TV receiver 같은 새 영역으로 TCP/IP 사용이 확장되면 unique IP address 수요가 늘어난다. |
| Multiple IP addresses per host | host 하나에 여러 IP address를 줄 수 있는 유연한 모델은 address 수요를 더 키운다. |

IPv6의 주요 개선점은 다음과 같다.

| Enhancement | 의미 |
|---|---|
| `Expanded address space` | 32-bit 대신 128-bit address를 사용한다. Address space 증가량은 `2^96` 배다. |
| `Improved option mechanism` | option을 기본 header에 계속 붙이지 않고 separate extension header로 분리한다. 대부분의 optional header는 중간 router가 처리하지 않아 router processing이 단순해진다. |
| `Address autoconfiguration` | IPv6 address를 dynamic assignment할 수 있다. |
| `Increased addressing flexibility` | `anycast` address를 도입하고 multicast address에 scope field를 둬 multicast routing scalability를 높인다. |
| `Support for resource allocation` | 특정 traffic flow에 속한 packet을 labeling해 real-time video 같은 traffic의 special handling을 지원한다. |

#### IPv6 Packet Structure

IPv6 PDU는 `packet`이라고 부른다. 기본 구조는 mandatory `IPv6 header` 뒤에 0개 이상의 `extension header`, 그리고 transport-level PDU가 이어지는 형태다.

```text
IPv6 header (40 octets)
    -> Extension header
    -> ...
    -> Extension header
    -> Transport-level PDU
```

![Figure 18.10](@/assets/images/data-communication-244-figure-18-10-page-608.png)
*Figure 18.10 · PDF p. 608 · IPv6 mandatory header와 extension header chain 뒤에 TCP segment가 이어지는 예*

Figure 18.10은 IPv6 header와 extension header들이 `Next Header` field로 chain을 이루는 모습을 보여준다. 각 header의 Next Header는 바로 다음 header type을 식별한다. 다음 header가 extension header이면 그 extension type을 나타내고, extension header가 더 없으면 TCP/UDP 같은 upper-layer protocol identifier를 담는다. 이 값들은 IPv4의 `Protocol` field와 같은 identifier space를 사용한다.

정의된 extension header는 다음과 같다.

| Extension header | 역할 |
|---|---|
| `Hop-by-Hop Options header` | path의 모든 router가 검사해야 하는 special option |
| `Routing header` | IPv4 source routing과 유사한 extended routing |
| `Fragment header` | fragmentation/reassembly information |
| `Authentication header` | packet integrity와 authentication |
| `Encapsulating Security Payload header` | privacy/confidentiality |
| `Destination Options header` | destination node가 검사할 optional information |

여러 extension header를 함께 쓸 때 IPv6가 권장하는 순서는 다음과 같다.

1. `IPv6 header`
2. `Hop-by-Hop Options header`
3. `Destination Options header`, Routing header에 나열된 중간 destination까지 처리할 option
4. `Routing header`
5. `Fragment header`
6. `Authentication header`
7. `Encapsulating Security Payload header`
8. `Destination Options header`, final destination만 처리할 option

#### IPv6 Header

![Figure 18.11](@/assets/images/data-communication-245-figure-18-11-page-609.png)
*Figure 18.11 · PDF p. 609 · 고정 길이 40-octet IPv6 header field*

IPv6 header는 고정 길이 40 octets다. IPv4 mandatory header의 20 octets보다 길지만 field 수는 더 적다. 이 때문에 router가 기본 header를 처리하는 부담은 오히려 줄어든다.

| Field | 크기 | 의미 |
|---|---:|---|
| `Version` | 4 bits | IP version. IPv6에서는 값이 6이다. |
| `DS/ECN` | 8 bits | differentiated services와 congestion function을 위해 사용된다. IPv4 DS/ECN과 같은 취지다. |
| `Flow Label` | 20 bits | router의 special handling을 요청하는 packet flow를 labeling한다. |
| `Payload Length` | 16 bits | IPv6 header 뒤에 오는 extension headers + transport-level PDU의 길이. |
| `Next Header` | 8 bits | IPv6 header 다음에 오는 extension header 또는 TCP/UDP 같은 higher-layer header type |
| `Hop Limit` | 8 bits | 허용되는 남은 hop 수. source가 설정하고 forwarding node마다 1씩 감소한다. 0이 되면 discard된다. |
| `Source Address` | 128 bits | packet originator address |
| `Destination Address` | 128 bits | intended recipient address. Routing header가 있으면 ultimate destination이 아닐 수 있다. |

`Hop Limit`은 IPv4 TTL의 현실적 동작을 단순화한 것이다. IPv4 TTL은 초 단위 lifetime처럼 정의되었지만 실제 router들은 보통 hop count처럼 처리했다. IPv6는 이 관행을 명시적으로 반영한다.

#### Flow Label

`Flow`는 특정 source에서 특정 unicast/anycast/multicast destination으로 가는 packet sequence 중, source가 router에게 special handling을 요청하는 단위다. Flow는 `source address + destination address + nonzero 20-bit Flow Label` 조합으로 unique하게 식별된다.

Source 관점에서 flow는 같은 transfer requirement를 갖는 application instance의 packet sequence일 수 있다. 예를 들어 file transfer application은 control connection과 여러 data connection을 하나의 flow로 묶을 수도 있고, multimedia conferencing은 audio와 graphic windows를 서로 다른 flow로 나눌 수도 있다.

Router 관점에서 flow는 path, resource allocation, discard requirement, accounting, security attribute처럼 forwarding 처리에 영향을 주는 속성을 공유하는 packet sequence다. Router는 flow에 따라 buffer size, forwarding precedence, requested QoS를 다르게 줄 수 있다.

Flow Label 자체에는 특별한 의미가 들어 있지 않다. Special handling 요구사항은 별도 control protocol이나 extension header 등을 통해 미리 선언되고, router는 flow label을 lookup key로 사용한다. 그래서 flow label은 가능한 균등하게 분포하도록 pseudo-random하게 선택되어야 한다. Hash table 기반 router lookup에서 collision과 processing burden을 줄이기 위해서다.

Flow Label 규칙의 핵심은 다음과 같다.

| 규칙 | 의미 |
|---|---|
| 미지원 node | originate 시 0으로 set, forwarding 시 unchanged, receive 시 ignore |
| 같은 nonzero flow label | 같은 source/destination, 같은 Hop-by-Hop Options header 내용, 같은 Routing header 내용을 가져야 한다. |
| label 선택 | source가 1부터 `2^20 - 1` 사이에서 pseudo-random/uniform하게 선택하며, active flow lifetime 동안 reuse하지 않는다. |
| zero label | flow label을 사용하지 않음을 의미한다. |

#### IPv6 Addresses

IPv6 address는 128 bits이고, node 자체가 아니라 node의 individual interface에 할당된다. 하나의 interface는 여러 unique unicast address를 가질 수 있다. 이 구조는 address aggregation을 통해 routing table을 줄이고 lookup을 빠르게 하는 데 도움이 된다. 예를 들어 network, access provider, geography, corporation 계층별로 address를 aggregate할 수 있다.

IPv6의 address type은 세 가지다.

| Type | 의미 |
|---|---|
| `Unicast` | 단일 interface 식별. Packet은 그 interface로 전달된다. |
| `Anycast` | 여러 interface 집합 식별. Packet은 routing metric상 nearest interface 하나로 전달된다. |
| `Multicast` | 여러 interface 집합 식별. Packet은 해당 집합의 모든 interface로 전달된다. |

IPv6에서 `node`는 IPv6를 구현한 모든 device, 즉 host와 router를 포함한다.

#### IPv6 Extension Headers

![Figure 18.12](@/assets/images/data-communication-246-figure-18-12-page-612.png)
*Figure 18.12 · PDF p. 612 · Hop-by-Hop/Destination Options, Fragment, Routing extension header 형식*

`Hop-by-Hop Options header`는 path상의 모든 router가 검사해야 하는 optional information을 담는다. 기본 field는 `Next Header`, `Header Extension Length`, 그리고 하나 이상의 option definitions다. Option Type의 high-order bits는 unknown option을 만났을 때의 action을 지정한다. 예를 들어 skip, discard, ICMP Parameter Problem 전송 여부 등이 option type 자체에 encode된다. 또 하나의 bit는 Option Data가 source-to-destination path에서 변할 수 있는지 표시한다. 변할 수 있는 data는 authentication calculation에서 제외해야 한다.

Hop-by-Hop option의 예는 다음과 같다.

| Option | 의미 |
|---|---|
| `Pad1`, `PadN` | header 길이를 8-byte multiple로 맞추는 padding |
| `Jumbo payload` | 65,535 octets를 넘는 payload를 보내기 위한 option. Payload Length는 0으로 두고, Fragment header는 없어야 한다. |
| `Router alert` | 중간 router가 이 packet 내부 control data를 검사해야 함을 알린다. RSVP 같은 traffic-control protocol 지원에 유용하다. |

`Fragment header`는 IPv6 fragmentation 정보를 담지만, IPv4와 큰 차이가 있다. IPv6에서는 router가 fragmentation을 수행하지 않는다. Fragmentation은 source node만 수행한다. Source node는 path discovery algorithm으로 path상의 smallest MTU를 알아내고, 필요하면 destination별로 미리 fragment한다. 그렇지 않으면 모든 packet을 IPv6 minimum MTU인 1280 octets 이하로 제한해야 한다.

Fragment header field는 다음과 같다.

| Field | 의미 |
|---|---|
| `Next Header` | Fragment header 다음 header type |
| `Fragment Offset` | original packet payload 안의 위치. 64-bit 단위 |
| `M Flag` | 1이면 more fragments, 0이면 last fragment |
| `Identification` | source/destination address와 함께 original packet을 unique하게 식별 |

`Routing header`는 packet이 destination까지 가는 동안 방문해야 할 intermediate nodes list를 담는다. Generic routing header는 `Next Header`, `Header Extension Length`, `Routing Type`, `Segments Left`를 포함한다. `Segments Left`는 final destination 전까지 아직 방문해야 할 explicitly listed intermediate node 수다.

Type 0 Routing header에서는 IPv6 base header의 Destination Address가 ultimate destination이 아닐 수 있다. Source node는 첫 번째로 방문할 router address를 IPv6 header destination에 넣고, ultimate destination은 Routing header의 마지막 address로 둔다. Packet이 IPv6 header의 destination node에 도착하면 해당 node가 Routing header를 보고 다음 address를 IPv6 header로 옮기고 `Segments Left`를 감소시킨 뒤 forwarding한다.

`Destination Options header`는 destination node만 검사하는 optional information을 담는다. Format은 Hop-by-Hop Options header와 같다.

### 18.6 Virtual Private Networks and IP Security

`VPN (Virtual Private Network)`은 상대적으로 안전하지 않은 public network 위에서 encryption과 special protocols를 사용해 private network처럼 동작하게 만든 것이다. 기업 site 내부의 LAN은 network manager가 제어할 수 있지만, site 사이 연결이나 remote worker 접속은 Internet/public WAN을 쓰면 비용과 WAN 관리 부담을 줄일 수 있다. 문제는 public network가 eavesdropping과 unauthorized access의 진입점이 된다는 점이다.

Proprietary security solution만으로는 두 문제가 생긴다. 첫째, closed encryption/authentication scheme이 실제로 얼마나 안전한지 검증하기 어렵다. 둘째, workstation, server, router, firewall 선택이 특정 vendor security facility와의 compatibility에 묶일 수 있다. 이 배경에서 `IPSec (IP Security)` Internet standards가 필요해진다.

#### IPSec의 위치와 목적

IAB의 “Security in the Internet Architecture” 보고서는 Internet에 더 강한 보안이 필요하다는 합의를 정리했고, network infrastructure의 unauthorized monitoring/control 방지와 end-user-to-end-user traffic의 authentication/encryption 필요성을 지적했다. IPv6에는 authentication과 encryption이 필수 보안 기능으로 포함되었고, 이 security capability는 IPv4와 IPv6 양쪽에서 사용할 수 있게 설계되었다. 그래서 vendor들은 IPv4 환경에서도 IPSec 기능을 제공할 수 있다.

IPSec의 중요한 특징은 IP level에서 traffic을 encrypt하거나 authenticate할 수 있다는 점이다. 따라서 remote logon, client/server, e-mail, file transfer, Web access 같은 distributed application을 application별 수정 없이 보호할 수 있다.

#### Applications of IPSec

| Application | 의미 |
|---|---|
| `Secure branch office connectivity` | Internet/public WAN 위에 secure VPN을 만들어 private network 비용과 관리 부담을 줄인다. |
| `Secure remote access` | traveling employee나 telecommuter가 ISP를 통해 company network에 secure access한다. |
| `Extranet/Intranet connectivity with partners` | partner organization과의 통신에 authentication, confidentiality, key exchange를 제공한다. |
| `Electronic commerce security enhancement` | application layer security가 있더라도, network administrator가 지정한 traffic 전체에 encryption/authentication을 추가한다. |

![Figure 18.13](@/assets/images/data-communication-247-figure-18-13-page-617.png)
*Figure 18.13 · PDF p. 617 · LAN 내부는 일반 IP traffic, WAN 구간은 IPSec device가 secure IP payload로 보호하는 시나리오*

Figure 18.13의 전형적인 scenario에서는 각 site LAN 내부의 traffic은 nonsecure IP traffic일 수 있다. Site 밖으로 나가는 traffic은 router/firewall 같은 networking device의 IPSec protocol에 의해 encrypt/compress되고, WAN에서 들어오는 traffic은 decrypt/decompress된다. 이 과정은 LAN의 workstation/server에게 transparent하다. Remote dial-in user처럼 endpoint 자체가 WAN에 접속하는 경우에는 user workstation이 IPSec protocol을 구현해야 한다.

#### Benefits of IPSec

| Benefit | 설명 |
|---|---|
| Perimeter-wide strong security | firewall/router에 IPSec을 구현하면 perimeter를 지나는 모든 traffic에 보안을 적용할 수 있고, 내부 workgroup traffic은 security overhead를 피할 수 있다. |
| Resistant to bypass | 외부 traffic이 반드시 IP와 firewall을 거쳐야 하는 구조라면 IPSec firewall을 우회하기 어렵다. |
| Transport/application transparency | IPSec은 TCP/UDP 아래에 있으므로 application을 수정하지 않아도 된다. End system에 구현해도 upper-layer software에는 보통 영향이 없다. |
| User transparency | 사용자가 보안 메커니즘을 직접 다루거나 per-user keying material을 발급/폐기하지 않아도 되는 구성이 가능하다. |
| Individual user security | off-site worker나 민감한 application을 위한 secure virtual subnetwork 구성에 사용할 수 있다. |

#### IPSec Functions

IPSec은 세 가지 주요 facility를 제공한다.

| Facility | 의미 | VPN에서의 위치 |
|---|---|---|
| `AH (Authentication Header)` | authentication-only function | traffic origin/integrity 확인이 중심일 때 사용 |
| `ESP (Encapsulating Security Payload)` | authentication과 encryption을 결합한 function | VPN에서는 confidentiality와 authentication이 모두 필요하므로 대부분 ESP 사용 가능성이 크다. |
| `Key exchange function` | manual key exchange와 automated key exchange 지원 | endpoint/device 사이 security association을 운영하기 위한 기반 |

VPN에서는 unauthorized user가 private network에 침투하지 못하게 하는 authentication과, Internet eavesdropper가 message를 읽지 못하게 하는 encryption이 모두 중요하다. 그래서 원문은 대부분의 구현이 AH보다 `ESP`를 사용할 가능성이 크다고 설명한다. IPSec의 세부 내용은 Chapter 21에서 이어진다.

## 연결 관계

| 연결 대상 | 이 장과의 관계 |
|---|---|
| Chapter 2 `TCP/IP protocol architecture` | IP가 TCP/UDP와 network access protocol 사이에서 어떤 위치를 차지하는지의 기본 구조를 제공한다. |
| Chapter 7 `Data Link Control` | sequencing, flow control, error control, selective-repeat ARQ 같은 protocol function 이해에 연결된다. |
| Chapter 10 `Circuit Switching and Packet Switching` | datagram service와 virtual circuit service 비교가 IP connectionless operation의 배경이다. |
| Chapter 15-17 LAN/WLAN | MAC address, LAN frame, network access protocol, ARP의 필요성이 LAN/WLAN 구조와 직접 연결된다. |
| Chapter 19 `Internetwork Operation` | routing protocol, differentiated services, RSVP 등 IPv4/IPv6의 routing/QoS field 활용이 이어진다. |
| Chapter 20 `Transport Protocols` | IP의 unreliable service 위에서 TCP가 ordered delivery, reliability, congestion control을 제공한다. |
| Chapter 21 `Network Security` | IPSec, AH, ESP, IPv4/IPv6 security가 더 깊게 다뤄진다. |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| IP가 reliable delivery를 보장한다 | IP는 unreliable datagram service다. Delivery/order/retransmission 보장은 TCP 같은 higher layer 책임이다. |
| Router는 TCP connection을 이해해야 forwarding할 수 있다 | Router는 IP header를 보고 forwarding한다. TCP/UDP header는 end system의 transport layer가 처리한다. |
| IP destination address와 MAC destination address는 항상 같다 | IP destination은 ultimate destination이고, MAC destination은 현재 link의 next hop일 수 있다. |
| Fragment는 router에서 다시 조립된다 | IPv4 IP fragmentation은 destination end system에서 reassembly한다. Router reassembly는 buffer와 routing 유연성 문제 때문에 피한다. |
| IPv4 TTL은 실제 초 단위 시간만 의미한다 | 실제 router 동작에서는 hop count처럼 처리되는 경우가 일반적이고, IPv6는 이를 `Hop Limit`으로 단순화했다. |
| IPv6는 주소만 길어진 IPv4다 | IPv6는 extension header, flow label, anycast, autoconfiguration, source-only fragmentation 등 구조 변화가 크다. |
| ICMP는 reliable control channel이다 | ICMP도 IP datagram 안에 실려 전송되므로 delivery가 보장되지 않는다. |
| ARP는 IP routing protocol이다 | ARP는 IP address를 local subnetwork/MAC address로 mapping하기 위한 LAN-oriented address resolution protocol이다. |
| IPSec은 application security와 같다 | IPSec은 IP layer security다. Application을 고치지 않고도 여러 distributed application traffic을 보호할 수 있다. |

## 면접 질문

1. `Encapsulation`, `fragmentation`, `reassembly`가 각각 어느 문제를 해결하는지 설명하라.
2. Connectionless IP가 robust하고 flexible한 이유와, 그 대가로 higher layer가 떠안는 책임을 설명하라.
3. IP datagram이 LAN-router-WAN-router-LAN을 지날 때 IP header와 link-layer header가 어떻게 달라지는가?
4. IPv4 fragmentation에서 `Identification`, `Fragment Offset`, `More Flag`, `Don't Fragment`가 어떻게 사용되는가?
5. Destination-only reassembly가 router reassembly보다 선호되는 이유를 설명하라.
6. IPv4 header의 `TTL`, `Protocol`, `Header Checksum`, `DS/ECN` field의 역할을 설명하라.
7. Subnet mask가 routing decision에 어떻게 사용되는지 `192.228.17.57`과 `255.255.255.224` 예로 설명하라.
8. ICMP `Destination unreachable`, `Time exceeded`, `Redirect`, `Echo` message의 용도를 구분하라.
9. IPv6의 `Next Header` chain과 extension header가 IPv4 option 방식보다 router processing에 유리한 이유를 설명하라.
10. IPv6에서 router가 fragmentation을 하지 않는 이유와 source node가 해야 하는 일을 설명하라.
11. `Flow Label`이 왜 packet마다 긴 QoS 요구사항을 싣는 방식보다 나은지 설명하라.
12. VPN에서 IPSec `AH`보다 `ESP`가 더 자주 필요해지는 이유를 설명하라.

## 핵심 용어 정리

| 용어 | 의미 |
|---|---|
| `PDU (Protocol Data Unit)` | protocol entity 사이에서 전송되는 data/control information block |
| `Encapsulation` | data에 protocol header/trailer를 붙여 PDU로 만드는 과정 |
| `Fragmentation` | 큰 data unit을 network maximum size에 맞게 작은 fragments로 나누는 과정 |
| `Reassembly` | fragments를 original data unit으로 다시 맞추는 과정 |
| `Connectionless data transfer` | 각 PDU를 독립적으로 route/forward하는 방식 |
| `Connection-oriented data transfer` | logical connection을 설정한 뒤 state를 유지하며 data를 주고받는 방식 |
| `Sequencing` | ordered delivery, flow control, error control을 위해 PDU에 순서 번호를 붙이는 방식 |
| `Flow control` | receiver 또는 network가 transmitter의 전송량/속도를 제한하는 기능 |
| `Error control` | error detection과 retransmission 등을 통해 loss/damage에 대응하는 기능 |
| `Internet` | 여러 communication network가 bridge/router로 연결된 집합 |
| `Subnetwork` | internet을 구성하는 개별 constituent network |
| `End System (ES)` | end-user application/service를 수행하는 host/device |
| `Intermediate System (IS)` | network들을 연결해 end system 간 통신 경로를 제공하는 device |
| `Bridge` | layer 2에서 유사 LAN protocol 사이 frame을 relay/filter하는 IS |
| `Router` | layer 3에서 IP packet을 network 사이에 route하는 IS |
| `IP (Internet Protocol)` | connectionless internetworking을 제공하는 TCP/IP suite의 network-layer protocol |
| `Datagram` | connectionless service에서 독립적으로 취급되는 IP PDU |
| `Routing table` | destination network별 next hop/router 정보를 담는 table |
| `Source routing` | source가 datagram에 route router list를 넣는 방식 |
| `Route recording` | path상의 router들이 자기 address를 datagram에 기록하는 기능 |
| `Datagram lifetime` | loop 방지를 위해 datagram이 internet에 남아 있을 수 있는 한계 |
| `IPv4` | 32-bit address와 variable header/options를 갖는 IP version 4 |
| `IHL` | IPv4 header length를 32-bit word 단위로 나타내는 field |
| `DS/ECN` | differentiated services와 explicit congestion notification을 위한 field |
| `TTL (Time to Live)` | IPv4 datagram lifetime/hop count field |
| `Header Checksum` | IPv4 header만 보호하는 checksum |
| `Subnet` | 하나의 network number 내부를 다시 나눈 local network 단위 |
| `Subnet mask` | IP address에서 network/subnet bits를 식별하는 bit mask |
| `ICMP (Internet Control Message Protocol)` | IP 환경의 오류/상태 feedback message를 전달하는 control protocol |
| `ARP (Address Resolution Protocol)` | IP address를 local subnetwork/MAC address로 mapping하는 protocol |
| `IPv6` | 128-bit address, fixed base header, extension header를 갖는 IP version 6 |
| `Extension header` | IPv6에서 option/security/routing/fragment 기능을 base header 밖에 chain으로 붙이는 header |
| `Next Header` | IPv6 header 또는 extension header 다음에 오는 header type을 식별하는 field |
| `Flow Label` | special handling이 필요한 IPv6 packet flow를 식별하는 20-bit label |
| `Hop Limit` | IPv6에서 남은 forwarding hop 수를 나타내는 field |
| `Anycast` | 여러 interface 중 routing metric상 nearest interface 하나로 전달되는 address type |
| `Multicast` | 여러 interface 모두에게 전달되는 address type |
| `Hop-by-Hop Options header` | 모든 intermediate router가 검사해야 하는 IPv6 extension header |
| `Fragment header` | IPv6 source fragmentation/reassembly 정보를 담는 extension header |
| `Routing header` | packet이 방문해야 할 intermediate node list를 담는 IPv6 extension header |
| `Destination Options header` | destination node가 검사할 option을 담는 IPv6 extension header |
| `VPN (Virtual Private Network)` | public/unsecure network 위에서 encryption과 special protocol로 private network처럼 동작하는 구성 |
| `IPSec` | IP level에서 authentication/encryption/key exchange를 제공하는 Internet security standards |
| `AH (Authentication Header)` | IPSec의 authentication-only function |
| `ESP (Encapsulating Security Payload)` | IPSec의 authentication/encryption 결합 function |
