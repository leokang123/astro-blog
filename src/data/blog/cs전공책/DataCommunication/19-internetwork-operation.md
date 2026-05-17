---
title: "Internetwork Operation"
order: 19
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Internetwork Operation"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 19는 IP 기반 internet이 단순 `best-effort delivery`만으로는 감당하기 어려워진 traffic 요구를 다룬다. Web traffic, client/server traffic, real-time voice/video, multimedia, multicast traffic이 늘어나면서 단순히 capacity만 늘리는 것으로는 부족해졌고, routing, multicast delivery, QoS, congestion control, service level, performance measurement가 필요해졌다. 이 장의 흐름은 `multicasting → routing protocols → Integrated Services Architecture (ISA) → Differentiated Services (DS) → Service Level Agreement (SLA) → IP performance metrics`다.

## 핵심 개념

| 세부 주제 | 핵심 질문 | 검색용 용어 |
|---|---|---|
| Multicasting | 하나의 source packet을 group members에게 중복 없이 어떻게 전달하는가? | multicast address, spanning tree, IGMPv3, INCLUDE, EXCLUDE |
| Routing Protocols | router들이 reachability와 path 정보를 어떻게 교환하는가? | autonomous system, BGP, OSPF, AS_PATH, SPF |
| Integrated Services Architecture | application flow별 QoS를 IP internet에서 어떻게 예약/제어하는가? | ISA, RSVP, flow, token bucket, admission control |
| Differentiated Services | per-flow state 없이 class 기반 service differentiation을 어떻게 제공하는가? | DS field, DSCP, PHB, traffic conditioner |
| Service Level Agreements | provider와 customer가 service 품질을 어떻게 계약/측정하는가? | SLA, SLS, service metrics |
| IP Performance Metrics | delay, loss, connectivity 같은 IP performance를 어떻게 정의하고 측정하는가? | IPPM, packet delay variation, one-way delay, packet loss |

## 세부 정리

### 19.1 Multicasting

`Multicasting`은 하나의 source가 하나의 packet을 multicast group의 여러 destination에게 보내는 동작이다. IP는 개별 host를 가리키는 unicast address뿐 아니라 host group을 가리키는 `multicast address`도 지원한다. Multicasting은 multimedia streaming, teleconferencing, replicated database update, distributed computation, real-time workgroup collaboration처럼 “같은 data를 여러 receiver에게 보내야 하는” 상황에서 중요하다.

LAN segment 안에서 multicasting은 비교적 쉽다. IEEE 802 같은 LAN은 MAC-level multicast address를 제공하고, LAN의 broadcast 성질 때문에 한 번의 transmission을 모든 station이 들을 수 있다. Group member인 station만 해당 multicast MAC address를 recognize하고 packet을 accept하면 된다. 하지만 여러 LAN과 router가 얽힌 internet 환경에서는 address translation, group membership, route computation, duplicate suppression이 필요해 훨씬 복잡하다.

#### Broadcast, Multiple Unicast, True Multicast

![Figure 19.1](@/assets/images/data-communication-248-figure-19-1-page-625.png)
*Figure 19.1 · PDF p. 625 · multicast server와 group members가 여러 network/router에 흩어진 예제 topology*

Figure 19.1에서 multicast server는 network N1에 있고, group members는 N3, N5, N6에 있다. Source가 group member 위치를 모르면 가장 단순한 방법은 모든 network로 packet copy를 보내는 broadcast-style approach다. Source가 group member가 있는 network 목록을 알면 N3, N5, N6로 각각 unicast copy를 보내는 `multiple unicast`를 할 수 있다. 하지만 두 방식 모두 중복 packet을 많이 만든다.

| Strategy | 동작 | Figure 19.1 예의 packet copy 수 | 문제 |
|---|---|---:|---|
| `Broadcast` | 모든 network로 packet을 보낸다. | 13 | group member가 없는 network에도 packet이 간다. |
| `Multiple unicast` | member가 있는 network마다 별도 unicast packet을 보낸다. | 11 | 공통 path에서도 packet이 여러 번 지나간다. |
| `True multicast` | group member가 있는 network들로 가는 shortest-path spanning tree를 만들고 branch point에서만 복제한다. | 8 | router가 multicast state와 tree 계산을 해야 한다. |

![Figure 19.2](@/assets/images/data-communication-249-figure-19-2-page-627.png)
*Figure 19.2 · PDF p. 627 · source에서 multicast group으로 가는 spanning tree와 branch-point packet replication*

True multicast의 핵심은 `spanning tree`다. Source에서 group members가 있는 network들까지의 least-cost path를 모아 tree를 만들고, source는 tree를 따라 single packet을 보낸다. Router는 tree의 branch point에서만 packet을 replicate한다. Figure 19.2에서는 source가 N1에서 router D로 하나의 packet을 보내고, D가 B와 C 방향으로 복제한다. 이후 C는 N5/N6 방향으로 필요한 copy를 만든다.

#### Multicasting Requirements

Multicast routing은 unicast routing보다 복잡하다. Unicast에서는 destination network 하나에 대한 shortest path만 고르면 되지만, multicast에서는 하나의 incoming datagram을 여러 outgoing path로 복제할 수 있어야 한다.

필요 기능은 다음과 같다.

| 요구사항 | 설명 |
|---|---|
| `Multicast address convention` | IPv4는 Class D address를 multicast용으로 예약한다. IPv6 multicast address는 8-bit all-ones prefix, flags, scope, group identifier를 포함한다. |
| Group-to-network mapping | IP multicast address가 어떤 member-containing networks로 이어지는지 알아야 shortest-path spanning tree를 만들 수 있다. |
| IP-to-MAC multicast translation | destination network에 packet을 deliver하려면 IPv4/IPv6 multicast address를 IEEE 802 같은 network의 MAC-level multicast address로 변환해야 한다. |
| Dynamic join/leave | host가 multicast group에 동적으로 join/leave할 수 있어야 한다. IPv4에서는 `IGMP`가 이 기능을 제공한다. |
| Router information exchange | routers는 어떤 network에 group members가 있는지, 그리고 그 network까지 shortest path를 계산할 정보를 교환해야 한다. |
| Multicast routing algorithm | group members 전체로 가는 shortest paths를 계산해야 한다. |
| Source + multicast destination routing | multicast packet은 destination group뿐 아니라 source에 따라 다른 tree를 써야 한다. |

마지막 요구사항이 미묘하다. Multicast destination만 보고 local shortest path를 계산하면 duplicate packet이 생길 수 있다.

![Figure 19.3](@/assets/images/data-communication-250-figure-19-3-page-629.png)
*Figure 19.3 · PDF p. 629 · router C를 root로 계산하면 N3 쪽 중복 전달이 생기는 spanning tree*

Figure 19.3은 source N1이 보낸 multicast packet을 router C가 자기 기준 shortest-path tree로 다시 계산했을 때의 문제를 보여준다. C가 N3, N5, N6로 가는 tree를 자기 기준으로 만들면 B로도 packet을 보내게 되고, B는 이미 D로부터 N3용 packet을 받은 상태라 duplicate이 발생한다. 따라서 router는 “source가 어디인가”와 “multicast group이 무엇인가”를 함께 보고, source-rooted spanning tree에 따라 forwarding해야 한다.

#### IGMP: Internet Group Management Protocol

`IGMP (Internet Group Management Protocol)`는 IPv4 LAN에서 host와 router가 multicast group membership information을 교환하기 위한 protocol이다. LAN의 broadcast 성질을 이용해 여러 host/router 사이 membership 정보를 효율적으로 교환한다.

IGMP의 기본 역할은 두 가지다.

| 역할 | 설명 |
|---|---|
| Host report | host가 특정 multicast group에 subscribe/unsubscribe한다는 것을 router에게 알린다. |
| Router query | router가 attached network에서 어떤 multicast groups가 여전히 관심 대상인지 주기적으로 확인한다. |

