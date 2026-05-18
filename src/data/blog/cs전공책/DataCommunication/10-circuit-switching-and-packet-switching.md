---
title: "Chapter 10. Circuit Switching and Packet Switching"
order: 10
pubDatetime: 2026-05-18T00:15:00+09:00
modDatetime: 2026-05-18T00:15:00+09:00
description: "Data and Computer Communications 정리: Chapter 10. Circuit Switching and Packet Switching"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 10은 링크 하나를 어떻게 전송하느냐에서 벗어나, 여러 장치를 중간 switching node로 연결하는 wide area network의 기본 설계를 다룬다. 핵심 대비는 **circuit switching**과 **packet switching**이다. Circuit switching은 통신 전에 전용 경로와 자원을 예약해 두고, packet switching은 데이터를 작은 **packet**으로 나누어 네트워크 자원을 통계적으로 공유한다.

이 장의 흐름은 다음과 같다.

| 흐름 | 핵심 질문 | 대표 용어 |
|---|---|---|
| Switched communications networks | 왜 중간 node를 거쳐 가는가? | station, node, link, topology, FDM, TDM |
| Circuit switching | 전용 회선을 만들면 무엇이 좋아지고 무엇이 낭비되는가? | dedicated path, call setup, transparent connection |
| Packet switching | bursty data를 왜 packet으로 나누는가? | packet, datagram, virtual circuit, store-and-forward |
| X.25 | 전통적 packet-switching interface는 어떤 계층 구조였는가? | X.25, LAPB, virtual circuit |
| Frame relay | 왜 X.25의 오버헤드를 줄였는가? | frame relay, LAPF, DLCI |

## 핵심 개념

### Switched Communications Network의 기본 구조

원거리 데이터 전송에서는 모든 station이 서로 직접 연결되기 어렵다. 그래서 station은 가까운 switching node에 붙고, node들이 transmission link로 연결된 **communications network**를 이룬다. 네트워크 안으로 들어온 데이터는 destination에 도착할 때까지 node에서 node로 switching된다.

![Figure 10.1](@/assets/images/data-communication-126-figure-10-1-page-319.png)
*Figure 10.1 · PDF p. 319 · station과 switching node가 중간 경로를 통해 연결되는 단순 switched network*

Figure 10.1에서 station A가 station F로 데이터를 보낼 때, 데이터는 node 4로 들어간 뒤 `4 -> 5 -> 6` 또는 `4 -> 7 -> 6` 같은 경로를 따라 이동할 수 있다. 이 그림에서 중요한 점은 다음 세 가지다.

| 관찰 | 의미 |
|---|---|
| node의 역할 차이 | 어떤 node는 내부 switching만 수행하고, 어떤 node는 station을 수용하면서 switching도 수행한다. |
| link의 성격 차이 | node-station link는 보통 dedicated point-to-point link이고, node-node link는 FDM(Frequency Division Multiplexing) 또는 TDM(Time Division Multiplexing)으로 multiplexing되는 경우가 많다. |
| 완전 연결이 아님 | 모든 node 쌍 사이에 직접 link가 있는 fully connected topology는 보통 비현실적이다. 대신 station 쌍마다 여러 가능한 path를 두어 reliability를 높인다. |

여기서부터 wide area switched network는 두 갈래로 나뉜다. **Circuit switching**은 source와 destination 사이에 하나의 전용 회로처럼 보이는 경로를 먼저 만들고, **packet switching**은 데이터를 packet 단위로 나누어 각 packet을 network node들이 처리하게 한다. 둘의 차이는 “node가 들어온 정보를 다음 link로 넘길 때 어떤 단위와 규칙으로 switching하는가”에서 나온다.

## 세부 정리

### 10.1 Switched Communications Networks

Switched communications network는 content를 해석하는 시스템이 아니라, data를 목적지 방향으로 옮기는 switching facility다. 따라서 node는 애플리케이션 데이터의 의미보다 **routing/switching에 필요한 제어 정보**와 link 상태에 관심을 둔다.

Packet switching은 flexibility, resource sharing, robustness, responsiveness라는 장점을 제공하지만, distributed node들이 네트워크 전체 상태를 완벽히 동시에 알 수 없다는 한계를 가진다. 어떤 link나 node의 상태 변화가 다른 곳에 알려지기까지 delay가 있고, 상태 정보를 퍼뜨리는 데도 overhead가 든다. 이 때문에 packet-switching network는 “완벽한 즉시 최적화”가 아니라, delay와 overhead를 감수하며 동작하는 routing, congestion control, internetworking algorithm 위에 세워진다.

Circuit switching은 public telephone network와 leased line 기반 private network에서 출발했다. voice traffic처럼 일정한 속도로 길게 이어지는 통신에는 자연스럽지만, data traffic처럼 짧고 불규칙한 burst에는 자원 낭비가 생길 수 있다. 반대로 packet switching은 그런 bursty data를 위해 등장했으며, 이 차이가 이후 datagram, virtual circuit, X.25, frame relay까지 이어진다.

