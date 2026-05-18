---
title: "Chapter 12. Routing in Switched Networks"
order: 12
pubDatetime: 2026-05-18T00:13:00+09:00
modDatetime: 2026-05-18T00:13:00+09:00
description: "Data and Computer Communications 정리: Chapter 12. Routing in Switched Networks"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

**Routing**은 packet-switching network, frame relay, ATM network, Internet/internetwork에서 공통으로 등장하는 핵심 설계 문제다. 목적은 communicating end node 쌍 사이의 route를 정해 network resource를 효율적으로 쓰면서 packet을 destination까지 전달하는 것이다.

이 장은 세 흐름으로 진행된다.

| 세부 주제 | 핵심 질문 | 대표 용어 |
|---|---|---|
| Routing in packet-switching networks | route를 고를 때 어떤 기준과 정보를 쓰는가? | minimum-hop, least-cost, fixed routing, flooding, random, adaptive routing |
| Examples: routing in ARPANET | 실제 packet-switching network는 routing metric을 어떻게 바꾸며 안정성을 얻었는가? | ARPANET, delay metric, oscillation, link state |
| Least-cost algorithms | least-cost path를 계산하는 대표 알고리즘은 무엇인가? | Dijkstra's algorithm, Bellman-Ford algorithm |

## 핵심 개념

### Routing의 요구사항과 긴장 관계

Packet-switching network의 기본 기능은 source station에서 packet을 받아 destination station까지 전달하는 것이다. 이를 위해 network 내부의 여러 possible route 중 하나를 결정해야 한다. Routing function의 요구사항은 다음처럼 정리된다.

| 요구사항 | 의미 |
|---|---|
| correctness | packet이 의도한 destination에 도달해야 한다. |
| simplicity | routing logic이 지나치게 복잡해 processing overhead를 키우지 않아야 한다. |
| robustness | localized failure나 overload가 있어도 다른 route로 전달할 수 있어야 한다. |
| stability | traffic 변화에 반응하되 route가 계속 흔들리거나 loop를 만들지 않아야 한다. |
| fairness | 특정 source-destination pair만 과도하게 유리하지 않아야 한다. |
| optimality | 선택한 criterion에서 좋은 route, 보통 least-cost route를 찾아야 한다. |
| efficiency | routing 정보 교환과 계산 overhead가 얻는 이득보다 크면 안 된다. |

Routing의 어려움은 요구사항들이 서로 충돌한다는 데 있다. Robustness를 높이기 위해 traffic 변화에 민감하게 반응하면, congestion을 한쪽에서 다른 쪽으로 밀어내는 oscillation이 생길 수 있다. Average throughput을 최대화하는 optimality criterion은 가까운 station pair를 더 유리하게 만들어 distant station pair에는 불공정하게 보일 수 있다. 또한 더 좋은 route를 위해 더 많은 정보를 더 자주 교환하면 transmission overhead와 node processing overhead가 커진다.

## 세부 정리

### 12.1 Routing in Packet-Switching Networks

Routing strategy는 여러 설계 요소의 조합으로 만들어진다. Table 12.1의 항목을 개념 중심으로 재구성하면 다음과 같다.

| 설계 축 | 선택지 | 핵심 질문 |
|---|---|---|
| Performance criteria | number of hops, cost, delay, throughput | 좋은 route를 무엇으로 판단할 것인가? |
| Decision time | packet(datagram), session(virtual circuit) | packet마다 route를 정할 것인가, connection setup 때 정할 것인가? |
| Decision place | each node(distributed), central node(centralized), originating node(source) | route 결정 책임을 어디에 둘 것인가? |
| Network information source | none, local, adjacent node, nodes along route, all nodes | route 계산에 어떤 범위의 정보를 쓸 것인가? |
| Network information update timing | continuous, periodic, major load change, topology change | routing 정보를 언제 갱신할 것인가? |

#### Performance Criteria: Minimum-Hop과 Least-Cost

가장 단순한 criterion은 **minimum-hop route**다. Hop은 보통 packet이 source에서 destination으로 가는 동안 지나가는 network-node 간 link 수를 의미한다. Minimum-hop은 측정이 쉽고 network resource consumption을 줄이는 경향이 있다.

더 일반적인 criterion은 **least-cost routing**이다. 각 link에 cost를 부여하고, source-destination pair에 대해 accumulated cost가 가장 작은 route를 찾는다.