IGMPv1은 host join과 router timer 기반 unsubscribe를 제공했다. IGMPv2는 host가 unsubscribe를 요청할 수 있게 했다. IGMPv1/v2의 기본 paradigm은 receiver가 group에 subscribe하고, source는 subscribe할 필요 없이 any host가 any multicast group으로 traffic을 보낼 수 있다는 것이었다. 이 general model은 유연하지만 multicast group spam, source location unknown으로 인한 distribution tree 구성 문제, globally unique multicast address 확보 문제를 낳는다.

IGMPv3는 source filtering을 도입해 이 약점을 줄인다.

| IGMPv3 기능 | 의미 |
|---|---|
| `INCLUDE mode` | 특정 source list에서 오는 traffic만 받겠다고 signal한다. |
| `EXCLUDE mode` | group traffic은 받되 특정 source list에서 오는 traffic은 제외하겠다고 signal한다. |
| Source blocking at routers | unwanted source traffic을 receiver까지 보내지 않고 router에서 차단할 수 있다. |

#### IGMPv3 Message Format

IGMP message는 IP datagram 안에 실린다. IGMPv3는 두 message type을 정의한다. `Membership Query`는 multicast router가 보내고, `Membership Report`는 host가 group membership/filter state를 알릴 때 보낸다.

![Figure 19.4](@/assets/images/data-communication-251-figure-19-4-page-631.png)
*Figure 19.4 · PDF p. 631 · IGMPv3 Membership Query, Membership Report, Group Record 형식*

Membership Query에는 세 subtype이 있다.

| Query subtype | 목적 |
|---|---|
| `General query` | attached network에 어떤 groups의 members가 있는지 확인 |
| `Group-specific query` | 특정 multicast group에 member가 남아 있는지 확인 |
| `Group-and-source-specific query` | 특정 group에 대해 특정 source list에서 오는 packet 수신을 원하는 host가 있는지 확인 |

Membership Query의 주요 field는 다음과 같다.

| Field | 의미 |
|---|---|
| `Type` | message type |
| `Max Response Code` | responding report를 보내기 전 허용되는 최대 시간. 단위는 1/10 second |
| `Checksum` | message 전체에 대한 16-bit ones-complement checksum |
| `Group Address` | general query에서는 0, group-specific query에서는 multicast group address |
| `S Flag` | 수신 multicast router가 normal timer update를 suppress해야 함을 표시 |
| `QRV` | querier's robustness variable. report retransmission 횟수 관련 값 |
| `QQIC` | querier's query interval code. query timer 값 |
| `Number of Sources` | source addresses 수. group-and-source-specific query에서만 nonzero |
| `Source Addresses` | N개의 32-bit unicast source addresses |

Membership Report는 여러 group records를 담을 수 있다. Group record에는 `Record Type`, `Aux Data Length`, `Number of Sources`, `Multicast Address`, `Source Addresses`, `Auxiliary Data`가 들어간다. 현재 원문 범위에서는 auxiliary data value가 정의되어 있지 않다는 점만 알면 충분하다.

#### IGMP Operation

Host가 group에 join하려면 IGMP membership report를 보낸다. 이때 IGMP message의 Group Address field와 encapsulating IP header의 Destination Address가 같은 multicast address가 된다. 현재 그 group의 member인 host들은 이 message를 받아 새 member를 알게 되고, LAN에 붙은 routers는 모든 IP multicast address를 listen해야 모든 report를 들을 수 있다.

Router는 active group list를 유지하기 위해 주기적으로 `IGMP general query`를 보낸다. 이 query는 all-hosts multicast address를 destination으로 하는 IP datagram에 실린다. Group member host들은 query를 받으면 자신이 membership을 주장하는 group마다 report를 보내야 한다. 다만 router는 “어떤 group에 member가 적어도 하나 있다”는 사실만 필요하고 모든 host identity를 알 필요가 없다. 그래서 각 host는 random delay timer를 설정하고, 같은 group에 대한 다른 host의 report를 들으면 자기 report를 취소한다. 이 방식으로 group마다 보통 하나의 report만 router에게 전달된다.

Host가 group을 떠날 때는 all-routers static multicast address로 leave group message를 보낸다. IGMPv3에서는 INCLUDE option과 null source list를 가진 membership report를 보내 “받을 source가 없다”는 상태를 표현해 실질적으로 group을 leave한다. Router는 이 message를 받으면 group-specific query를 사용해 해당 interface에 remaining group member가 있는지 확인한다.

IPv6에서는 IGMP를 별도 version으로 만들지 않고, multicast membership 기능을 `ICMPv6`에 통합했다. ICMPv6는 ICMPv4와 IGMP 기능을 모두 포함하며, multicast support를 위해 group-membership query와 group-membership report message를 제공한다.

### 19.2 Routing Protocols

Internet의 router는 interconnected networks를 통해 packet을 receive/forward한다. 단순한 internet에서는 fixed routing도 가능하지만, 복잡한 internet에서는 failure와 congestion을 피하기 위해 routers가 동적으로 협력해야 한다. 이를 위해 routers는 `routing protocol`을 사용해 reachability, topology, traffic/delay condition 정보를 교환한다.

Routing을 볼 때 두 개념을 구분해야 한다.

| 개념 | 의미 |
|---|---|
| `Routing information` | internet topology와 delay/cost 상태에 관한 정보 |
| `Routing algorithm` | 현재 routing information을 바탕으로 특정 datagram의 next hop을 결정하는 algorithm |

#### Autonomous System, IRP, ERP

`Autonomous System (AS)`는 하나의 조직이 관리하는 routers와 networks의 집합이며, 내부 routers가 공통 routing protocol로 정보를 교환한다. 정상 상황에서는 graph-theoretic sense로 connected해야 한다. AS 내부에서 사용하는 routing protocol을 `IRP (Interior Router Protocol)`라고 부르고, 서로 다른 AS 사이에서 routing information을 교환하는 protocol을 `ERP (Exterior Router Protocol)`라고 부른다.

![Figure 19.5](@/assets/images/data-communication-252-figure-19-5-page-634.png)
*Figure 19.5 · PDF p. 634 · autonomous system 내부의 IRP와 AS 사이의 ERP 적용 위치*

Figure 19.5에서 AS1 내부 router들은 AS1의 IRP를 공유하고, AS2 내부 router들은 AS2의 IRP를 공유한다. AS 사이 경계 router들은 ERP를 사용한다. ERP가 IRP보다 적은 정보를 다뤄도 되는 이유는, AS 외부 router가 target AS 내부 route detail까지 알 필요가 없기 때문이다. Source AS의 router는 “어느 AS로 들어가야 하는가”만 알면 되고, target AS 내부 delivery는 그 AS의 IRP가 처리한다.

#### Distance-Vector, Link-State, Path-Vector

Routing protocol은 routing information을 모으고 사용하는 방식에 따라 크게 세 가지로 구분된다.

| 접근 | 핵심 아이디어 | 장점 | 한계 |
|---|---|---|---|
| `Distance-vector routing` | neighbor에게 각 destination까지의 estimated path cost vector를 보낸다. | 단순하다. RIP가 대표 예다. | 많은 정보가 neighbor에게 반복 전달되고, link failure/cost change가 전체에 퍼지는 데 시간이 걸린다. Exterior routing에는 metric 의미 불일치와 AS policy 표현 부족 문제가 있다. |
| `Link-state routing` | 각 router가 자기 link costs를 전체 routers에게 advertise하고, 각 router가 전체 topology를 구성해 shortest path를 계산한다. | topology view가 명확하고 Dijkstra algorithm을 사용할 수 있다. OSPF가 대표 예다. | exterior routing에 쓰면 AS마다 metric 의미가 다르고, multiple AS 전체에 link state flooding을 하기 어렵다. |
| `Path-vector routing` | destination network까지 도달 가능한 route와 그 route가 통과하는 AS list를 advertise한다. | AS-level policy routing과 loop prevention에 적합하다. BGP가 대표 예다. | 비용 metric보다 policy와 reachability 중심이라 traffic engineering은 별도 정책에 의존한다. |

Exterior routing에서 distance-vector와 link-state가 곤란한 이유는 AS마다 metric의 의미와 정책이 다르기 때문이다. 어떤 AS는 delay를, 어떤 AS는 cost를, 어떤 AS는 security restriction을 중시할 수 있다. `Path-vector`는 cost를 공통 metric으로 강제하지 않고, route가 지나야 하는 AS sequence를 제공한다. Router는 이 AS path를 보고 특정 AS를 회피하거나, transit AS 수를 줄이거나, 성능/보안 정책에 맞는 route를 고를 수 있다.