### 10.2 Circuit-Switching Networks

**Circuit switching**은 두 station 사이에 전용 communication path를 만든 뒤 데이터를 전송하는 방식이다. 이 path는 여러 network node와 link를 지나가는 connected sequence이며, 각 physical link 안에서는 FDM 또는 TDM으로 나뉜 logical channel 하나가 해당 connection에 예약된다.

동작은 세 단계로 나뉜다.

| 단계 | 핵심 동작 | 중요한 결과 |
|---|---|---|
| Circuit establishment | source가 connection request를 보내고, 각 node가 다음 link/channel을 선택해 end-to-end circuit을 만든다. | data 전송 전에 routing, availability, cost, channel allocation이 끝나야 한다. |
| Data transfer | 설정된 path를 따라 analog 또는 digital signal이 흐른다. 보통 full-duplex connection이다. | circuit이 만들어진 뒤에는 고정 data rate로, node delay가 거의 없이 전송된다. |
| Circuit disconnect | 한쪽 station의 종료 요청 등으로 connection을 끊고, node/link의 dedicated resource를 해제한다. | 예약했던 channel capacity와 internal switching capacity가 다시 사용 가능해진다. |

이 방식의 본질은 “먼저 자원을 잡고, 그 다음 전송한다”는 점이다. 따라서 call setup delay가 있지만, 일단 circuit이 만들어지면 network는 사용자에게 거의 **transparent**하다. 사용자는 중간 node의 존재를 의식하지 않고 direct connection처럼 사용할 수 있다. 반면 connection이 유지되는 동안 data가 흐르지 않아도 channel capacity가 묶이므로, bursty data에는 비효율적이다.

![Figure 10.2](@/assets/images/data-communication-127-figure-10-2-page-321.png)
*Figure 10.2 · PDF p. 321 · public circuit-switching network에서 subscriber loop, office, trunk가 연결되는 예*

Public telephone network는 대표적인 circuit-switching network다. 구성 요소는 네 가지로 압축된다.

| 구성 요소 | 설명 |
|---|---|
| Subscriber | 네트워크에 붙는 장치. 전통적으로 telephone이 많지만 data traffic 비중도 커진다. |
| Subscriber line, subscriber loop, local loop | subscriber와 network 사이의 link. 보통 twisted-pair wire이며 수 km에서 수십 km 수준이다. |
| Exchange | switching center. subscriber를 직접 수용하는 exchange는 **end office**라 부른다. |
| Trunk | exchange 사이의 link. 여러 voice-frequency circuit을 FDM 또는 synchronous TDM으로 싣는다. |

![Figure 10.3](@/assets/images/data-communication-128-figure-10-3-page-322.png)
*Figure 10.3 · PDF p. 322 · 같은 end office 내부 연결과 trunk를 거치는 회선 설정의 차이*

Figure 10.3에서 같은 end office에 붙은 `a-b` 연결은 end office 내부에서 회선을 만들면 된다. 반면 `c-d`처럼 서로 다른 end office에 붙은 subscriber는 `c의 end office -> TDM trunk -> intermediate exchange -> TDM trunk -> d의 end office`처럼 여러 circuit 조각을 이어 하나의 end-to-end circuit을 만든다. 이 “여러 조각을 묶어 하나의 직접 연결처럼 보이게 하는 것”이 circuit switching의 설계 감각이다.

Circuit switching이 voice traffic에 잘 맞는 이유는 voice가 거의 일정한 rate로 흐르고, delay variation이 사람의 대화 품질에 치명적이기 때문이다. 정상적인 대화를 위해서는 transmission delay와 jitter가 작아야 하고, 송신/수신 signal rate가 일정해야 한다. 그래서 회선을 미리 잡아두는 방식이 voice에는 자연스럽다. 다만 digital data 환경에서는 idle time이 길 수 있어 inefficiency가 더 두드러진다.

### 10.3 Circuit-Switching Concepts

Circuit-switching node 하나만 놓고 보면, 여러 attached device 사이에 dedicated path를 만들어 주는 central switching unit이다.

![Figure 10.4](@/assets/images/data-communication-129-figure-10-4-page-323.png)
*Figure 10.4 · PDF p. 323 · circuit-switch node의 digital switch, network interface, control unit*

핵심 구성은 다음과 같다.

| 구성 | 역할 |
|---|---|
| Digital switch | attached device 쌍 사이에 transparent signal path를 제공한다. 보통 full-duplex transmission을 지원해야 한다. |
| Network interface | digital device나 digital telephone을 network에 붙이는 기능과 하드웨어를 제공한다. analog telephone이 붙으면 digital conversion logic도 필요하다. |
| Control unit | connection establishment, connection maintenance, connection teardown을 수행한다. |