![Figure 12.1](@/assets/images/data-communication-154-figure-12-1-page-373.png)
*Figure 12.1 · PDF p. 373 · directed link cost가 붙은 packet-switching network 예시*

Figure 12.1에서 node 1에서 node 6으로 가는 shortest path는 `1-3-6`이고 hop 수는 가장 적지만 cost는 `5 + 5 = 10`이다. 반면 least-cost path는 `1-4-5-6`이고 cost는 `1 + 1 + 2 = 4`다. 이 예는 “짧은 경로”와 “좋은 경로”가 반드시 같지 않다는 점을 보여준다.

Link cost는 설계 목적에 따라 달라진다.

| Cost 정의 | 기대 효과 |
|---|---|
| data rate의 역수 | high data rate link의 cost가 낮아져 throughput이 좋아지는 route를 선호한다. |
| current queuing delay | congestion이 적고 delay가 낮은 route를 선호한다. |
| fixed engineering weight | capacity, reliability, policy 등을 반영한 안정적인 route를 만든다. |

Least-cost criterion은 minimum-hop보다 유연해서 실제 routing algorithm에서 더 자주 쓰인다.

#### Decision Time과 Decision Place

**Decision time**은 route를 언제 정하는가다. Datagram network에서는 packet마다 routing decision을 한다. Virtual circuit network에서는 virtual circuit이 설정될 때 route를 정하고, 이후 packet들은 같은 route를 따른다. 더 정교한 virtual circuit network는 overload나 failure에 대응해 기존 virtual circuit의 route를 동적으로 바꿀 수도 있다.

**Decision place**는 route를 누가 정하는가다.

| 방식 | 설명 | 장단점 |
|---|---|---|
| Distributed routing | 각 node가 incoming packet의 output link를 선택한다. | 복잡하지만 robust하다. |
| Centralized routing | network control center 같은 central node가 route를 결정한다. | 전체 관점 계산은 쉽지만 control center failure가 치명적이다. |
| Source routing | source station이 route를 정해 network에 알려 준다. | user-local criterion을 반영할 수 있지만 source가 network 상태를 알아야 한다. |

Decision time과 decision place는 독립적인 변수다. 예를 들어 distributed datagram routing이면 각 node가 packet마다 다음 hop을 정한다. Distributed virtual circuit routing이면 setup 때 각 node가 결정한 next hop을 기억하고, 이후 같은 virtual circuit packet은 새 decision 없이 forward된다.

#### Network Information Source와 Update Timing

Routing decision에는 topology, traffic load, link cost 정보가 필요할 수 있다. 하지만 flooding처럼 정보 없이도 packet을 전달하는 strategy도 있다.

| Information source | 의미 |
|---|---|
| none | flooding/random처럼 topology/cost 정보를 쓰지 않는다. |
| local | node가 자기 outgoing link cost만 안다. |
| adjacent node | directly connected neighbor의 congestion 같은 정보를 받는다. |
| nodes along route | 관심 route 위 node들에서 정보를 얻는다. |
| all nodes | link-state 계열처럼 전체 network 상태를 수집한다. |

Information update timing은 routing strategy와 정보 범위에 따라 달라진다. Local information은 사실상 continuous하게 알 수 있다. Fixed strategy에서는 routing information이 topology change 전까지 업데이트되지 않는다. Adaptive strategy에서는 periodic update, major load change, topology change 등에 따라 정보를 갱신한다. 정보가 많고 자주 업데이트될수록 좋은 route를 고를 가능성은 높아지지만, 그 정보 교환 자체가 network resource를 소비한다.

#### Fixed Routing

**Fixed routing**은 각 source-destination node pair마다 하나의 permanent route를 설정하는 방식이다. Least-cost algorithm으로 미리 route를 만들 수 있지만, route가 fixed이므로 cost는 current traffic 같은 dynamic variable이 아니라 expected traffic, capacity, topology 같은 안정적인 값에 기반해야 한다.

![Figure 12.2](@/assets/images/data-communication-155-figure-12-2-page-376.png)
*Figure 12.2 · PDF p. 376 · central routing directory에서 각 node별 next-node routing table을 만드는 fixed routing 예*

Fixed routing에서 모든 node pair의 complete route를 저장할 필요는 없다. 각 node는 destination별 **next node**만 알면 된다. 예를 들어 node 1에서 node 6으로 가는 least-cost route가 `1-4-5-6`이면, node 1 table은 destination 6에 대해 next node 4만 저장한다. 이후 node 4는 destination 6에 대해 next node 5를 보고, node 5는 destination 6으로 직접 보낸다.