#### BGP: Border Gateway Protocol

`BGP (Border Gateway Protocol)`는 TCP/IP internet에서 선호되는 exterior router protocol이다. BGP는 서로 다른 AS에 있는 routers, 표준 문맥에서는 gateways, 가 routing information을 교환하게 한다. BGP message는 TCP connection 위에서 전달되며, 현재 원문 범위의 기준 version은 `BGP-4`다.

BGP message type은 다음과 같다.

| Message | 역할 |
|---|---|
| `Open` | 다른 router와 neighbor relationship을 열기 위해 사용 |
| `Update` | 단일 route 정보 전달 또는 여러 withdrawn routes 목록 전달 |
| `Keepalive` | Open message를 acknowledge하고 neighbor relationship이 살아 있음을 주기적으로 확인 |
| `Notification` | error condition을 감지했을 때 전송 |

BGP에는 세 functional procedure가 있다.

| Procedure | 의미 |
|---|---|
| `Neighbor acquisition` | 서로 다른 AS의 neighboring routers가 routing information을 정기적으로 교환하기로 합의한다. TCP connection 후 Open message를 교환하고, 수락하면 Keepalive로 응답한다. |
| `Neighbor reachability` | established neighbor 관계가 유지되는지 확인한다. Peers는 Hold Timer가 만료되지 않도록 Keepalive를 주기적으로 보낸다. |
| `Network reachability` | router가 도달 가능한 networks와 preferred routes database를 유지하고, 변화가 있으면 Update message를 다른 BGP routers에게 보낸다. |

![Figure 19.6](@/assets/images/data-communication-253-figure-19-6-page-638.png)
*Figure 19.6 · PDF p. 638 · BGP Open, Update, Keepalive, Notification message format*

BGP message는 공통 19-octet header로 시작한다.

| Header field | 의미 |
|---|---|
| `Marker` | authentication mechanism에 사용할 수 있는 reserved field |
| `Length` | message length in octets |
| `Type` | Open, Update, Notification, Keepalive 중 하나 |

`Open` message는 sender가 속한 AS, router IP address, proposed Hold Time을 포함한다. Recipient가 neighbor relationship을 수락하면 자기 Hold Time과 상대 Hold Time 중 작은 값을 Hold Timer로 계산하고, 그 시간 안에 successive Keepalive/Update message를 받아야 한다. `Keepalive`는 header만 가진다.

`Update` message는 두 종류의 정보를 담을 수 있다. 첫째, 하나의 route에 관한 information이다. 이때 `NLRI (Network Layer Reachability Information)`는 해당 route로 도달 가능한 network identifiers 목록을 담고, `Path Attributes`는 그 route의 속성을 담는다. 둘째, 이전에 advertise했던 routes를 withdraw하는 정보다.

BGP route attribute의 핵심은 다음과 같다.

| Attribute | 의미 |
|---|---|
| `Origin` | route 정보가 IRP, ERP/BGP 등 어디서 생성되었는지 표시 |
| `AS_Path` | 이 route를 따라 datagram이 traverse할 AS list |
| `Next_Hop` | NLRI destinations로 가기 위해 사용할 border router IP address |
| `Multi_Exit_Disc` | 한 AS로 들어가는 여러 entry point 중 선택하도록 내부 metric 정보를 전달 |
| `Local_Pref` | 같은 AS 내부 routers에게 특정 route 선호도를 알림. 다른 AS에는 의미 없음 |
| `Atomic_Aggregate`, `Aggregator` | route aggregation을 구현해 NLRI 정보량을 줄임 |

`AS_Path`는 두 가지를 동시에 한다. 첫째, policy routing을 가능하게 한다. Router는 confidential traffic이 특정 AS를 지나지 않게 하거나, congested/low-quality AS를 피할 수 있다. 둘째, update loop를 막는다. Update를 받은 router의 AS가 AS_Path에 이미 있으면 그 update는 더 forward하지 않는다.

`Next_Hop`이 필요한 이유는 AS 내부의 모든 router가 BGP를 구현하지 않기 때문이다. Figure 19.5에서 R1이 R5에게 “R2를 통해 reachable한 networks”까지 대신 advertise할 수 있다. R1은 AS1 내부에서 R2와 IRP를 공유하므로 그 정보를 알고 있고, R5는 Next_Hop field를 통해 실제 어느 border router를 써야 하는지 알 수 있다.

간단한 BGP propagation 흐름은 다음과 같다.

```text
R1 in AS1 -> R5 in AS2:
  AS_Path = AS1
  Next_Hop = R1
  NLRI = networks in AS1

R5 in AS2 -> R9 in AS3:
  AS_Path = AS2, AS1
  Next_Hop = R5
  NLRI = networks in AS1

R9가 이 route를 채택해 전파하면:
  AS_Path = AS3, AS2, AS1
```

이 흐름에서 BGP는 “목적지까지의 내부 router-by-router 경로”가 아니라 “어떤 AS들을 통과해야 하는가”를 중심으로 routing policy를 전파한다.

#### OSPF: Open Shortest Path First

`OSPF (Open Shortest Path First)`는 TCP/IP network에서 널리 쓰이는 interior router protocol이다. OSPF는 user-configurable cost metric을 바탕으로 least-cost route를 계산한다. Cost는 delay, data rate, dollar cost 등으로 설정될 수 있고, OSPF는 equal-cost multiple paths에 load를 분산할 수도 있다.

OSPF에서 각 router는 자신이 속한 AS topology database를 유지한다. Topology는 directed graph로 표현된다.

| Graph element | 종류 | 의미 |
|---|---|---|
| `Vertex` | router | router node |
| `Vertex` | transit network | end system에서 originate/terminate하지 않는 data도 carry할 수 있는 network |
| `Vertex` | stub network | transit network가 아닌 network |
| `Edge` | router-router | 두 routers가 direct point-to-point link로 연결된 경우 |
| `Edge` | router-network | router가 network에 직접 연결된 경우 |

![Figure 19.7](@/assets/images/data-communication-254-figure-19-7-page-643.png)
*Figure 19.7 · PDF p. 643 · OSPF 설명에 쓰이는 sample autonomous system*

![Figure 19.8](@/assets/images/data-communication-255-figure-19-8-page-644.png)
*Figure 19.8 · PDF p. 644 · Figure 19.7 autonomous system을 directed graph로 표현한 모습*

Figure 19.7의 physical/logical AS 구조는 Figure 19.8의 directed graph로 바뀐다. Point-to-point로 연결된 routers는 양방향 edge 쌍으로 표현되고, 여러 routers가 붙은 LAN이나 packet-switching network는 network vertex로 표현된다. 단일 router에만 붙은 network는 stub connection으로 나타난다. 다른 AS로 가는 external networks는 ERP로 얻은 path cost를 가진 stub로 graph에 들어간다.

Router interface의 output side에는 cost가 붙는다. System administrator가 cost를 설정하며, network에서 router로 향하는 arcs는 항상 cost 0이다. 각 router는 다른 routers의 link state messages를 조합해 이 graph database를 만들고, `Dijkstra's algorithm`으로 모든 destination network까지 least-cost path를 계산한다.

![Figure 19.9](@/assets/images/data-communication-256-figure-19-9-page-645.png)
*Figure 19.9 · PDF p. 645 · Router R6를 root로 한 shortest path first tree*

Figure 19.9는 R6 관점의 `SPF (Shortest Path First)` tree다. Tree 자체는 destination까지의 entire route를 보여주지만, forwarding table에 실제로 필요한 것은 각 destination으로 가는 `next hop`이다. 이 점은 Chapter 18의 IP forwarding 원리와 이어진다. IP datagram은 전체 path를 들고 다니지 않고, 각 router가 자기 routing table의 next hop으로 넘긴다.

Table 19.3은 R6의 routing table 예를 보여준다. Destination마다 next hop과 distance만 남아 있으며, OSPF의 graph/SPF tree 계산 결과가 실제 forwarding에 필요한 압축된 형태로 바뀐다는 점이 중요하다. External routes를 advertise하는 routers와 known external networks도 table에 entry로 포함될 수 있다.