Control unit은 단순한 제어 회로가 아니라 connection의 생명주기를 관리한다. 요청을 받고 acknowledge하며, destination이 free인지 확인하고, switch 내부 path를 구성한다. Time division 원리를 쓰는 digital switch에서는 connection이 유지되는 동안 switching element를 계속 조작해야 할 수도 있지만, attached device 입장에서는 bit stream이 투명하게 전달되는 것처럼 보인다.

#### Blocking과 Nonblocking

**Blocking**은 두 station을 연결하고 싶지만 가능한 path가 모두 사용 중이라 연결할 수 없는 상태다. **Blocking network**는 이런 상황이 발생할 수 있는 network이고, **nonblocking network**는 called party가 free이면 가능한 모든 connection request를 받아들일 수 있는 network다.

Voice-only network에서는 blocking 가능성이 어느 정도 허용된다. 대부분의 phone call은 짧고, 모든 전화기가 동시에 통화 중일 가능성은 낮다는 traffic assumption 때문이다. 그러나 data processing device에서는 terminal이 computer에 몇 시간씩 계속 연결될 수 있으므로, nonblocking 또는 nearly nonblocking 구성이 더 중요해진다.

#### Space Division Switching

**Space division switching**은 signal path를 물리적으로 분리된 경로로 만든다. 각 connection은 switch 내부에 endpoint 두 개 사이의 dedicated physical path를 요구하고, 기본 구성 요소는 control unit이 켜고 끄는 metallic crosspoint 또는 semiconductor gate다.

![Figure 10.5](@/assets/images/data-communication-130-figure-10-5-page-325.png)
*Figure 10.5 · PDF p. 325 · single-stage crossbar matrix 형태의 space division switch*

Figure 10.5의 crossbar matrix는 input line과 output line의 교차점 crosspoint를 enable해 두 line을 연결한다. 장점은 구조가 직관적이고 single-stage crossbar는 nonblocking이라는 점이다. 하지만 한계도 명확하다.

| 한계 | 이유 |
|---|---|
| crosspoint 수가 제곱으로 증가 | N개 attached station에 대해 대략 `N^2` 규모 crosspoint가 필요하다. |
| 장애 취약점 | 특정 crosspoint가 고장 나면 그 교차점의 두 device 사이 연결이 불가능하다. |
| 낮은 utilization | 모든 device가 active여도 실제 사용되는 crosspoint는 일부뿐이다. |

이 한계를 줄이기 위해 **multiple-stage switch**를 사용한다.

![Figure 10.6](@/assets/images/data-communication-131-figure-10-6-page-326.png)
*Figure 10.6 · PDF p. 326 · crosspoint 수를 줄이는 three-stage space division switch*

Three-stage switch는 crosspoint 수를 줄이고, endpoint 사이에 여러 path를 제공해 reliability를 높일 수 있다. 그러나 free path를 찾아 여러 stage의 gate를 조합해야 하므로 control scheme이 복잡해진다. 또한 single-stage crossbar와 달리 multistage switch는 blocking이 생길 수 있다. 중간 stage의 수나 크기를 늘리면 nonblocking에 가까워질 수 있지만, 그만큼 cost가 증가한다.

#### Time Division Switching

Modern circuit switch는 거의 모두 **digital time division technique**을 사용해 circuit을 만들고 유지한다. 핵심은 lower-speed bit stream을 조각(slot)으로 나누어 higher-speed stream을 다른 bit stream들과 공유하게 하고, control logic이 slot을 조작해 input에서 output으로 route하는 것이다. 즉 현대 circuit switching은 물리적 공간만의 문제가 아니라, space division element와 time division element를 지능적으로 제어하는 시스템이다.

### 10.4 Softswitch Architecture

**Softswitch**는 specialized software를 실행하는 general-purpose computer가 smart phone switch 역할을 하는 구조다. 전통적인 circuit switch보다 비용을 낮추고 기능을 늘릴 수 있으며, 특히 digitized voice bit stream을 packet으로 변환해 **Voice over IP (VoIP)** 같은 packet 기반 전송으로 이어질 수 있다.

![Figure 10.7](@/assets/images/data-communication-132-figure-10-7-page-327.png)
*Figure 10.7 · PDF p. 327 · traditional circuit switching과 softswitch architecture의 분리 구조 비교*

전통적 telephone switch에서는 call processing software가 physical circuit-switching hardware와 강하게 결합되어 있다. Softswitch는 이를 분리한다.

| 구성 | 역할 |
|---|---|
| Media Gateway (MG) | physical switching function을 수행한다. circuit-switched 또는 packet-switched access/trunk와 맞닿는다. |
| Media Gateway Controller (MGC) | call routing, call-processing logic, feature control을 담당한다. |
| Media gateway control protocol | MG와 MGC 사이 interoperability를 위해 필요한 control protocol 계층이다. |

Softswitch의 의미는 단순히 “소프트웨어로 만든 switch”가 아니다. **call control plane**과 **media switching/transport plane**을 분리해, circuit 기반 음성망을 packet 기반 IP transport와 이어 주는 전환 지점이라는 점이 중요하다.