Fixed routing의 특징은 다음과 같다.

| 항목 | 내용 |
|---|---|
| 장점 | 단순하고, reliable network와 stable load에서는 잘 동작한다. |
| 단점 | congestion이나 failure에 즉시 반응하지 못한다. |
| datagram vs virtual circuit | fixed route라면 둘의 routing 차이가 거의 없다. 같은 source-destination packet은 같은 route를 따른다. |
| 개선 | destination별 alternate next node를 미리 제공하면 link/node outage에 일부 대응할 수 있다. |

#### Flooding

**Flooding**은 network information을 전혀 쓰지 않는 routing technique이다. Source node는 packet copy를 모든 neighbor에게 보내고, 각 intermediate node는 packet이 들어온 link를 제외한 모든 outgoing link로 다시 전송한다.

이 방식은 그냥 두면 packet 수가 무한히 늘어난다. 그래서 다음 제어가 필요하다.

| 제어 방법 | 설명 |
|---|---|
| unique packet identifier | source node + sequence number, 또는 virtual circuit number + sequence number처럼 packet copy를 구분할 식별자를 넣어 destination이 중복 copy를 버리게 한다. |
| duplicate memory | 각 node가 이미 retransmit한 packet identifier를 기억하고 duplicate copy를 버린다. |
| hop count field | packet마다 hop count를 넣고, forwarding할 때마다 1씩 줄이며 0이 되면 discard한다. 초기값은 network diameter 같은 값으로 둘 수 있다. |

![Figure 12.3](@/assets/images/data-communication-156-figure-12-3-page-378.png)
*Figure 12.3 · PDF p. 378 · hop count를 3으로 둔 flooding에서 packet copy가 급격히 늘어나는 예*

Figure 12.3은 node 1에서 node 6으로 packet을 보낼 때 hop count를 3으로 둔 flooding 예다. 첫 hop에서 3개 copy가 생기고, 둘째 hop에서 9개 copy가 생기며, 셋째 hop에서는 총 22개 copy가 추가로 만들어진다. Node 6은 여러 copy를 받을 수 있으므로 첫 copy만 받아들이고 나머지는 discard해야 한다.

Flooding의 성질은 극단적이지만 유용하다.

| 성질 | 의미 |
|---|---|
| 모든 possible route를 시도 | source-destination 사이에 하나라도 path가 남아 있으면 packet이 도착할 가능성이 매우 높다. |
| minimum-hop route도 포함 | 모든 route를 시도하므로 destination에 도착한 copy 중 하나는 minimum-hop route를 사용한다. |
| source와 연결된 모든 node 방문 | routing information dissemination 같은 용도에 쓸 수 있다. |

따라서 flooding은 emergency message, 손상 가능성이 큰 military network, virtual circuit route 초기 설정, routing information 전파에 유용할 수 있다. 하지만 principal disadvantage는 network connectivity에 비례해 매우 큰 traffic load를 만든다는 점이다.

#### Random Routing

**Random routing**은 flooding의 단순성과 robustness를 일부 유지하면서 traffic load를 줄인다. Incoming packet에 대해 node는 packet이 들어온 link를 제외하고 outgoing link 하나만 선택한다. 모든 link를 동일 확률로 고르면 round-robin처럼 구현할 수 있다.

조금 더 정교하게는 outgoing link마다 probability를 부여한다. Data rate 기반 probability는 다음과 같이 표현된다.

$$
P_i = \frac{R_i}{\sum_j R_j}
$$

여기서 `P_i`는 link `i`를 선택할 probability이고, `R_i`는 link `i`의 data rate다. Data rate가 높은 link를 더 자주 선택하므로 traffic distribution이 개선될 수 있다. Probability를 fixed link cost 기반으로 둘 수도 있다.

Random routing도 network information이 필요 없다는 점은 flooding과 같지만, 실제 route는 대체로 least-cost route나 minimum-hop route가 아니다. 따라서 traffic load는 optimum보다 크지만 flooding보다는 훨씬 작다.

#### Adaptive Routing

**Adaptive routing**은 network condition 변화에 따라 routing decision을 바꾸는 방식이다. 실제 packet-switching network에서는 어떤 형태로든 adaptive routing이 널리 쓰인다.

Adaptive routing이 반응하는 주요 조건은 두 가지다.