### 19.3 Integrated Services Architecture

`Integrated Services Architecture (ISA)`는 IP-based internet에서 `QoS (Quality of Service)` transport를 제공하기 위한 IETF architecture다. 기존 IP internet은 best-effort service에 강했지만, multimedia, multicast, real-time application이 늘어나면서 throughput, delay, jitter, packet loss 요구사항이 application마다 달라졌다. ISA의 목표는 individual flow가 요구하는 QoS를 표현하고, router가 admission control, scheduling, discard policy를 통해 그 요구를 지킬 수 있게 하는 것이다.

#### Elastic Traffic and Inelastic Traffic

Internet traffic은 크게 `elastic traffic`과 `inelastic traffic`으로 나눌 수 있다.

| Traffic type | 의미 | 예 |
|---|---|---|
| `Elastic traffic` | delay와 throughput 변화에 넓은 범위로 적응할 수 있고, 그래도 application 목적을 달성할 수 있는 traffic | FTP, SMTP, TELNET, SNMP, HTTP |
| `Inelastic traffic` | delay/throughput 변화에 적응하기 어렵거나 거의 불가능한 traffic | real-time voice/video, teleconferencing, stock trading |

Elastic traffic도 모두 같은 요구를 갖는 것은 아니다. E-mail은 delay에 둔감하지만, interactive file transfer는 throughput 변화에 민감하다. TELNET이나 Web access는 user interaction 때문에 delay에 민감하다. 여기서 사용자가 느끼는 QoS는 “개별 packet delay”보다는 application element 전체 전송 시간에 가깝다. 작은 element에서는 delay가 중요하고, 큰 file/page/image-rich object에서는 TCP sliding-window throughput과 congestion response가 전체 elapsed time을 좌우한다.

Inelastic traffic은 다음 요구사항을 가진다.

| 요구사항 | 의미 |
|---|---|
| `Throughput` | minimum throughput이 필요할 수 있다. 많은 real-time application은 이 값 아래로 떨어지면 서비스 의미가 사라진다. |
| `Delay` | 늦게 도착하는 것 자체가 손실에 가까운 application이 있다. |
| `Jitter` | delay variation. Real-time stream은 packet interarrival 간격이 일정해야 하므로 jitter buffer가 필요하다. |
| `Packet loss` | application마다 허용 가능한 loss 정도가 다르다. |

Inelastic traffic은 congestion이 와도 TCP처럼 자동으로 back off하지 않는 경우가 많다. 그래서 reservation 없이 inelastic traffic이 늘어나면 elastic TCP traffic이 밀려날 수 있다. ISA는 demanding traffic에 preferential treatment를 제공하되, 기존 elastic traffic도 보호해야 한다.

#### ISA Approach

Best-effort IP router가 congestion을 제어하는 기본 수단은 제한적이다. 하나는 minimum-delay routing으로 load를 어느 정도 balance하는 것이고, 다른 하나는 buffer overflow 시 packet discard를 통해 TCP sender가 back off하게 만드는 것이다. 하지만 real-time/multicast traffic에는 이것만으로 부족하다.

ISA는 각 IP packet을 `flow`와 연관시킨다. RFC 1633의 flow는 “single user activity에서 생기고 동일 QoS를 요구하는 related IP packets의 distinguishable stream”이다. TCP connection과 비슷해 보이지만 두 차이가 있다. ISA flow는 unidirectional이고, multicast flow처럼 recipient가 여러 명일 수 있다. 일반적으로 source/destination IP address, port numbers, protocol type으로 flow membership을 식별한다. IPv6 header의 Flow Label은 ISA flow와 반드시 같지는 않지만, 앞으로 ISA에서 활용될 수 있다.

ISA의 congestion management/QoS functions는 다음과 같다.

| Function | 역할 |
|---|---|
| `Admission control` | 새 flow가 요청한 QoS를 보장할 자원이 충분한지 판단한다. 부족하면 flow를 admit하지 않는다. Reservation에는 `RSVP`가 사용된다. |
| `Routing algorithm` | minimum delay뿐 아니라 QoS parameters를 고려해 route를 선택할 수 있다. OSPF도 QoS 기반 route 선택이 가능하다. |
| `Queuing discipline` | flow/class별 요구사항을 반영해 queue service order를 결정한다. |
| `Discard policy` | buffer가 full일 때 어떤 packet을 drop할지 결정한다. QoS guarantee와 congestion management에 중요하다. |

#### ISA Components in Router

![Figure 19.10](@/assets/images/data-communication-257-figure-19-10-page-649.png)
*Figure 19.10 · PDF p. 649 · ISA router에서 background control functions와 per-packet forwarding functions의 분리*

Figure 19.10에서 굵은 선 아래는 packet마다 실행되는 forwarding functions다. 이 부분은 매우 빠르게 동작해야 하므로 최적화가 중요하다. 굵은 선 위는 background functions로, forwarding이 참조할 database/state를 만든다.

| Component | 위치 | 의미 |
|---|---|---|
| `Reservation protocol` | background | 새 flow의 QoS resource를 reserve한다. End systems와 routers 사이에서 동작하고, path상의 routers에 flow-specific state를 유지한다. RSVP가 이 역할을 한다. |
| `Admission control` | background | requested QoS를 만족할 resources가 충분한지 판단한다. |
| `Routing protocol(s)` | background | routing database를 만들고 route selection에 필요한 정보를 제공한다. |
| `Management agent` | background | network management, configuration, policy control과 연결된다. |
| `Classifier and route selection` | forwarding | IP header fields를 보고 packet을 class/flow에 mapping하고 destination IP address와 class를 바탕으로 next hop을 정한다. |
| `Packet scheduler` | forwarding | output port의 queues를 관리하고 transmission order와 discard selection을 결정한다. Policing도 담당할 수 있다. |

Classifier의 class는 단일 flow일 수도 있고, 같은 QoS 요구사항을 가진 flow 집합일 수도 있다. 예를 들어 모든 video flows, 특정 organization에서 온 flows를 같은 class로 처리할 수 있다.

#### ISA Services and TSpec

ISA service는 두 수준으로 정의된다. 첫째, service category가 general guarantee type을 정한다. 둘째, 특정 flow에 대해서는 parameter values 집합인 `TSpec (Traffic Specification)`이 정확한 service requirement를 정의한다.

ISA의 service categories는 다음과 같다.

| Service | 의미 |
|---|---|
| `Guaranteed service` | assured capacity, firm upper bound on queuing delay, no queuing loss를 제공한다. |
| `Controlled load service` | unloaded best-effort network와 비슷한 behavior를 제공한다. delay upper bound는 없지만 대부분 packet이 minimum transit delay를 크게 넘지 않도록 하고 queuing loss를 거의 없게 한다. |
| `Best effort service` | reserved flow가 아닌 packet의 기본 service다. |

Application은 guaranteed 또는 controlled load QoS에 대해 reservation을 요청하고, TSpec으로 필요한 service 양을 제시한다. Reservation이 받아들여지면, TSpec은 data flow와 service 사이의 contract 일부가 된다. Flow traffic이 TSpec에 맞게 유지되는 한 network는 해당 QoS를 제공해야 한다.

#### Token Bucket Traffic Specification

`Token bucket`은 traffic source의 부하와 burstiness를 간결하게 표현하는 방식이다. TSpec에서 token bucket은 두 parameter로 표현된다.

| Parameter | 의미 |
|---|---|
| `R` | token replenishment rate. 장기간 sustainable average data rate |
| `B` | bucket size. 짧은 기간 동안 R을 초과할 수 있는 burst allowance |

조건은 다음과 같다.

```text
어떤 시간 구간 T 동안 보낼 수 있는 data 양 <= R T + B
```

![Figure 19.11](@/assets/images/data-communication-258-figure-19-11-page-651.png)
*Figure 19.11 · PDF p. 651 · token replenishment rate R과 bucket size B로 traffic burst를 규제하는 token bucket scheme*