### 10.5 Packet-Switching Principles

Circuit switching이 data connection에서 비효율적인 이유는 두 가지다.

| 문제 | 설명 |
|---|---|
| idle line | user가 database server에 로그인해 있는 경우처럼 connection은 길게 유지되지만 실제 data는 간헐적으로 burst 형태로 흐른다. 전용 circuit은 idle time에도 capacity를 점유한다. |
| constant data rate | circuit은 양쪽 device가 같은 data rate로 송수신한다고 가정한다. 다양한 host computer와 workstation을 연결하는 데 제약이 된다. |

Packet switching은 긴 message를 짧은 **packet**들로 나누어 해결한다. Packet에는 user data 일부와, network가 route/deliver하기 위해 필요한 **control information**, 보통 **packet header**가 붙는다.

![Figure 10.8](@/assets/images/data-communication-133-figure-10-8-page-328.png)
*Figure 10.8 · PDF p. 328 · application data가 header를 포함한 packet들로 나뉘는 구조*

각 node는 packet을 수신하고, 잠시 store한 뒤, 다음 node로 forward한다. 이 **store-and-forward** 방식은 node-to-node link를 여러 packet이 동적으로 공유하게 한다.

Packet switching의 장점은 다음과 같이 정리된다.

| 장점 | Circuit switching과의 대비 |
|---|---|
| line efficiency | node-to-node link를 packet들이 시간적으로 공유한다. idle connection에 time slot이 고정 예약되지 않는다. |
| data-rate conversion | 각 station이 자기 node에 자기 data rate로 붙어도 packet 교환이 가능하다. |
| overload behavior | circuit switching은 새 call을 block하지만, packet switching은 packet을 계속 받되 delivery delay가 증가한다. |
| priority | node queue에서 높은 priority packet을 먼저 전송할 수 있다. |

#### Datagram과 Virtual Circuit

Packet-switching network가 packet stream을 처리하는 방식은 크게 **datagram**과 **virtual circuit**으로 나뉜다.

![Figure 10.9](@/assets/images/data-communication-134-figure-10-9-page-330.png)
*Figure 10.9 · PDF p. 330 · packet마다 독립적으로 route가 선택되는 datagram approach*

**Datagram approach**에서는 각 packet이 이전 packet과 무관하게 독립 처리된다. 같은 destination address를 가진 packet들도 서로 다른 route를 갈 수 있고, exit point 또는 destination에서 원래 순서로 재정렬해야 할 수 있다. 중간 packet-switching node가 crash하면 queue에 있던 packet이 손실될 수도 있으므로, packet loss detection과 recovery도 exit node 또는 destination 쪽 책임이 될 수 있다.

Datagram의 장점은 call setup phase가 없다는 것이다. 한두 개 packet만 보내는 short message라면 virtual circuit보다 빠를 수 있다. 또한 congestion이나 failure가 생기면 이후 datagram이 다른 route를 찾을 수 있어 더 flexible하고, node failure가 전체 logical connection을 한꺼번에 잃게 하지는 않는다. 이 감각은 뒤의 internetworking, 특히 IP datagram 모델로 이어진다.

![Figure 10.10](@/assets/images/data-communication-135-figure-10-10-page-331.png)
*Figure 10.10 · PDF p. 331 · 미리 정한 logical route를 따라 packet들이 이동하는 virtual-circuit approach*

**Virtual circuit approach**에서는 packet을 보내기 전에 두 endpoint 사이 route를 미리 정한다. 그 뒤 같은 virtual circuit의 모든 packet은 같은 route를 따른다. 각 packet에는 data와 함께 **virtual circuit identifier**가 들어가며, route 위의 각 node는 identifier를 보고 다음 출력 link를 찾는다. 중요한 점은 이것이 circuit switching처럼 dedicated path를 예약한다는 뜻은 아니라는 것이다. Packet은 여전히 각 node에서 buffering/queuing되고, 같은 physical line은 다른 virtual circuit의 packet들과 공유된다.

Virtual circuit의 장점은 장시간 exchange에서 커진다. 모든 packet이 같은 route를 따르므로 sequencing이 쉬워지고, network가 virtual circuit 단위로 error control을 제공할 수 있다. 또한 각 packet마다 routing decision을 반복하지 않아도 되므로 long message에서는 효율적일 수 있다. 반면 route가 고정되므로 congestion adaptation은 datagram보다 어렵고, route 위 node가 fail하면 그 node를 지나는 virtual circuit들이 함께 끊긴다.

#### Packet Size

Packet size는 transmission time과 overhead 사이의 trade-off다.

![Figure 10.11](@/assets/images/data-communication-136-figure-10-11-page-333.png)
*Figure 10.11 · PDF p. 333 · message를 여러 packet으로 나눌 때 transmission overlap과 header overhead가 만드는 trade-off*