| 조건 | routing에 미치는 영향 |
|---|---|
| failure | node나 link가 실패하면 route에서 제외해야 한다. |
| congestion | network 일부가 heavily congested이면 그 영역을 우회하는 route를 선호해야 한다. |

Adaptive routing의 대가는 분명하다.

| 비용/위험 | 설명 |
|---|---|
| processing burden | routing decision이 복잡해져 node processing load가 증가한다. |
| information overhead | 상태 정보를 더 많이, 더 자주 교환할수록 decision quality는 좋아지지만 그 정보 자체가 network load가 된다. |
| instability | 너무 빠르게 반응하면 congestion-producing oscillation이 생기고, 너무 느리게 반응하면 정보가 낡아 쓸모없다. |

그럼에도 adaptive routing은 performance를 개선하고, load balancing을 통해 severe congestion onset을 늦출 수 있기 때문에 널리 쓰인다. 다만 제대로 설계하기 어렵기 때문에 ARPANET과 상용 network들은 routing strategy를 크게 개편한 경험이 있다.

Adaptive routing은 information source 기준으로 local, adjacent nodes, all nodes로 나눌 수 있다.

![Figure 12.4](@/assets/images/data-communication-157-figure-12-4-page-380.png)
*Figure 12.4 · PDF p. 380 · local queue length와 destination bias를 함께 쓰는 isolated adaptive routing 예*

Local information만 쓰는 isolated adaptive routing 예로, node가 각 outgoing link의 queue length `Q`만 보고 가장 짧은 queue로 packet을 보내는 방식이 있다. 그러나 queue가 짧은 link가 destination 방향이 아닐 수 있다. 이를 보완하기 위해 destination `i`에 대한 link별 bias `B_i`를 두고, incoming packet의 destination이 `i`이면 `Q + B_i`가 최소인 outgoing link를 고를 수 있다. Figure 12.4에서 node 4는 destination 6에 대해 queue length와 bias를 더한 값이 가장 작은 link, 즉 node 3 방향으로 packet을 보낸다.

Local-only adaptive scheme은 쉽게 얻을 수 있는 neighbor/all-node 정보를 활용하지 못해 드물다. 더 일반적인 distributed adaptive strategy에서는 각 node가 delay information을 다른 node와 교환하고, 받은 정보를 바탕으로 network-wide delay 상황을 추정한 뒤 least-cost routing algorithm을 적용한다. Centralized adaptive strategy에서는 각 node가 link delay status를 central node에 보고하고, central node가 routes를 계산해 다시 nodes에 배포한다.

### 12.2 Examples: Routing in ARPANET

ARPANET routing 사례는 특정 역사 암기보다 adaptive routing이 실제로 어떤 문제를 겪고 어떻게 고쳐졌는지를 보여 주는 좋은 설계 사례다. ARPANET의 routing scheme은 크게 세 단계로 진화했다.

#### First Generation: Delay Vector와 Bellman-Ford 계열

1969년 original routing algorithm은 **distributed adaptive algorithm**이었다. Performance criterion은 estimated delay였고, 알고리즘은 Bellman-Ford 계열이었다.

각 node `i`는 두 vector를 유지한다.

| Vector | 의미 |
|---|---|
| `D_i = [d_i1, ..., d_iN]` | node `i`에서 node `j`까지의 current minimum delay estimate다. `d_ii = 0`이다. |
| `S_i = [s_i1, ..., s_iN]` | node `i`에서 node `j`로 가는 current minimum-delay route의 next node, 즉 successor다. |

각 node는 128 ms마다 neighbor와 delay vector를 교환한다. Node `k`는 neighbor set `A`에 대해 다음 식으로 destination `j`까지의 delay를 갱신한다.

$$
d_{kj} = \min_{i \in A}(d_{ij} + l_{ki})
$$

여기서 `l_ki`는 node `k`에서 neighbor `i`까지의 current link delay estimate다. `s_kj`는 위 값을 최소로 만드는 neighbor `i`가 된다.

![Figure 12.5](@/assets/images/data-communication-158-figure-12-5-page-382.png)
*Figure 12.5 · PDF p. 382 · neighbor delay vector를 받아 node 1 routing table을 갱신하는 original ARPANET algorithm*

![Figure 12.6](@/assets/images/data-communication-159-figure-12-6-page-382.png)
*Figure 12.6 · PDF p. 382 · Figure 12.5 갱신 예시에 사용된 network link cost*