Bucket은 “지금 보낼 수 있는 IP data octets 수”를 나타내는 counter로 생각하면 된다. Token은 rate R로 bucket에 쌓이고, bucket size B를 넘으면 버려진다. Packet이 처리되려면 packet data size만큼 token이 있어야 한다. Token이 부족한 packet은 TSpec을 초과한 것이며, ISA 문서는 그 처리를 특정하지 않는다. 흔한 처리 방식은 best-effort service로 강등, discard, future discard 가능성을 표시하는 marking이다.

#### Guaranteed Service vs Controlled Load

`Guaranteed service`는 가장 demanding한 ISA service다. Application이 expected traffic profile을 제공하면, service는 end-to-end delay guarantee를 계산한다. Queueing delay upper bound가 firm해야 하므로 rare long queueing delay까지 덮으려면 delay bound가 크게 잡힐 수 있다. Delay buffer를 사용해 real-time playback을 해야 하고 packet loss를 거의 허용하지 않는 application, hard real-time deadline application에 적합하다.

`Controlled load service`는 adaptive real-time application에 더 잘 맞는다. 명시적인 delay upper bound는 없지만, network가 unloaded best-effort처럼 보이게 충분한 resources를 남겨둔다. Receiver는 실제 jitter를 측정해 playback point를 조정할 수 있다. 예를 들어 video는 frame drop 또는 output stream delay 조정으로 적응하고, voice는 silence periods 조정으로 어느 정도 적응할 수 있다.

| 비교 | Guaranteed service | Controlled load service |
|---|---|---|
| Delay guarantee | specified upper bound 있음 | specified upper bound 없음 |
| Loss | no queuing loss 목표 | very high percentage successful delivery |
| 적합한 application | hard real-time, firm playback delay bound | adaptive real-time |
| 비용/엄격성 | 가장 demanding | guaranteed보다 유연 |

#### Queuing Discipline

전통적인 router는 output port마다 `FIFO (First-In-First-Out)` queue 하나를 유지했다. Packet은 도착 순서대로 queue 뒤에 붙고, router는 오래된 packet부터 보낸다. FIFO는 단순하지만 세 문제가 있다.

| FIFO drawback | 설명 |
|---|---|
| No priority/QoS | delay-sensitive flow나 high-priority packet이 특별 취급을 받지 못한다. |
| Large-packet bias | 작은 packets가 긴 packet 뒤에 줄서면 평균 packet delay가 커지고, 큰 packet flow가 더 좋은 service를 받는 경향이 생긴다. |
| Greedy TCP crowding | back off하지 않는 greedy TCP connection이 같은 path segment의 다른 connection을 더 많이 밀어낼 수 있다. |

![Figure 19.12](@/assets/images/data-communication-259-figure-19-12-page-653.png)
*Figure 19.12 · PDF p. 653 · single FIFO queue와 flow별 fair queuing 구조 비교*

`Fair queuing`은 output port마다 여러 queue를 두고, incoming packet을 해당 flow queue에 넣는다. Simple fair queuing은 nonempty queues를 round-robin으로 돌며 각 busy flow에서 packet 하나씩 보낸다. Greedy flow는 자기 queue만 길어질 뿐 다른 flows의 service를 빼앗지 못한다.

`WFQ (Weighted Fair Queuing)`는 fair queuing을 개선해 각 queue의 traffic amount와 requested service를 고려한다. Busy queue에는 더 많은 capacity를 줄 수 있지만, less busy queue를 완전히 배제하지는 않는다.

#### RSVP: Resource ReSerVation Protocol

`RSVP (Resource ReSerVation Protocol)`는 ISA를 지원하는 reservation protocol이다. Internet이 congestion에 반응만 하는 것이 아니라, application이 QoS를 요청하고 routers가 미리 resource를 reserve함으로써 congestion을 예방하게 한다.

RSVP가 특히 multicast에서 중요한 이유는 multicast source가 고용량이거나 group이 크고 흩어져 있으면 traffic 폭발이 생기기 쉽기 때문이다. 모든 receiver가 모든 source/channel을 원하지 않을 수 있고, 일부 receiver는 enhanced video component 같은 full signal을 처리할 능력이나 link capacity가 없을 수 있다. Reservation은 “누가 어떤 품질로 무엇을 받을 것인가”를 미리 반영해 불필요한 load를 줄인다.

Internet resource reservation은 ATM/frame relay 같은 connection-oriented network의 reservation과 다르다. IP route는 dynamic하게 바뀔 수 있고, route가 바뀌면 reservation도 바뀌어야 한다. 이를 위해 RSVP는 `soft state`를 사용한다. Soft state는 요청자가 주기적으로 refresh하지 않으면 router에서 만료되는 state다. Route가 바뀌면 old path의 soft states는 만료되고, new path에는 새 reservation state가 생긴다.

RSVP의 특징은 다음과 같다.

| Feature | 의미 |
|---|---|
| `Unicast and multicast` | unicast/multicast transmission 모두에 reservation을 만든다. Group membership과 route 변화에 동적으로 적응한다. |
| `Simplex` | unidirectional data flow에 대해 reservation한다. 양방향 exchange는 양방향 각각 별도 reservation이 필요하다. |
| `Receiver-initiated reservation` | data flow의 receiver가 resource reservation을 시작하고 유지한다. |
| `Soft state` | intermediate routers의 reservation state는 주기적으로 refresh되어야 유지된다. |
| `Reservation styles` | 같은 multicast group의 reservations를 중간 switches에서 어떻게 aggregate할지 지정한다. |
| `Transparent through non-RSVP routers` | RSVP와 routing protocol은 독립적이므로 non-RSVP routers가 섞여도 best-effort로 forwarding할 수 있다. |
| `IPv4 and IPv6 support` | IPv4 Type-of-Service field와 IPv6 Flow Label field를 활용할 수 있다. |

### 19.4 Differentiated Services

`Differentiated Services (DS)`는 ISA/RSVP보다 단순하고 확장성 있는 QoS mechanism을 제공하려는 architecture다. ISA와 RSVP는 flow별 signaling과 router state가 필요해 deployment가 복잡하고 large traffic volume에 잘 scale하지 않을 수 있다. DS는 기존 IPv4/IPv6 header의 `DS field`를 이용해 packet을 class로 label하고, routers가 class별로 forwarding treatment를 다르게 적용한다.

DS가 효율적인 이유는 다음과 같다.

| 특성 | 의미 |
|---|---|
| 기존 IP header 활용 | IPv4/IPv6의 DS field를 사용하므로 IP format 자체를 바꿀 필요가 없다. |
| SLA 기반 | customer와 provider가 미리 `SLA (Service Level Agreement)`를 맺으므로 application을 수정할 필요가 없다. |
| Aggregation | 같은 DS octet을 가진 traffic은 network service에서 같은 aggregate로 처리된다. Voice connections를 connection별로 보지 않고 class aggregate로 처리할 수 있다. |
| Router state 최소화 | router는 packet별 DS octet을 보고 queuing/forwarding을 결정하고, flow-specific state를 저장하지 않는다. |

#### DS Domain and Service

`DS domain`은 일관된 DS policies가 적용되는 connected portion of the Internet이다. 보통 하나의 administrative entity가 제어한다. DS domain이 제공하는 service는 SLA에 정의된다. Customer는 DS octet을 mark한 packet을 제출하고, provider는 각 packet class에 대해 합의된 QoS 이상을 제공해야 한다. 이를 위해 provider는 각 router에 DS octet value 기반 forwarding policy를 설정하고, class별 performance를 지속적으로 측정한다.

SLA에 들어갈 수 있는 performance parameters는 expected throughput, drop probability, latency 같은 service performance parameters, service가 제공되는 ingress/egress point constraints, token bucket parameters 같은 traffic profile, profile 초과 traffic 처리 방식 등이다.

DS service 예시는 qualitative/quantitative 성격이 섞여 있다.

| 예 | 성격 |
|---|---|
| service level A traffic은 low latency로 deliver | qualitative, 다른 traffic과 비교해야 의미가 분명하다. |
| service level B traffic은 low loss로 deliver | qualitative |
| service level C의 in-profile traffic 90%는 50 ms 이하 latency | quantitative, 측정 검증 가능 |
| service level D의 in-profile traffic 95%는 deliver | quantitative |
| service level E는 service level F의 두 배 bandwidth | quantitative + comparative |
| drop precedence X traffic은 Y보다 delivery probability가 높음 | qualitative + priority relation |