Figure 10.11의 예는 40 octet message에 각 packet마다 3 octet header가 붙는 상황이다. 한 packet으로 보내면 `43 octets * 3 transmissions = 129 octet-times`가 걸린다. 두 packet으로 나누면 node `a`가 첫 packet을 받은 즉시 `b`로 전송할 수 있어 overlap이 생기고, 총 시간이 92 octet-times로 줄어든다. 다섯 packet에서는 77 octet-times까지 줄어든다.

하지만 packet을 너무 작게 만들면 delay가 다시 증가한다. 각 packet마다 fixed header가 붙고, 각 node에서 processing/queuing도 packet 수만큼 늘어나기 때문이다. 따라서 packet size는 “작을수록 좋다”가 아니라, transmission overlap 이득과 header/processing overhead의 균형이다.

#### Circuit Switching과 Packet Switching의 Event Timing

![Figure 10.12](@/assets/images/data-communication-137-figure-10-12-page-334.png)
*Figure 10.12 · PDF p. 334 · circuit switching, virtual circuit packet switching, datagram packet switching의 event timing 비교*

Figure 10.12는 네 node를 거쳐 message를 보낼 때 delay가 어디에서 생기는지 보여준다.

| 방식 | setup | data 전송 중 delay | 유리한 상황 |
|---|---|---|---|
| Circuit switching | Call Request와 Call Accepted로 connection setup이 필요하다. | circuit이 만들어진 뒤에는 node delay가 거의 없고 constant data rate가 제공된다. | 긴 voice-like stream, delay variation을 줄여야 하는 통신 |
| Virtual circuit packet switching | Call Request packet과 Call Accept packet이 필요하며, 둘 다 node queueing/processing delay를 겪는다. | packet마다 store-and-forward delay가 생기지만 routing decision은 반복하지 않는다. | 긴 packet exchange, sequencing/error control이 유리한 통신 |
| Datagram packet switching | setup이 없다. | 각 datagram마다 routing decision과 queueing이 생기며 순서가 바뀔 수 있다. | short message, failure/congestion에 flexible해야 하는 통신 |

Table 10.1의 핵심 대비를 압축하면 다음과 같다.

| 항목 | Circuit switching | Datagram packet switching | Virtual circuit packet switching |
|---|---|---|---|
| path | dedicated transmission path | no dedicated path | no dedicated path |
| route 결정 | 전체 conversation 전에 결정 | packet마다 결정 | 전체 logical conversation 전에 결정 |
| overload | call setup이 block될 수 있으나 established call delay는 증가하지 않음 | packet delay 증가 | call setup block 가능, packet delay도 증가 |
| ordering/loss 책임 | message loss protection은 보통 user 책임 | packet 단위 보호를 network가 일부 책임질 수 있음 | packet sequence 단위 보호를 network가 책임질 수 있음 |
| speed/code conversion | 보통 없음 | 가능 | 가능 |
| bandwidth | fixed bandwidth | dynamic use of bandwidth | dynamic use of bandwidth |
| overhead | call setup 뒤 data에는 overhead bit가 없음 | each packet에 overhead bit | each packet에 overhead bit |

이 비교에서 가장 중요한 결론은 “packet switching은 circuit switching보다 항상 빠르다”가 아니라는 점이다. Packet switching은 resource sharing과 data-rate conversion에서는 강하지만, node delay와 queueing delay가 있고 delay variation이 생긴다. Circuit switching은 setup 전에는 느리지만, setup 뒤에는 transparent service와 fixed data rate를 제공한다.

### 10.6 X.25

**X.25**는 traditional packet-switching network에서 host system과 packet-switching network 사이의 interface를 정의한 ITU-T standard다. Circuit switching에서는 network가 transparent path를 제공하므로 attached device가 직접 연결된 것처럼 행동할 수 있다. 하지만 packet switching에서는 attached station이 데이터를 packet으로 조직해야 하고, network와 station 사이에 packet 형식과 제어 방식에 대한 협력이 필요하다. X.25는 그 협력을 표준화한 user-network interface다.

X.25 기능은 세 level로 나뉜다.

| Level | 역할 | 연결되는 개념 |
|---|---|---|
| Physical level | attached station과 packet-switching node 사이 physical interface를 다룬다. | X.21, EIA-232 같은 물리 인터페이스 |
| Link level | physical link 위에서 data를 frame sequence로 신뢰성 있게 전송한다. | LAPB(Link Access Protocol-Balanced), HDLC subset |
| Packet level | subscriber 사이 logical connection인 virtual circuit service를 제공한다. | virtual circuit number, packet sequencing, flow/error control |

![Figure 10.13](@/assets/images/data-communication-138-figure-10-13-page-337.png)
*Figure 10.13 · PDF p. 337 · physical link 위에 logical virtual circuit이 설정되는 X.25 packet-switching network*