이 original algorithm에서 estimated link delay는 단순히 해당 outgoing link의 **queue length**였다. 그래서 node는 queue가 짧은 outgoing link를 선호하고, 이는 outgoing link 사이 load balancing 효과를 낸다. 하지만 queue length는 매우 빠르게 변한다. Distributed node들이 서로 다른 시점의 queue 정보를 기반으로 route를 바꾸면, packet이 destination을 향해 가기보다 congestion이 낮아 보이는 곳을 계속 찾아다니는 thrashing이 생길 수 있다.

#### Second Generation: 실제 Delay 측정과 Link-State 성격

1979년 replacement algorithm은 여전히 distributed adaptive routing이고 delay를 criterion으로 썼지만, queue length 대신 **measured delay**를 직접 사용했다. 기존 방식의 문제는 세 가지였다.

| 문제 | 설명 |
|---|---|
| line speed 무시 | queue length만 보므로 high-capacity link가 제대로 우대되지 않았다. |
| queue length는 artificial delay measure | packet arrival부터 outbound queue 배치까지의 processing time을 반영하지 못한다. |
| response accuracy 부족 | congestion과 delay increase에 느리게 반응했다. |

새 방식에서는 incoming packet에 arrival time을 찍고, 전송 시 departure time을 기록한다. Positive acknowledgment가 돌아오면 해당 packet의 delay를 `departure time - arrival time + transmission time + propagation delay`로 기록한다. Negative acknowledgment가 오면 다시 시도해 successful transmission delay를 얻는다. 이를 위해 node는 link data rate와 propagation time을 알아야 한다.

각 node는 10초마다 outgoing link별 average delay를 계산하고, significant change가 있으면 flooding으로 모든 node에 알린다. 각 node는 모든 network link의 delay estimate를 유지하고, 새 정보가 오면 **Dijkstra's algorithm**으로 routing table을 다시 계산한다. 이 방식은 delay 정보가 더 현실적이고, flooding overhead도 각 node당 최대 10초에 한 번 수준으로 제한된다.

#### Third Generation: Oscillation을 줄이는 Delay Metric

Second generation은 더 responsive하고 stable했지만, heavy load에서 문제가 드러났다. 핵심 가정은 “현재 measured packet delay가, 모든 node가 그 값을 보고 reroute한 뒤에도 좋은 predictor일 것”이라는 점이었다. Light/moderate traffic에서는 어느 정도 맞지만, heavy traffic에서는 모든 node가 거의 동시에 같은 update를 받고 동시에 route를 바꾸므로 measured delay와 reroute 이후 delay의 correlation이 깨진다.

![Figure 12.7](@/assets/images/data-communication-160-figure-12-7-page-384.png)
*Figure 12.7 · PDF p. 384 · 두 region을 잇는 link A/B 사이에서 traffic이 왕복 이동하며 oscillation이 생기는 상황*

Figure 12.7처럼 두 region 사이를 link A와 B만 잇는다고 하자. 어느 순간 대부분의 traffic이 A에 몰리면 A의 measured delay가 커지고, 이 값이 모든 node에 전달된다. 모든 node가 동시에 routing table을 갱신하면 interregion traffic이 거의 한꺼번에 B로 이동한다. 그러면 B가 congested되고, 다음 update에서는 다시 A로 몰린다. 이 oscillation은 다음 문제를 만든다.

| 문제 | 설명 |
|---|---|
| capacity 낭비 | heavy load에서 필요한 순간에 일부 link capacity가 underutilized된다. |
| congestion 확산 | 특정 link overutilization이 주변 network congestion을 키울 수 있다. |
| update overhead 증가 | measured delay가 크게 흔들려 더 잦은 routing update가 필요해진다. |

ARPANET designers의 결론은 “모든 route에 대해 best path를 주려는 시도들이 서로 충돌한다”는 것이었다. Heavy load에서는 모든 route에 best path를 주려 하기보다, average route에 good path를 주는 것이 더 낫다.

해결책은 전체 algorithm을 바꾸는 것이 아니라 **link cost function**을 바꾸는 것이었다. 측정한 10초 average delay를 그대로 쓰지 않고, utilization 기반 metric으로 변환했다.

1. Measured delay `T`를 single-server queueing model로 link utilization `r` 추정치로 바꾼다.

$$
r = \frac{2(T_s - T)}{T_s - 2T}
$$

여기서 `T_s`는 service time이며, network-wide average packet size 600 bits를 link data rate로 나눈 값으로 설정했다.