#### DS Terminology

| Term | 의미 |
|---|---|
| `Behavior Aggregate` | 같은 DS codepoint를 갖고 같은 direction으로 link를 지나는 packet 집합 |
| `Classifier` | DS field만 보는 BA classifier 또는 multiple header/payload fields를 보는 MF classifier |
| `DS Boundary Node` | 다른 DS domain의 node와 연결되는 DS node |
| `DS Interior Node` | DS boundary node가 아닌 DS node |
| `DS Codepoint (DSCP)` | IP header의 8-bit DS field 중 6-bit DSCP 부분의 특정 값 |
| `Per-Hop Behavior (PHB)` | behavior aggregate에 대해 node가 외부에서 관찰 가능하게 적용하는 forwarding behavior |
| `Traffic Conditioning` | TCA 규칙을 강제하기 위한 metering, marking, shaping, dropping control functions |
| `TCA (Traffic Conditioning Agreement)` | classifier가 선택한 packets에 적용할 classifying/traffic conditioning rules |

#### DS Field and Codepoints

![Figure 19.13](@/assets/images/data-communication-260-figure-19-13-page-658.png)
*Figure 19.13 · PDF p. 658 · DS field, class selector codepoints, assured forwarding PHB codepoints*

Packet은 IPv4/IPv6 header 안의 6-bit `DS field` 값, 즉 `DS codepoint (DSCP)`로 service handling label을 가진다. 6 bits이므로 원칙적으로 64개 traffic class를 정의할 수 있다.

DSCP allocation은 세 pool로 나뉜다.

| Codepoint form | 용도 |
|---|---|
| `xxxxx0` | standards assignment용 |
| `xxxx11` | experimental/local use |
| `xxxx01` | experimental/local use, 필요 시 future standards로도 사용 가능 |

`000000`은 default packet class이며 기존 best-effort forwarding behavior를 의미한다. Link capacity가 available할 때 arrival order대로 forwarding되지만, higher-priority DS class packets가 있으면 그쪽이 우선된다. `xxx000` form은 IPv4 precedence service와 backward compatibility를 제공하기 위해 reserved된다.

IPv4 precedence service는 3-bit precedence subfield와 4-bit TOS subfield를 사용했다. Precedence는 router resource allocation의 상대 우선순위를 가리키고, router는 route selection, next-hop network service invocation, queuing discipline에 이를 반영할 수 있다. DS의 class selector codepoints는 최소한 이 IPv4 precedence 기능과 equivalent한 service를 제공해야 한다.

#### DS Configuration and Operation

![Figure 19.14](@/assets/images/data-communication-261-figure-19-14-page-660.png)
*Figure 19.14 · PDF p. 660 · DS domain에서 boundary component와 interior component의 역할 구분*

Figure 19.14처럼 DS domain 내부의 routers는 `boundary nodes`와 `interior nodes`로 구분된다. Interior node는 DS codepoint 값에 따라 PHB를 적용하는 단순 기능을 수행한다. 즉 queuing discipline과 packet-dropping rules를 통해 codepoint별 preferential treatment를 제공한다. Boundary node는 PHB뿐 아니라 더 복잡한 traffic conditioning을 수행한다. DS의 확장성은 “복잡성은 boundary에 몰고, interior는 단순하게 유지한다”는 구조에서 나온다.

Traffic conditioning function은 다섯 요소로 구성된다.

| Element | 역할 |
|---|---|
| `Classifier` | packet을 class로 분리한다. DSCP만 보는 BA classifier 또는 여러 header/payload fields를 보는 MF classifier가 있다. |
| `Meter` | packet stream이 traffic profile을 따르는지 rate 등 temporal properties를 측정한다. |
| `Marker` | 필요하면 packet의 DS codepoint를 새 값으로 re-mark한다. Profile 초과 traffic을 best-effort로 낮추거나 domain boundary에서 codepoint 의미를 변환할 수 있다. |
| `Shaper` | packet을 지연시켜 stream이 지정 traffic rate를 넘지 않게 한다. |
| `Dropper` | profile 초과 rate의 packet을 drop한다. |

![Figure 19.15](@/assets/images/data-communication-262-figure-19-15-page-662.png)
*Figure 19.15 · PDF p. 662 · classifier, meter, marker, shaper/dropper로 구성된 DS traffic conditioner*

Figure 19.15의 흐름은 boundary node 동작의 핵심이다. Packet flow를 classify한 뒤, meter가 traffic agreement 준수 여부를 측정한다. Profile을 초과한 traffic은 lower-quality DSCP로 re-mark되어 통과할 수도 있고, shaper buffer에서 pacing될 수도 있으며, buffer가 포화되면 dropper에 의해 discard될 수도 있다. Bursty host를 다루기 위해 token bucket 같은 traffic profile이 쓰일 수 있다.

#### Per-Hop Behavior: EF and AF

DS 표준화에서 PHB는 differentiated service와 연결되는 구체적인 router forwarding behavior다. 원문 범위의 standards-track PHB는 `EF (Expedited Forwarding)`와 `AF (Assured Forwarding)`다.

`EF PHB`는 DS domains를 지나는 low-loss, low-delay, low-jitter end-to-end service를 위한 building block이다. Endpoint 입장에서는 point-to-point connection 또는 leased line에 가까운 performance처럼 보이게 하는 것이 목표다. Router queueing이 loss/delay/jitter의 원인이므로, EF traffic은 보통 short or empty queues를 만나야 한다. 이를 위해 boundary node가 EF traffic aggregate의 rate/burstiness를 predefined level로 제한하고, interior node는 aggregate의 maximum arrival rate가 minimum departure rate보다 작도록 처리해야 한다.

EF는 특정 queuing policy를 강제하지 않는다. 단순 priority scheme도 가능하지만, EF traffic에 absolute priority를 주면 다른 PHB traffic이 방해받을 위험이 있다. 그래서 실제 구현에서는 더 정교한 queuing policy가 필요할 수 있다.

`AF PHB`는 best-effort보다 좋은 service를 제공하되, per-flow reservation이나 detailed discrimination 없이 동작하도록 설계되었다. 기본 아이디어는 explicit allocation이다.

| Explicit allocation idea | 의미 |
|---|---|
| Service class choice | user에게 aggregate data rate와 burstiness로 정의되는 여러 service classes를 제공한다. |
| Boundary monitoring | boundary node가 traffic profile 준수 여부를 보고 packet을 in/out으로 mark한다. |
| Interior simplicity | network 내부는 user별/flow별 분리 없이 pool로 처리하고, packet의 in/out mark만 구분한다. |
| Congestion drop rule | congestion 시 out packet을 in packet보다 먼저 drop한다. |
| Different service by profile | user마다 in-profile packet 양이 다르기 때문에 서로 다른 service level을 경험한다. |

AF PHB는 이를 확장해 네 개의 AF classes와 class 내부 세 개의 `drop precedence` 값을 정의한다. Congestion이 생기면 DS node는 lower drop precedence packet을 보호하고, higher drop precedence packet을 더 우선적으로 discard한다. Figure 19.13b의 AF codepoints는 class와 drop precedence 조합을 보여준다. AF packet의 forwarding assurance는 해당 AF class에 할당된 forwarding resource, 현재 class load, 그리고 packet drop precedence에 따라 결정된다. RFC 2597은 interior node의 구체 mechanism을 강제하지 않지만, congestion management 방법으로 `RED (Random Early Detection)`를 언급한다.

### 19.5 Service Level Agreements

`SLA(Service Level Agreement)`는 network provider와 customer 사이의 formal contract다. 어떤 서비스를 제공할지, 그 서비스의 성능을 어떤 metric과 threshold로 판단할지, 측정과 보고를 어떻게 할지를 문서화한다. DS나 carrier IP service에서 SLA는 "packet을 class로 표시한다"는 기술적 mechanism과 "그 class가 실제로 어떤 service quality를 받아야 하는가"라는 사업적/운영적 약속을 연결한다.