Figure 10.13에서 solid line은 physical link, dashed line은 virtual circuit이다. Station A는 C로 가는 virtual circuit 하나를 갖고, station B는 C와 D로 가는 virtual circuit 두 개를 갖는다. E와 F도 D로 가는 virtual circuit을 갖는다. D는 B, E, F에서 오는 packet들을 각 incoming packet의 **virtual circuit number**로 구분한다.

여기서 “virtual circuit”은 두 층의 의미로 쓰인다.

| 구분 | 의미 |
|---|---|
| External virtual circuit | 두 station 사이에 보이는 logical relationship 또는 logical channel이다. 사용자-네트워크 인터페이스 관점의 연결이다. |
| Internal virtual circuit | network 내부에서 두 station 사이에 미리 정해진 route다. packet-switching principles에서 다룬 route 관점의 연결이다. |

보통 external virtual circuit과 internal virtual circuit은 1:1로 대응하지만, 반드시 그래야 하는 것은 아니다. X.25를 datagram-style network 위에서 사용할 수도 있다. 핵심은 external virtual circuit이 두 station 사이의 logical channel을 제공하고, 그 channel에 속한 data를 하나의 stream으로 다룬다는 점이다.

![Figure 10.14](@/assets/images/data-communication-139-figure-10-14-page-338.png)
*Figure 10.14 · PDF p. 338 · user data에 X.25 level 3 header와 LAPB header/trailer가 붙는 구조*

Figure 10.14의 encapsulation 흐름은 다음과 같다.

1. User data가 X.25 level 3으로 내려간다.
2. Level 3은 control information을 header로 붙여 **X.25 packet**을 만든다.
3. 이 header에는 virtual circuit number와, virtual circuit 단위 flow/error control에 쓰이는 sequence number가 포함된다.
4. X.25 packet 전체가 LAPB entity로 내려간다.
5. LAPB가 앞뒤에 header/trailer를 붙여 **LAPB frame**을 만든다.

X.25 packet level의 동작은 Chapter 7의 HDLC와 닮아 있다. 각 X.25 data packet은 send sequence number `P(S)`와 receive sequence number `P(R)`를 포함한다. `P(S)`는 특정 virtual circuit에서 outgoing data packet을 순서대로 번호 붙이는 데 쓰이고, `P(R)`은 해당 virtual circuit에서 받은 packet에 대한 acknowledgment 역할을 한다.

따라서 X.25는 단순히 “packet을 보내는 표준”이 아니라, noisy/less reliable link 환경을 가정하고 link level과 packet level에서 신뢰성 제어를 두껍게 제공하는 traditional packet-switching architecture로 이해해야 한다. 이 특징이 다음 section의 frame relay가 등장하는 배경이 된다.

### 10.7 Frame Relay

**Frame relay**는 X.25보다 효율적인 packet-switching 방식을 제공하기 위해 설계되었다. 핵심 배경은 전송 환경의 변화다. X.25는 error 가능성이 높은 link를 가정하고 hop-by-hop flow control/error control을 두껍게 넣었다. 그러나 현대 digital transmission과 optical fiber 기반 link는 훨씬 신뢰성이 높고 고속이다. 이런 환경에서는 X.25의 과한 제어가 high data rate의 effective utilization을 떨어뜨린다.

X.25 접근의 overhead는 세 가지에서 나온다.

| X.25 특징 | overhead가 생기는 이유 |
|---|---|
| call control packet과 data packet이 같은 channel/virtual circuit을 사용 | intermediate node가 connection별 call management state를 계속 처리해야 한다. |
| virtual circuit multiplexing이 layer 3에서 수행 | packet level processing이 각 hop에서 필요하다. |
| layer 2와 layer 3 모두 flow/error control 제공 | 각 hop마다 data frame과 acknowledgment frame 교환이 필요하다. |

Frame relay는 이를 다음처럼 줄인다.

| Frame relay 설계 | 효과 |
|---|---|
| call control signaling을 user data와 별도 logical connection으로 분리 | intermediate node가 connection별 call control message를 깊게 처리하지 않아도 된다. |
| logical connection multiplexing/switching을 layer 2에서 수행 | layer 3 processing 하나를 사실상 제거한다. |
| hop-by-hop flow control/error control 제거 | source-to-destination 사이에서 단일 user data frame이 지나가고, error recovery는 필요하면 higher layer가 담당한다. |

이 설계의 trade-off는 선명하다. 장점은 protocol 기능과 internal network processing이 줄어 lower delay와 higher throughput을 기대할 수 있다는 점이다. 단점은 X.25가 제공하던 link-by-link flow/error control을 잃는다는 점이다. 하지만 reliable digital link 환경에서는 이 손실이 큰 문제가 아니며, 필요한 end-to-end control은 higher layer에서 제공할 수 있다.

#### Frame Relay Protocol Architecture

Frame relay는 **control plane (C-plane)**과 **user plane (U-plane)**을 나누어 본다.