2. Utilization estimate를 이전 estimate와 평균내 smoothing한다.

$$
U(n+1) = 0.5 \times r(n+1) + 0.5 \times U(n)
$$

3. Average utilization을 cost value로 변환한다.

![Figure 12.8](@/assets/images/data-communication-161-figure-12-8-page-386.png)
*Figure 12.8 · PDF p. 386 · ARPANET revised routing에서 utilization을 cost로 변환하는 delay metric*

Figure 12.8에서 revised cost function은 utilization이 낮을 때 cost를 minimum으로 유지해 routing overhead를 줄이고, utilization이 높아지면 cost를 올리되 maximum을 minimum의 3배 수준으로 제한한다. 이 maximum은 heavily utilized line을 피하더라도 2 hop보다 더 돌아가는 우회는 과도하다고 제한하는 효과를 낸다.

Satellite link는 terrestrial link보다 propagation delay가 크므로 minimum threshold가 더 높게 설정된다. Light traffic에서는 terrestrial link를 선호하게 하고, heavy traffic에서는 delay 기반 metric보다 capacity 기반 metric처럼 동작하도록 만든다. 요약하면 revised metric은 light load에서는 delay-based metric처럼, heavy load에서는 capacity-based metric처럼 작동해 oscillation을 줄인다.

### 12.3 Least-Cost Algorithms

대부분의 packet-switching network와 internet은 어떤 형태로든 **least-cost criterion**을 사용한다. Link cost는 hop minimization을 원하면 모든 link에 1을 줄 수 있고, 더 일반적으로는 link capacity의 역수, current load, delay, 또는 이들의 조합으로 정의된다. 각 direction의 link cost가 다를 수도 있다. 예를 들어 cost가 outgoing queue length라면, 같은 physical link라도 양방향 queue 상태가 다르므로 direction별 cost가 달라진다.

Least-cost routing problem은 다음처럼 말할 수 있다.

> Bidirectional link로 연결된 node graph가 있고 각 direction마다 link cost가 주어질 때, path cost를 traversed link cost의 합으로 정의한다. 각 node pair에 대해 path cost가 최소인 path를 찾아라.

대표 알고리즘은 **Dijkstra's algorithm**과 **Bellman-Ford algorithm**이다.

#### Dijkstra's Algorithm

**Dijkstra's algorithm**은 주어진 source node `s`에서 모든 다른 node까지의 shortest path를 path length, 즉 cost가 증가하는 순서대로 확정한다. 핵심 아이디어는 이미 least-cost path가 확정된 node 집합 `T`를 키워 가는 것이다.

기호는 다음과 같다.

| 기호 | 의미 |
|---|---|
| `N` | network의 node set |
| `s` | source node |
| `T` | algorithm에 의해 least-cost path가 확정된 node set |
| `w(i,j)` | node `i`에서 node `j`로 가는 link cost. 직접 연결이 없으면 infinity다. |
| `L(n)` | 현재 algorithm이 알고 있는 `s`에서 `n`까지의 least-cost path cost estimate |

절차는 다음과 같이 압축된다.

```text
Initialization:
  T = {s}
  L(n) = w(s, n) for all n != s

Repeat until T = N:
  1. T 밖의 node 중 L(x)가 가장 작은 x를 고른다.
  2. x를 T에 추가하고, x로 이어지는 least-cost last hop edge를 확정한다.
  3. T 밖의 모든 n에 대해:
       L(n) = min[L(n), L(x) + w(x, n)]
```

Step 3은 “방금 확정한 node `x`를 거쳐 `n`으로 가면 더 싸지는가?”를 묻는 relaxation이다. Dijkstra는 매 iteration마다 least-cost path가 확정된 node를 하나씩 추가하며, 최종적으로 source `s`에서 모든 node까지의 least-cost path tree를 만든다.

![Figure 12.9](@/assets/images/data-communication-162-figure-12-9-page-389.png)
*Figure 12.9 · PDF p. 389 · Figure 12.1 graph에 Dijkstra's algorithm을 적용해 T 집합을 확장하는 과정*

Figure 12.9에서 source가 node 1일 때, 확정 집합 `T`는 비용이 작은 node부터 커진다. 최종 결과는 node 1 기준 least-cost paths다.

| Destination | Least-cost path from node 1 | Cost |
|---|---:|---:|
| 2 | `1-2` | 2 |
| 3 | `1-4-5-3` | 3 |
| 4 | `1-4` | 1 |
| 5 | `1-4-5` | 2 |
| 6 | `1-4-5-6` | 4 |