SLA에는 보통 다음 정보가 포함된다.

| SLA 구성 | 설명 |
|---|---|
| Service description | enterprise location 간 IP connectivity, Internet access, Web hosting, DNS maintenance, operation and maintenance tasks 등 제공 서비스의 성격 |
| Expected performance level | delay, reliability, availability 같은 metrics와 numerical thresholds |
| Monitoring/reporting process | 성능을 어떻게 측정하고, 어떤 주기로 어떻게 보고할지 |

IP network의 SLA parameter는 frame relay나 ATM network의 SLA와 비슷해 보이지만, 실제 보장은 더 어렵다. 이유는 IP가 기본적으로 unreliable datagram service이기 때문이다. Frame relay나 ATM은 connection-oriented service라 path와 resource 제어가 상대적으로 명확하지만, IP는 routing 변화, congestion, packet loss, jitter가 더 동적으로 발생한다. 따라서 IP SLA는 성능 metric의 정의와 측정 방법을 특히 엄밀하게 정해야 한다.

![Figure 19.16](@/assets/images/data-communication-263-figure-19-16-page-665.png)
*Figure 19.16 · PDF p. 665 · provider IP network와 customer networks 사이의 SLA 적용 구조*

Figure 19.16의 전형적 구조에서 provider는 IP-based network를 운영하고, customer는 여러 site의 private networks 또는 LANs를 가진다. 각 customer site는 `access router`를 통해 provider network에 연결된다. SLA는 provider network를 가로질러 access router 사이를 이동하는 traffic의 service/performance level을 정한다. 또한 provider network가 Internet에 연결되어 있으면 enterprise Internet access의 성능도 SLA 범위에 포함될 수 있다.

원문은 MCI의 Internet Dedicated Service 예를 들어 SLA 항목을 보여준다.

| SLA metric | 예시 기준 | 의미 |
|---|---|---|
| `Availability` | 100% availability | service가 사용 가능한 시간 비율 |
| `Latency(delay)` | 미국 본토 access router 간 평균 round-trip 45 ms 이하, New York-London 간 90 ms 이하 | 일정 기간 sample measurement를 평균해 delay를 계산 |
| `Network packet delivery(reliability)` | successful packet delivery rate 99.5% 이상 | IP datagram이 성공적으로 전달되는 비율 |
| `Denial of service(DoS)` | customer trouble ticket 이후 15분 내 대응 | provider 운영 대응 수준까지 SLA에 포함 가능 |
| `Network jitter` | access router 간 1 ms 이하 | packet stream에서 end-to-end delay의 variation |

SLA는 전체 network service에 대해 정의될 수도 있고, carrier network 위의 특정 end-to-end service에 대해 별도로 정의될 수도 있다. 예를 들어 `VPN(Virtual Private Network)`이나 `differentiated services` class별 SLA가 가능하다. 이 점 때문에 SLA는 단순한 계약 문서가 아니라 QoS architecture를 실제 운영 가능한 service로 바꾸는 경계면이다.

### 19.6 IP Performance Metrics

`IPPM(IP Performance Metrics) Working Group`은 IETF에서 Internet data delivery의 quality, performance, reliability를 표준적으로 측정하기 위해 만든 작업 그룹이다. IP network 성능을 말할 때 provider마다 서로 다른 측정 방식과 용어를 쓰면 SLA 검증도, provider 비교도, research도 어려워진다. 그래서 IPPM은 metric 자체의 정의, 측정 방식, 통계 표현을 표준화하려 한다.

IPPM이 필요한 배경은 두 가지다.

| 배경 | 설명 |
|---|---|
| Internet scale 증가 | Internet, intranet, extranet의 topology, capacity, load가 모두 커져 품질과 reliability를 직관적으로 판단하기 어렵다. |
| Application 다양화 | commercial/personal users와 application 범위가 커지고, 일부 application은 delay, jitter, loss 같은 특정 QoS parameter에 민감하다. |

표준 metric은 다음 목적에 사용된다.

| 목적 | 의미 |
|---|---|
| Capacity planning | 큰 internet에서 capacity 증설 지점과 bottleneck을 판단한다. |
| Troubleshooting | 성능 저하가 어디서 발생하는지 추적한다. |
| Provider comparison | service providers를 같은 기준으로 비교하게 한다. |
| Research support | protocol design, congestion control, QoS 연구의 공통 측정 기반을 제공한다. |
| SLA verification | SLA에서 약속한 latency, loss, availability 등을 검증한다. |

#### Singleton, Sample, Statistical Metric

IPPM metric은 세 단계로 정의된다.

| 단계 | 정의 | 예 |
|---|---|---|
| `Singleton metric` | 한 번의 measurement에서 얻는 atomic quantity | 한 packet이 경험한 one-way delay |
| `Sample metric` | 일정 기간 동안 얻은 singleton measurements의 collection | 1시간 동안 측정한 모든 delay 값 |
| `Statistical metric` | sample metric에 통계 함수를 적용해 얻은 값 | mean, median, percentile, minimum |

이 구분이 중요한 이유는 "delay가 얼마인가?"라는 질문이 실제로는 모호하기 때문이다. 한 packet의 delay인지, 특정 시간대의 delay 집합인지, 그 집합의 평균/중앙값/percentile인지가 분리되어야 측정값이 비교 가능하다.

#### Active Measurement와 Passive Measurement

측정 방식은 크게 `active`와 `passive`로 나뉜다.

| 방식 | 장점 | 문제 |
|---|---|---|
| `Active measurement` | measurement packet을 직접 주입하므로 원하는 경로/시간/패턴을 통제하기 쉽다. | 측정 traffic 자체가 load를 증가시켜 delay/congestion을 바꿀 수 있고, DoS처럼 악용될 수 있다. |
| `Passive measurement` | 기존 traffic을 관찰하므로 추가 traffic을 만들지 않는다. | 실제 traffic 내용이 의도치 않은 관찰자에게 노출될 수 있어 security/privacy 문제가 생긴다. |

원문 시점의 IPPM metrics는 모두 active 방식으로 정의되어 있다. 하지만 active measurement는 network를 관찰하면서 동시에 network를 흔드는 도구가 될 수 있으므로, sampling 방식이 중요하다.

가장 단순한 방법은 fixed time intervals로 측정하는 `periodic sampling`이다. 그러나 network traffic이 sampling period와 상관관계를 가지면 측정값이 왜곡될 수 있다. 또한 주기적 measurement traffic이 network synchronization을 유발해 작은 perturbation을 크게 만들 수 있다. 그래서 RFC 2330은 평균 간격은 유지하되 실제 간격은 random하게 만드는 `Poisson sampling`을 권장한다.

#### Table 19.5의 주요 IP Performance Metrics

Table 19.5는 IPPM에서 정의한 주요 metric을 정리한다.

| Metric | Singleton definition | 주요 statistical definitions |
|---|---|---|
| `One-Way Delay` | Src가 packet 첫 bit를 보낸 시각 T부터 Dst가 마지막 bit를 받은 시각 T + dT까지의 dT | percentile, median, minimum, inverse percentile |
| `Round-Trip Delay` | Src가 packet을 보내고 Dst가 즉시 되돌린 packet의 마지막 bit를 Src가 받은 시각까지의 dT | percentile, median, minimum, inverse percentile |
| `One-Way Loss` | packet이 성공적으로 전달되면 0, loss이면 1 | average |
| `One-Way Loss Pattern` | successive packet losses 사이의 distance, consecutive loss로 구성된 loss period | threshold 이하 loss distance 수/비율, loss period 수, period length pattern |
| `Packet Delay Variation (PDV)` | 선택한 두 packet의 one-way delay 차이 | percentile, inverse percentile, jitter, peak-to-peak PDV |
| `Connectivity` | transport connection 위에서 packet을 전달할 수 있는 능력 | one-way/two-way instantaneous, interval, temporal connectivity 등 |
| `Bulk Transfer Capacity (BTC)` | congestion-aware transport connection 하나에서 장기 평균 data rate | `BTC = data sent / elapsed time` |