![Figure 10.15](@/assets/images/data-communication-140-figure-10-15-page-340.png)
*Figure 10.15 · PDF p. 340 · frame relay user-network interface에서 control plane과 user plane이 분리되는 구조*

| Plane | 역할 | 사용 protocol |
|---|---|---|
| Control plane | logical connection establishment/termination 담당 | LAPD(Q.921) 위에서 Q.933 control signaling message 교환 |
| User plane | end user 사이 user data transfer 담당 | LAPF(Link Access Procedure for Frame Mode Bearer Services), Q.922 |

Control plane은 circuit-switching service의 common channel signaling과 비슷하게 별도 logical channel로 control information을 보낸다. Data link layer에서는 LAPD(Q.921)가 user(TE)와 network(NT) 사이에서 reliable data link control service를 제공하고, 그 위에서 Q.933 signaling message가 오간다.

User plane은 실제 user data를 전달한다. Frame relay service에서는 LAPF의 **core functions**만 사용한다. LAPF core는 frame delimiting, alignment, transparency, address field 기반 multiplexing/demultiplexing, frame length 검사, transmission error detection, congestion control function 등을 제공한다. 하지만 flow control과 error control은 제공하지 않는다.

Frame relay가 제공하는 service는 connection-oriented link layer service이며, 기본 성질은 두 가지다.

| 성질 | 의미 |
|---|---|
| frame order preservation | network edge에서 edge까지 frame transfer order가 보존된다. |
| small probability of frame loss | frame loss 가능성은 작지만, error frame은 network가 고치지 않고 discard할 수 있다. |

X.25의 virtual circuit에 해당하는 개념은 frame relay에서는 **data link connection**이다. 차이는 이 data link connection 위의 frame이 flow/error control이 있는 data link control pipe로 보호되지 않는다는 점이다. Intermediate network node는 user data frame에 대해 거의 processing하지 않고, error check와 connection number 기반 routing 정도만 수행한다. Error가 있는 frame은 단순히 discard되고, recovery는 higher layer로 넘어간다.

#### LAPF-Core Frame Format

![Figure 10.16](@/assets/images/data-communication-141-figure-10-16-page-342.png)
*Figure 10.16 · PDF p. 342 · LAPF-core frame format과 DLCI를 포함한 address field 구조*

LAPF-core frame은 HDLC 계열과 닮았지만, 뚜렷한 차이가 있다. **Control field가 없다.** 이 omission의 의미는 크다.

| 결과 | 설명 |
|---|---|
| frame type이 하나 | user data를 carrying하는 frame만 있고 control frame이 없다. |
| connection control 불가 | logical connection은 user data만 운반한다. call control은 별도 data link connection에서 처리된다. |
| flow/error control 불가 | sequence number가 없으므로 LAPF core 자체로 flow control/error control을 수행할 수 없다. |

주요 field는 다음과 같다.

| Field | 역할 |
|---|---|
| Flag | frame boundary 표시. HDLC와 같은 계열의 framing 감각이다. |
| Address | frame relay connection을 구분한다. 기본 2 octets, 3/4 octets로 확장 가능하다. |
| Information | higher-layer data를 담는다. 사용자가 선택한 end-to-end data link/network 기능이 여기에 실릴 수 있다. |
| FCS(Frame Check Sequence) | transmission error detection에 사용된다. |

Address field에서 가장 중요한 값은 **DLCI(Data Link Connection Identifier)**다. DLCI는 X.25의 virtual circuit number와 같은 역할을 하며, 하나의 physical channel 위에서 여러 logical frame relay connection을 multiplexing하게 해 준다. 다만 DLCI는 **local significance**만 가진다. 즉 logical connection의 양 끝은 각자 locally unused number pool에서 DLCI를 할당할 수 있고, network가 한쪽 DLCI를 다른 쪽 DLCI로 mapping한다. 양 끝에서 같은 DLCI를 쓰도록 강제하면 global DLCI management가 필요해지므로, local significance 방식이 더 현실적이다.

Figure 10.16의 FECN(Forward Explicit Congestion Notification), BECN(Backward Explicit Congestion Notification), DE(Discard Eligibility) bit는 congestion control과 관련되며, 더 자세한 처리는 Chapter 13의 frame relay congestion control로 이어진다.

## 연결 관계

Chapter 10은 Part Three의 입구이면서, 이후 WAN 기술을 이해하는 기준선을 만든다.