#### Bellman-Ford Algorithm

**Bellman-Ford algorithm**은 source `s`에서 각 destination까지의 shortest path를 “허용되는 최대 link 수”를 늘려 가며 찾는다. 먼저 최대 1-link path, 그 다음 최대 2-link path, 그 다음 최대 3-link path를 찾는 식이다.

기호는 다음과 같다.

| 기호 | 의미 |
|---|---|
| `h` | 현재 stage에서 허용되는 maximum number of links |
| `L_h(n)` | 최대 `h` links를 사용하는 제약 아래 source `s`에서 node `n`까지의 least-cost path cost |

절차는 다음처럼 쓸 수 있다.

```text
Initialization:
  L_0(n) = infinity for all n != s
  L_h(s) = 0 for all h

For each successive h >= 0:
  For each n != s:
    L_{h+1}(n) = min_j [L_h(j) + w(j, n)]
    predecessor(n) = j that achieves the minimum
```

Iteration `h = K`에서 algorithm은 source에서 destination `n`까지 가는 `K+1` links path 후보와 이전 iteration의 shorter path를 비교한다. 더 싼 새 path가 있으면 predecessor를 바꾸고, 아니면 기존 path를 유지한다.

![Figure 12.10](@/assets/images/data-communication-163-figure-12-10-page-391.png)
*Figure 12.10 · PDF p. 391 · Figure 12.1 graph에 Bellman-Ford algorithm을 적용해 h 값을 늘려 가는 과정*

Figure 12.10도 source node 1 기준으로 최종적으로 Dijkstra와 같은 least-cost paths를 얻는다. 차이는 계산의 관점이다. Dijkstra는 “가장 가까운 node를 하나씩 확정”하고, Bellman-Ford는 “사용 가능한 hop 수를 하나씩 늘리며 path estimate를 갱신”한다.

#### Dijkstra와 Bellman-Ford 비교

두 알고리즘의 중요한 차이는 필요한 정보의 범위다.

| 항목 | Dijkstra's algorithm | Bellman-Ford algorithm |
|---|---|---|
| 계산 관점 | 전체 topology에서 source로부터 least-cost node를 하나씩 확정한다. | neighbor의 path cost 정보를 이용해 hop 제한을 늘려가며 갱신한다. |
| 필요한 정보 | 일반적으로 node가 모든 link의 cost, 즉 complete topology information을 알아야 한다. | node가 neighbor까지의 link cost와 neighbor들이 알려주는 path cost 정보를 사용해 갱신할 수 있다. |
| 전파 방식과 친화성 | link-state routing과 잘 맞는다. | distance-vector routing과 잘 맞는다. |
| 수렴 | static topology/link cost에서는 least-cost solution으로 converge한다. | static topology/link cost에서는 같은 solution으로 converge한다. |
| 위험 | link cost가 traffic에 의존하면 route 변경이 traffic을 바꾸고, 다시 cost를 바꾸는 feedback이 생긴다. | 같은 feedback 조건에서 instability가 생길 수 있다. |

Static condition에서는 두 알고리즘 모두 같은 least-cost solution에 수렴한다. 하지만 link cost가 traffic에 따라 계속 바뀌고, traffic이 선택된 route에 따라 다시 바뀌면 feedback loop가 생긴다. ARPANET oscillation 사례가 바로 “least-cost algorithm 자체”보다 “cost metric과 update timing”이 routing stability를 좌우한다는 점을 보여 준다.

## 연결 관계