One-Way Delay와 Round-Trip Delay는 가장 기본적인 latency metric이다. One-Way Delay는 source와 destination의 clock synchronization이 필요하지만 path의 한 방향 성능을 직접 본다. Round-Trip Delay는 측정하기 쉽지만 forward path와 reverse path의 영향을 합친 값이다.

One-Way Loss는 packet delivery reliability를 0/1 singleton으로 표현한다. 여러 packet의 average를 내면 loss rate가 된다. `One-Way Loss Pattern`은 평균 loss rate만으로 보이지 않는 bursty loss를 다룬다. 같은 1% loss라도 고르게 흩어진 loss와 연속 burst loss는 TCP, voice, video에 미치는 영향이 다르다.

![Figure 19.17](@/assets/images/data-communication-264-figure-19-17-page-668.png)
*Figure 19.17 · PDF p. 668 · packet delay variation(PDV)을 정의하기 위한 packet stream과 one-way delay 모델*

Figure 19.17은 `Packet Delay Variation (PDV)`을 정의하는 모델이다. Measurement points `MP1`, `MP2` 사이에서 packet stream의 각 packet `P(i)`, `P(j)`, `P(k)`에 대해 one-way delay `dTi`, `dTj`, `dTk`를 측정한다. PDV singleton은 선택한 두 packet의 delay 차이로 정의된다. 통계 metric은 이 차이의 절댓값들을 모아 percentile, jitter, peak-to-peak PDV 등으로 표현한다. 즉 jitter는 단순히 delay가 큰지 작은지가 아니라, delay가 얼마나 흔들리는지를 측정한다.

`Connectivity`는 specified time limit 안에 packet을 connection across로 deliver할 수 있는지를 본다. `Bulk Transfer Capacity (BTC)`는 congestion control을 사용하는 transport connection 하나가 장기적으로 얼마의 data rate를 얻는지를 측정한다. BTC가 중요한 이유는 사용자가 체감하는 file transfer나 large object download 성능이 단일 packet delay보다 장기 throughput에 더 가깝기 때문이다.

## 장 전체 연결 관계

Chapter 19의 각 절은 독립 주제가 아니라, IP internetwork가 best-effort만으로는 부족해지는 지점들을 순서대로 메운다.

| 흐름 | 연결 |
|---|---|
| `Multicasting` | 같은 data를 여러 receiver에게 보내는 delivery efficiency 문제를 다룬다. |
| `Routing Protocols` | AS 내부/외부에서 path 선택과 reachability advertisement를 다룬다. |
| `Integrated Services Architecture` | flow별 resource reservation으로 QoS를 세밀하게 보장하려는 접근이다. |
| `Differentiated Services` | per-flow state 없이 class aggregation으로 scalable QoS를 제공하려는 접근이다. |
| `SLA` | 기술적 QoS mechanism을 provider-customer 계약과 운영 기준으로 바꾼다. |
| `IP Performance Metrics` | SLA와 QoS가 실제로 지켜졌는지 공통 metric으로 측정한다. |

ISA와 DS는 서로 대체라기보다 설계 지점이 다르다. ISA/RSVP는 receiver-initiated reservation과 per-flow state로 정밀하지만 무겁다. DS는 DSCP와 PHB로 aggregate를 처리해 가볍고 scalable하지만, 세밀한 per-flow guarantee는 SLA, traffic conditioning, provisioning에 의존한다.

## 오해하기 쉬운 내용

| 오해 | 정리 |
|---|---|
| Multicast는 broadcast와 같다. | Broadcast는 subnet의 모든 host에 보내고, multicast는 group membership을 가진 receiver에게만 보내는 것이 목표다. |
| IGMP는 multicast packet을 forwarding한다. | IGMP/IGMPv3는 host-router 사이 group membership을 알리는 protocol이고, router 간 multicast routing은 별도 기능이다. |
| BGP의 AS_PATH는 distance metric이다. | AS_PATH는 loop detection과 policy에 중요하지만, AS 수가 실제 cost/delay/bandwidth를 직접 의미하지 않는다. |
| OSPF는 단순 distance-vector다. | OSPF는 link-state protocol이고, router가 AS topology graph를 구성한 뒤 Dijkstra/SPF를 수행한다. |
| RSVP가 data를 운반한다. | RSVP는 resource reservation signaling protocol이며, data transport는 별도 protocol이 담당한다. |
| DSCP만 정하면 end-to-end QoS가 자동 보장된다. | DSCP는 per-hop behavior 선택 label이다. End-to-end service는 DS domain 정책, SLA, conditioning, provisioning이 맞아야 나온다. |
| SLA 수치는 절대적 진실이다. | 측정 scope, sampling method, statistical definition이 함께 정의되어야 SLA metric이 의미를 가진다. |

## 면접 질문

1. `multiple unicast`, `broadcast`, `true multicast`의 packet copy 수와 network load 차이를 Figure 19.1, Figure 19.2 기준으로 설명하라.
2. IGMPv3의 `INCLUDE` mode와 `EXCLUDE` mode가 왜 source filtering에 필요한지 설명하라.
3. `IRP`와 `ERP`의 역할 차이를 Autonomous System 관점에서 설명하라.
4. BGP의 `Open`, `Update`, `Keepalive`, `Notification` message와 `AS_Path`, `Next_Hop`, `NLRI`의 역할을 설명하라.
5. OSPF가 `Dijkstra` algorithm으로 `SPF tree`를 만든 뒤 routing table을 구성하는 과정을 설명하라.
6. `Integrated Services Architecture`에서 elastic traffic과 inelastic traffic이 요구하는 QoS 차이를 설명하라.
7. `TSpec`과 `token bucket`의 rate `R`, bucket depth `B`가 traffic characterization에 어떤 의미를 가지는지 설명하라.
8. `FIFO`, `fair queuing`, `WFQ`가 congestion 상황에서 flow별 fairness를 어떻게 다르게 제공하는지 설명하라.
9. `RSVP`가 receiver-initiated이고 simplex인 이유를 설명하라.
10. `DSCP`, `PHB`, `traffic conditioner`, `EF PHB`, `AF PHB`의 관계를 설명하라.
11. IP network SLA가 frame relay/ATM SLA보다 성능 보장이 어려운 이유를 설명하라.
12. `singleton metric`, `sample metric`, `statistical metric`을 One-Way Delay 예로 구분하라.

## 핵심 용어 정리

| Term | 의미 |
|---|---|
| `multicasting` | 하나의 source가 multicast group receiver들에게 효율적으로 packet을 전달하는 방식 |
| `IGMP / IGMPv3` | IPv4 host와 router 사이 multicast group membership을 알리는 protocol |
| `INCLUDE / EXCLUDE` | IGMPv3 source filtering에서 허용 source list 또는 제외 source list를 표현하는 mode |
| `Autonomous System (AS)` | 하나의 routing policy와 관리 주체 아래 있는 router/network 집합 |
| `IRP / ERP` | AS 내부 routing protocol / AS 사이 exterior routing protocol |
| `BGP` | path-vector 기반 ERP, AS 사이 reachability와 policy routing을 담당 |
| `OSPF` | link-state 기반 IRP, Dijkstra/SPF로 shortest path tree를 계산 |
| `ISA` | Integrated Services Architecture, flow별 QoS reservation을 목표로 하는 구조 |
| `TSpec` | traffic specification, token bucket parameter로 traffic 특성을 표현 |
| `RSVP` | Resource ReSerVation Protocol, receiver-initiated QoS reservation signaling |
| `DS / DSCP` | Differentiated Services와 packet class를 나타내는 6-bit Differentiated Services Code Point |
| `PHB` | Per-Hop Behavior, DS node가 behavior aggregate에 적용하는 forwarding treatment |
| `EF / AF` | Expedited Forwarding / Assured Forwarding PHB |
| `SLA` | provider와 customer 사이 service level, metric, monitoring을 정의한 계약 |
| `IPPM` | IP Performance Metrics, IP delivery quality/performance/reliability metric 표준화 작업 |
| `PDV / jitter` | Packet Delay Variation, packet stream에서 delay가 흔들리는 정도 |
| `BTC` | Bulk Transfer Capacity, congestion-aware transport connection의 장기 평균 전송률 |