| 연결 대상 | 이어지는 이유 |
|---|---|
| Chapter 7 HDLC | X.25의 LAPB, frame relay의 LAPD/LAPF가 HDLC 계열 framing과 sequence/acknowledgment 개념을 공유한다. |
| Chapter 8 Multiplexing | circuit switching의 trunk, logical channel allocation, FDM/TDM 설명이 Chapter 8의 multiplexing 위에 세워진다. |
| Chapter 11 ATM | ATM은 X.25보다 streamlined packet transfer를 지향하며, fixed-size cell로 고속 switching을 수행한다. |
| Chapter 12 Routing | datagram과 virtual circuit의 route 선택 문제는 packet-switching network routing으로 이어진다. |
| Chapter 13 Congestion Control | packet switching의 queueing delay, overload, frame relay의 FECN/BECN/DE는 congestion control 주제로 확장된다. |
| Part Five Internetworking | datagram-style operation과 distributed routing의 한계는 IP internetworking을 이해하는 기반이다. |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| circuit switching은 overhead가 없다 | data phase에 per-packet header가 없을 뿐, call setup, reserved idle capacity, switching resource allocation이라는 overhead가 있다. |
| circuit switching은 항상 packet switching보다 빠르다 | setup 후에는 node delay가 작지만, call setup delay와 idle capacity 낭비가 있다. packet switching은 load와 message length에 따라 유리할 수 있다. |
| virtual circuit은 dedicated path다 | route가 미리 정해질 뿐, physical link는 여러 virtual circuit packet이 공유한다. |
| datagram은 항상 순서대로 도착한다 | packet마다 route가 달라질 수 있어 out-of-order arrival이 가능하다. |
| packet size는 작을수록 좋다 | 작은 packet은 overlap을 늘리지만, header overhead와 per-node processing/queueing이 늘어난다. |
| X.25와 frame relay는 같은 packet switching이다 | 둘 다 logical connection을 쓰지만, X.25는 layer 2/3 제어가 두껍고 frame relay는 hop-by-hop flow/error control을 제거해 더 가볍다. |
| frame relay가 reliability를 전혀 보장하지 않는다 | core network는 error frame을 discard하고 higher layer recovery에 맡기지만, frame order preservation과 low frame loss probability를 목표로 한다. |
| DLCI는 전역 주소다 | DLCI는 local significance만 가지며, network가 connection 양 끝의 DLCI mapping을 관리한다. |

## 핵심 용어

`circuit switching`, `circuit-switching network`, `packet switching`, `switched communications network`, `station`, `node`, `transmission link`, `FDM`, `TDM`, `subscriber`, `subscriber line`, `subscriber loop`, `local loop`, `exchange`, `end office`, `trunk`, `digital switch`, `control unit`, `blocking`, `nonblocking`, `space division switching`, `crossbar matrix`, `multiple-stage switch`, `time division switching`, `softswitch`, `media gateway (MG)`, `media gateway controller (MGC)`, `Voice over IP (VoIP)`, `packet`, `packet header`, `store-and-forward`, `datagram`, `virtual circuit`, `virtual circuit identifier`, `packet size`, `propagation delay`, `transmission time`, `node delay`, `X.25`, `X.21`, `EIA-232`, `LAPB`, `HDLC`, `packet level`, `P(S)`, `P(R)`, `frame relay`, `control signaling`, `control plane`, `user plane`, `LAPD`, `LAPF`, `LAPF core`, `data link connection`, `DLCI`, `local significance`, `FCS`, `FECN`, `BECN`, `DE`.

## 면접 질문

1. Circuit switching의 세 단계인 circuit establishment, data transfer, circuit disconnect를 설명하고, 왜 bursty data에 비효율적인지 말해 보라.
2. Switched communications network에서 station, node, node-station link, node-node link의 역할 차이는 무엇인가?
3. Blocking network와 nonblocking network의 차이는 무엇이며, voice traffic과 data traffic에서 요구가 달라지는 이유는 무엇인가?
4. Single-stage crossbar matrix와 multiple-stage space division switch의 trade-off를 crosspoint 수, reliability, blocking 관점에서 설명하라.
5. Softswitch architecture에서 Media Gateway(MG)와 Media Gateway Controller(MGC)를 분리하는 이유는 무엇인가?
6. Packet switching이 circuit switching보다 line efficiency가 좋은 이유를 idle circuit과 dynamic bandwidth sharing 관점에서 설명하라.
7. Datagram approach와 virtual circuit approach를 routing decision, packet ordering, congestion adaptation, node failure 관점에서 비교하라.
8. Packet size를 줄이면 처음에는 transmission time이 줄다가 다시 증가할 수 있는 이유는 무엇인가?
9. Figure 10.12의 event timing 관점에서 circuit switching, virtual circuit packet switching, datagram packet switching의 delay 구조를 비교하라.
10. X.25의 physical level, link level, packet level은 각각 무엇을 담당하는가?
11. X.25에서 external virtual circuit과 internal virtual circuit의 차이는 무엇인가?
12. Frame relay가 X.25보다 빠를 수 있는 이유를 call control separation, layer 2 switching, hop-by-hop control 제거 관점에서 설명하라.
13. LAPF-core frame에 Control field가 없다는 사실은 frame relay의 flow/error control 방식에 어떤 의미를 갖는가?
14. DLCI(Data Link Connection Identifier)가 local significance만 갖는다는 말은 무엇이며, 왜 전역 번호보다 현실적인가?