| 연결 대상 | 이어지는 이유 |
|---|---|
| Chapter 10 Packet Switching | Datagram은 packet마다 routing decision을 하고, virtual circuit은 setup 시 route를 정한다. Chapter 12는 그 decision을 어떻게 계산하는지 설명한다. |
| Chapter 11 ATM | VPC/VCC 설정과 QoS-aware route 선택은 switched network routing의 한 응용이다. |
| Chapter 13 Congestion Control | Adaptive routing은 congestion을 우회하고 load를 balance할 수 있지만, oscillation을 만들 수도 있어 congestion control과 강하게 연결된다. |
| Internet routing | ARPANET에서 발전한 distance-vector/link-state 계열 아이디어는 internetwork routing의 기초가 된다. |
| Graph algorithms | Dijkstra's algorithm, Bellman-Ford algorithm은 network routing을 graph least-cost path problem으로 해석한 대표 예다. |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| minimum-hop route가 항상 최선이다 | hop 수가 적어도 low-capacity/high-delay link를 지나면 cost가 클 수 있다. Figure 12.1에서 `1-3-6`보다 `1-4-5-6`이 least-cost다. |
| fixed routing은 datagram과 virtual circuit에서 완전히 다르다 | route가 fixed이면 source-destination pair의 packet은 같은 route를 따르므로 차이가 거의 없다. |
| flooding은 비효율적이기만 하다 | traffic load는 크지만 robustness, minimum-hop discovery, routing information dissemination에 유용하다. |
| random routing은 optimum route를 찾는다 | network information 없이 하나의 outgoing link를 고르므로 보통 minimum-hop/least-cost route가 아니다. |
| adaptive routing은 항상 더 좋다 | 정보 overhead, processing burden, stale information, congestion-producing oscillation 때문에 잘못 설계하면 성능이 나빠진다. |
| ARPANET 문제는 Bellman-Ford나 Dijkstra 자체의 문제다 | 핵심은 cost metric과 update timing, traffic-dependent feedback이다. |
| Dijkstra와 Bellman-Ford는 다른 답을 내는 알고리즘이다 | static topology와 nonnegative link cost에서는 같은 least-cost solution에 수렴한다. |
| Dijkstra는 neighbor 정보만으로 충분하다 | 일반적인 Dijkstra 적용은 complete topology/link cost information을 요구하며 link-state 방식과 친하다. |

## 핵심 용어

`routing`, `packet-switching network`, `route`, `minimum-hop route`, `least-cost routing`, `least-cost algorithms`, `link cost`, `hop`, `decision time`, `decision place`, `distributed routing`, `centralized routing`, `source routing`, `datagram`, `virtual circuit`, `network information source`, `network information update timing`, `fixed routing`, `alternate routing`, `central routing directory`, `routing table`, `next node`, `flooding`, `packet identifier`, `sequence number`, `hop count`, `network diameter`, `random routing`, `adaptive routing`, `isolated adaptive routing`, `queue length`, `bias`, `congestion`, `failure`, `oscillation`, `ARPANET`, `delay vector`, `successor node vector`, `Bellman-Ford algorithm`, `Dijkstra's algorithm`, `link-state routing`, `distance-vector routing`, `delay metric`, `measured delay`, `link utilization`, `service time`, `smoothing`, `terrestrial link`, `satellite link`, `feedback loop`, `convergence`.

## 면접 질문

1. Packet-switching network에서 routing function의 요구사항인 robustness, stability, fairness, optimality가 서로 충돌하는 예를 설명하라.
2. Minimum-hop routing과 least-cost routing의 차이를 Figure 12.1 예시로 설명하라.
3. Decision time과 decision place는 각각 무엇이며, datagram과 virtual circuit에서 어떻게 달라지는가?
4. Distributed routing, centralized routing, source routing의 장단점을 비교하라.
5. Fixed routing에서 complete route 대신 next node만 저장해도 되는 이유는 무엇인가?
6. Flooding에서 packet explosion을 막기 위한 duplicate identifier와 hop count의 역할을 설명하라.
7. Random routing에서 link data rate 기반 probability `P_i = R_i / sum R_j`가 어떤 효과를 내는가?
8. Adaptive routing이 fixed routing보다 나은 점과 위험한 점을 각각 설명하라.
9. ARPANET first generation routing에서 queue length를 delay metric으로 썼을 때 어떤 문제가 생겼는가?
10. ARPANET second generation에서 measured delay와 flooding update, Dijkstra's algorithm을 사용한 이유는 무엇인가?
11. Heavy load에서 ARPANET routing oscillation이 발생하는 메커니즘을 Figure 12.7 관점에서 설명하라.
12. Revised ARPANET delay metric이 light load에서는 delay-based, heavy load에서는 capacity-based처럼 동작하도록 만든 이유는 무엇인가?
13. Dijkstra's algorithm에서 set `T`와 `L(n)`의 의미를 설명하고, relaxation step이 무엇을 하는지 말해 보라.
14. Bellman-Ford algorithm에서 `h`와 `L_h(n)`의 의미를 설명하고, distance-vector routing과 왜 잘 맞는지 설명하라.
15. Dijkstra's algorithm과 Bellman-Ford algorithm의 정보 요구량과 수렴 조건을 비교하라.
